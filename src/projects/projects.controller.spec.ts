import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

describe('ProjectsController', () => {
  let controller: ProjectsController;

  // Servis mock’unu tipli kuruyoruz (argüman ve dönüş türleri belli olsun diye)
  const mockProjectsService = {
    createProject: jest.fn<Promise<Project>, [CreateProjectDto]>(),
    getAllProjects: jest.fn<Promise<Project[]>, []>(),
    getProjectById: jest.fn<Promise<Project | null>, [number]>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: mockProjectsService }],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  it('controller tanımlı olmalı', () => {
    expect(controller).toBeDefined();
  });

  describe('createProject (POST /projects)', () => {
    it('ProjectsService.createProject doğru DTO ile çağrılmalı ve sonucu dönmeli', async () => {
      // DTO’da zorunlu alanların (ör. name/description) senin şemanla uyumlu olduğundan emin ol
      const dto: CreateProjectDto = {
        name: 'My Project',
        description: 'Test project',
        // DTO’n farklıysa burayı uyarlayabilirsin (ör. ownerId vb.)
      } as CreateProjectDto;

      const created: Project = {
        id: 1,
        name: 'My Project',
        description: 'Test project',
        ownerId: 42,
        tasks: [],
      };

      mockProjectsService.createProject.mockResolvedValue(created);

      const result = await controller.createProject(dto);

      expect(mockProjectsService.createProject).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('getAllProjects (GET /projects/all)', () => {
    it('ProjectsService.getAllProjects çağrılmalı ve listesi dönmeli', async () => {
      const rows: Project[] = [
        { id: 1, name: 'P1', description: 'd1', ownerId: 7, tasks: [] },
        { id: 2, name: 'P2', description: 'd2', ownerId: 7, tasks: [] },
      ];

      mockProjectsService.getAllProjects.mockResolvedValue(rows);

      const result = await controller.getAllProjects();

      expect(mockProjectsService.getAllProjects).toHaveBeenCalled();
      expect(result).toEqual(rows);
    });
  });

  describe('getProjectById (GET /projects/:id)', () => {
    it('bulursa Project döndürmeli', async () => {
      const row: Project = {
        id: 7,
        name: 'P7',
        description: 'd7',
        ownerId: 1,
        tasks: [],
      };

      mockProjectsService.getProjectById.mockResolvedValue(row);

      // Controller imzasında id: number olduğu için doğrudan number veriyoruz
      const result = await controller.getProjectById(7);

      expect(mockProjectsService.getProjectById).toHaveBeenCalledWith(7);
      expect(result).toEqual(row);
    });

    it('bulamazsa null döndürmeli', async () => {
      mockProjectsService.getProjectById.mockResolvedValue(null);

      const result = await controller.getProjectById(999);

      expect(mockProjectsService.getProjectById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });
});
