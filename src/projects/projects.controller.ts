import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { minutes, Throttle } from '@nestjs/throttler';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt')) //JWT koruması ekle
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // Yeni bir proje oluşturma
  @Post()
  @ApiOperation({ summary: 'Creates a new project' })
  @ApiBody({ type: CreateProjectDto })
  @ApiResponse({
    status: 201,
    description: 'The project has been successfully created.',
    type: Project,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. The request body is invalid.',
  })
  @Throttle({ default: { limit: 20, ttl: minutes(1) } }) //1 dakikada aynı IP'den en fazla 20 oluşturma denemesi
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    return await this.projectsService.createProject(createProjectDto);
  }

  // Tüm projeleri listeleme
  @Get('all')
  @ApiOperation({ summary: 'Retrieves all projects' })
  @ApiResponse({
    status: 200,
    description: 'A list of all projects.',
    type: [Project],
  })
  @Throttle({ default: { limit: 120, ttl: minutes(1) } }) //1 dakikada 120 istek
  async getAllProjects(): Promise<Project[]> {
    return await this.projectsService.getAllProjects();
  }

  // ID ile proje getirme
  @Get(':id')
  @ApiOperation({ summary: 'Retrieves a project by its ID' })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'The ID of the project to retrieve.',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'The project with the specified ID.',
    type: Project,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found.',
  })
  @Throttle({ default: { limit: 180, ttl: minutes(1) } }) //1 dakikada 180 tekil proje sorgusu
  async getProjectById(@Param('id') id: number): Promise<Project | null> {
    return await this.projectsService.getProjectById(id);
  }
}
