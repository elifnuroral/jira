import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

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
  async getProjectById(@Param('id') id: number): Promise<Project | null> {
    return await this.projectsService.getProjectById(id);
  }
}
