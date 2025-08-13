import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

// "create" aşamasında id olmayabilir; TS için yumuşak bir taslak tip:
type ProjectDraft = Omit<Project, 'id'> & { id?: number };

describe('ProjectsService', () => {
  let service: ProjectsService;

  // TypeORM repo mock’u (tipli)
  const mockProjectRepository = {
    create: jest.fn<Project, [CreateProjectDto]>(),
    save: jest.fn<Promise<Project>, [Project]>(),
    find: jest.fn<Promise<Project[]>, []>(),
    findOne: jest.fn<Promise<Project | null>, [any]>(), // { where: { id } }
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('service tanımlı olmalı', () => {
    expect(service).toBeDefined();
  });

  describe('createProject', () => {
    it('repo.create ve repo.save doğru argümanlarla çağrılmalı ve kayıt döndürmeli', async () => {
      // DTO’nda ownerId varsa böyle; yoksa DTO’yu kendi şemanına göre güncelle.
      const dto: CreateProjectDto = {
        name: 'My Project',
        description: 'Test project',
        // CreateProjectDto’da ownerId zorunlu değilse, serviste set ediyorsan burayı ona göre ayarla
        // ve mockProjectRepository.create çağrısında beklenen alanları sen belirle.
        ownerId: 42,
      } as unknown as CreateProjectDto;

      const createdEntity: ProjectDraft = {
        name: 'My Project',
        description: 'Test project',
        // entity’de zorunlu:
        ownerId: 42,
        tasks: [],
      };

      const savedEntity: Project = {
        id: 1,
        ...createdEntity,
      } as Project;

      mockProjectRepository.create.mockReturnValue(createdEntity as Project);
      mockProjectRepository.save.mockResolvedValue(savedEntity);

      const result = await service.createProject(dto);

      expect(mockProjectRepository.create).toHaveBeenCalledWith(dto);
      expect(mockProjectRepository.save).toHaveBeenCalledWith(
        createdEntity as Project,
      );
      expect(result).toEqual(savedEntity);
    });
  });

  describe('getAllProjects', () => {
    it('repo.find sonucu dönmeli', async () => {
      const rows: Project[] = [
        { id: 1, name: 'P1', description: 'd1', ownerId: 7, tasks: [] },
        { id: 2, name: 'P2', description: 'd2', ownerId: 7, tasks: [] },
      ] as Project[];

      mockProjectRepository.find.mockResolvedValue(rows);

      const result = await service.getAllProjects();

      expect(mockProjectRepository.find).toHaveBeenCalled();
      expect(result).toEqual(rows);
    });
  });

  describe('getProjectById', () => {
    it('bulursa project döndürmeli', async () => {
      const row: Project = {
        id: 7,
        name: 'P7',
        description: 'd7',
        ownerId: 1,
        tasks: [],
      } as Project;

      mockProjectRepository.findOne.mockResolvedValue(row);

      const result = await service.getProjectById(7);

      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: 7 },
      });
      expect(result).toEqual(row);
    });

    it('bulamazsa null döndürmeli', async () => {
      mockProjectRepository.findOne.mockResolvedValue(null);

      const result = await service.getProjectById(999);

      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });
  });
});
