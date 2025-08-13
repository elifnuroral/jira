import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CreateLogDto } from './dto/create-log.dto';
import { TaskAction } from './enums/task-action.enum';
import { Role } from 'src/user/enums/role.enum';
import { ActivityLog } from './entities/activitiy-log.entity';

// ReportsService'i taklit etmek için mock nesnesi oluşturuyoruz
const mockReportsService = () => ({
  createActivityLog: jest.fn(),
  getActivityLogs: jest.fn(),
  getBurndownData: jest.fn(),
});

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReturnType<typeof mockReportsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService, // Gerçek ReportsService yerine mock'u kullanıyoruz
          useFactory: mockReportsService,
        },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get(ReportsService); // Mock servisimizi alıyoruz
  });

  // Kontrolcünün tanımlandığını kontrol eden basit bir test
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- createActivityLog Endpoint Testleri ---
  describe('createActivityLog', () => {
    it('should call reportsService.createActivityLog with correct data and return the result', async () => {
      // Mock verileri hazırlıyoruz
      const createLogDto: CreateLogDto = {
        userId: 1,
        role: Role.ADMIN,
        action: TaskAction.CREATED,
        taskId: 101,
        projectId: 3,
      };
      const expectedLog = {
        ...createLogDto,
        id: 1,
        timestamp: new Date(),
      } as ActivityLog;

      // Servis metodunun beklenen davranışı
      jest.spyOn(service, 'createActivityLog').mockResolvedValue(expectedLog);

      const result = await controller.createActivityLog(createLogDto);

      // Servis metodunun doğru parametrelerle çağrıldığını kontrol ediyoruz
      expect(service.createActivityLog).toHaveBeenCalledWith(
        createLogDto.userId,
        createLogDto.role,
        createLogDto.action,
        createLogDto.taskId,
      );
      // Kontrolcünün doğru sonucu döndürdüğünü kontrol ediyoruz
      expect(result).toEqual(expectedLog);
    });
  });

  // --- getActivityLogs Endpoint Testleri ---
  describe('getActivityLogs', () => {
    it('should call reportsService.getActivityLogs and return all logs', async () => {
      // Mock verileri hazırlıyoruz
      const mockLogs: ActivityLog[] = [
        {
          id: 1,
          userId: 1,
          role: Role.ADMIN,
          action: TaskAction.CREATED,
          taskId: 101,
          timestamp: new Date(),
          projectId: 1,
        },
        {
          id: 2,
          userId: 2,
          role: Role.USER,
          action: TaskAction.UPDATE,
          taskId: 102,
          timestamp: new Date(),
          projectId: 2,
        },
      ];

      // Servis metodunun beklenen davranışı
      jest.spyOn(service, 'getActivityLogs').mockResolvedValue(mockLogs);

      const result = await controller.getActivityLogs();

      // Servis metodunun çağrıldığını kontrol ediyoruz
      expect(service.getActivityLogs).toHaveBeenCalled();
      // Kontrolcünün doğru sonucu döndürdüğünü kontrol ediyoruz
      expect(result).toEqual(mockLogs);
    });
  });

  // --- getBurndownChart Endpoint Testleri ---
  describe('getBurndownChart', () => {
    it('should call reportsService.getBurndownData with correct parameters and return chart data', async () => {
      // Mock verileri hazırlıyoruz
      const projectId = 1;
      const startDate = '2023-01-01';
      const endDate = '2023-01-03';
      const mockBurndownData = [
        { date: '2023-01-01', completed: 1, inProgress: 2, notStarted: 3 },
      ];

      // Servis metodunun beklenen davranışı
      jest
        .spyOn(service, 'getBurndownData')
        .mockResolvedValue(mockBurndownData);

      const result = await controller.getBurndownChart(
        projectId,
        startDate,
        endDate,
      );

      // Servis metodunun doğru parametrelerle çağrıldığını kontrol ediyoruz
      expect(service.getBurndownData).toHaveBeenCalledWith(
        projectId,
        startDate,
        endDate,
      );
      // Kontrolcünün doğru sonucu döndürdüğünü kontrol ediyoruz
      expect(result).toEqual(mockBurndownData);
    });
  });
});
