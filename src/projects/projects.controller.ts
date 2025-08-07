import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // Yeni bir proje oluşturma
  @Post()
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    return await this.projectsService.createProject(createProjectDto);
  }

  // Tüm projeleri listeleme
  @Get('all')
  async getAllProjects(): Promise<Project[]> {
    return await this.projectsService.getAllProjects();
  }

  // ID ile proje getirme
  @Get(':id')
  async getProjectById(@Param('id') id: number): Promise<Project | null> {
    return await this.projectsService.getProjectById(id);
  }
}
