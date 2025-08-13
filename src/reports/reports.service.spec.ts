import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activitiy-log.entity';
import { Task } from 'src/tasks/task.entity';
import { ProjectsService } from 'src/projects/projects.service';
import { TaskAction } from './enums/task-action.enum';
import { Role } from 'src/user/enums/role.enum';

// Mock repository'lerimizi oluşturuyoruz
const mockActivityLogRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

const mockTaskRepository = () => ({
  count: jest.fn(),
});

// Mock ProjectsService'i oluşturuyoruz
const mockProjectsService = () => ({
  // Projelerle ilgili herhangi bir metodunuz varsa burada taklit edebilirsiniz
});

describe('ReportsService', () => {
  let service: ReportsService;
  let activityLogRepository: ReturnType<typeof mockActivityLogRepository>;
  let taskRepository: ReturnType<typeof mockTaskRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(ActivityLog),
          useFactory: mockActivityLogRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useFactory: mockTaskRepository,
        },
        {
          provide: ProjectsService,
          useFactory: mockProjectsService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    activityLogRepository = module.get(getRepositoryToken(ActivityLog));
    taskRepository = module.get(getRepositoryToken(Task));
  });

  // Servisin tanımlandığını kontrol eden basit bir test
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- createActivityLog ---
  describe('createActivityLog', () => {
    it('should successfully create and save an activity log', async () => {
      // Mock verileri hazırlıyoruz
      const newLog = {
        userId: 1,
        role: Role.ADMIN,
        action: TaskAction.CREATED,
        taskId: 101,
        projectId: 202,
      };

      // Repository'nin beklenen davranışını taklit ediyoruz
      activityLogRepository.create.mockReturnValue(newLog);
      activityLogRepository.save.mockResolvedValue(newLog);

      const result = await service.createActivityLog(
        newLog.userId,
        newLog.role,
        newLog.action,
        newLog.taskId,
        newLog.projectId,
      );

      // Beklenen çağrıları ve sonuçları kontrol ediyoruz
      expect(activityLogRepository.create).toHaveBeenCalledWith({
        userId: newLog.userId,
        role: newLog.role,
        action: newLog.action,
        taskId: newLog.taskId,
        projectId: newLog.projectId,
      });
      expect(activityLogRepository.save).toHaveBeenCalledWith(newLog);
      expect(result).toEqual(newLog);
    });

    it('should throw an error for an invalid role', async () => {
      // Geçersiz bir role değeri ile servisi çağırmayı deniyoruz
      const invalidRole = 'invalid_role';
      await expect(
        service.createActivityLog(1, invalidRole, TaskAction.CREATED, 101),
      ).rejects.toThrowError('Geçersiz role türü');
    });

    it('should throw an error for an invalid action', async () => {
      // Geçersiz bir action değeri ile servisi çağırmayı deniyoruz
      const invalidAction = 'invalid_action' as TaskAction;
      await expect(
        service.createActivityLog(1, Role.ADMIN, invalidAction, 101),
      ).rejects.toThrowError('Geçersiz action türü');
    });
  });

  // --- getActivityLogs ---
  describe('getActivityLogs', () => {
    it('should return all activity logs', async () => {
      // Mock verileri hazırlıyoruz
      const logs = [
        { id: 1, userId: 1, action: TaskAction.CREATED, taskId: 101 },
        { id: 2, userId: 2, action: TaskAction.UPDATE, taskId: 102 },
      ] as ActivityLog[];

      // Repository'nin beklenen davranışını taklit ediyoruz
      activityLogRepository.find.mockResolvedValue(logs);

      const result = await service.getActivityLogs();

      // Beklenen çağrıyı ve sonucu kontrol ediyoruz
      expect(activityLogRepository.find).toHaveBeenCalledWith();
      expect(result).toEqual(logs);
    });
  });

  // --- getActivityLogsByTaskId ---
  describe('getActivityLogsByTaskId', () => {
    it('should return activity logs filtered by taskId and sorted by timestamp', async () => {
      // Mock verileri hazırlıyoruz
      const logs = [
        {
          id: 2,
          timestamp: new Date(),
          taskId: 101,
          action: TaskAction.UPDATE,
        },
        {
          id: 1,
          timestamp: new Date(),
          taskId: 101,
          action: TaskAction.CREATED,
        },
      ] as ActivityLog[];

      // Repository'nin beklenen davranışını taklit ediyoruz
      activityLogRepository.find.mockResolvedValue(logs);

      const taskId = 101;
      const result = await service.getActivityLogsByTaskId(taskId);

      // Beklenen çağrıyı ve sonucu kontrol ediyoruz
      expect(activityLogRepository.find).toHaveBeenCalledWith({
        where: { taskId },
        order: { timestamp: 'DESC' },
      });
      expect(result).toEqual(logs);
    });
  });

  // --- getBurndownData ---
  describe('getBurndownData', () => {
    it('should return burndown chart data for a given date range', async () => {
      const projectId = 1;
      const startDate = '2023-01-01';
      const endDate = '2023-01-03';

      // taskRepository.count metodunun davranışını tek tek taklit ediyoruz
      taskRepository.count
        // 2023-01-01 için
        .mockResolvedValueOnce(1) // completed
        .mockResolvedValueOnce(2) // in progress
        .mockResolvedValueOnce(3) // not started
        // 2023-01-02 için
        .mockResolvedValueOnce(2) // completed
        .mockResolvedValueOnce(1) // in progress
        .mockResolvedValueOnce(2) // not started
        // 2023-01-03 için
        .mockResolvedValueOnce(3) // completed
        .mockResolvedValueOnce(0) // in progress
        .mockResolvedValueOnce(1); // not started

      const expectedResult = [
        { date: '2023-01-01', completed: 1, inProgress: 2, notStarted: 3 },
        { date: '2023-01-02', completed: 2, inProgress: 1, notStarted: 2 },
        { date: '2023-01-03', completed: 3, inProgress: 0, notStarted: 1 },
      ];

      const result = await service.getBurndownData(
        projectId,
        startDate,
        endDate,
      );

      expect(result).toEqual(expectedResult);
      // taskRepository.count metodunun doğru sayıda çağrıldığını kontrol ediyoruz
      expect(taskRepository.count).toHaveBeenCalledTimes(9); // 3 gün * 3 durum
    });
  });
});
