import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>, // Project repo
  ) {}

  //yeni bir proje oluşturma
  async createProject(dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create(dto);
    return await this.projectRepository.save(project);
  }

  //tüm projeleri listeleme
  async getAllProjects(): Promise<Project[]> {
    return await this.projectRepository.find();
  }

  //proje is'sine göre proje getirme
  async getProjectById(id: number): Promise<Project | null> {
    return await this.projectRepository.findOne({ where: { id } });
  }
}
