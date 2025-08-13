import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TaskService } from './tasks.service';
import { Task } from './task.entity';
import { Project } from 'src/projects/entities/project.entity';
import { UserService } from 'src/user/user.service';
import { ReportsService } from 'src/reports/reports.service';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { TaskAction } from 'src/reports/enums/task-action.enum';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { CreateTaskDto } from './dto/create-task.dto';

// --- Yardımcı tipler (dummy objeler) ---
type DeepMock<T> = {
  [K in keyof T]?: jest.Mock<any, any>;
};

// --- Repository mockları ---
const mockTaskRepository: DeepMock<Repository<Task>> = {
  findAndCount: jest.fn(),
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockProjectRepository: DeepMock<Repository<Project>> = {
  findOne: jest.fn(),
};

// --- Servis mockları ---
const mockUserService = {
  findByName: jest.fn(),
};

const mockReportsService = {
  createActivityLog: jest.fn(),
};

describe('TaskService', () => {
  let service: TaskService;

  // Her testten önce mockları sıfırla
  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: getRepositoryToken(Task), useValue: mockTaskRepository },
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        { provide: UserService, useValue: mockUserService },
        { provide: ReportsService, useValue: mockReportsService },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
  });

  // -------------------------------
  // TEMEL SAĞLIK KONTROLÜ
  // -------------------------------
  it('tanımlı olmalı', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------
  // createTask
  // -------------------------------
  describe('createTask', () => {
    const baseDto: CreateTaskDto = {
      title: 'Title',
      description: 'Desc',
      status: undefined, // default NOT_STARTED bekliyoruz
      priority: undefined, // default MEDIUM bekliyoruz
      dueDate: '2025-08-10T00:00:00.000Z',
      createdBy: 'alice',
      assignedTo: 'bob',
      projectId: 7,
    };

    it('project yoksa hata atmalı', async () => {
      (mockProjectRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.createTask(baseDto)).rejects.toThrow(
        'Project not found',
      );

      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: 7 },
      });
    });

    it('createdBy bulunamazsa NotFoundException atmalı', async () => {
      (mockProjectRepository.findOne as jest.Mock).mockResolvedValue({ id: 7 });
      mockUserService.findByName.mockResolvedValueOnce(null); // createdBy yok

      await expect(service.createTask(baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('assignedTo gönderilmiş ve bulunamazsa NotFoundException atmalı', async () => {
      (mockProjectRepository.findOne as jest.Mock).mockResolvedValue({ id: 7 });
      // ilk çağrı createdBy için
      mockUserService.findByName
        .mockResolvedValueOnce({ id: 1, name: 'alice', role: 'ADMIN' })
        // ikinci çağrı assignedTo için
        .mockResolvedValueOnce(null);

      await expect(service.createTask(baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('mutlu yol: task oluşturmalı, default status/priority set etmeli ve activity log yazmalı', async () => {
      (mockProjectRepository.findOne as jest.Mock).mockResolvedValue({
        id: 7,
        name: 'Proj',
      });

      const alice = { id: 1, name: 'alice', role: 'ADMIN' };
      const bob = { id: 2, name: 'bob', role: 'USER' };

      mockUserService.findByName
        .mockResolvedValueOnce(alice) // createdBy
        .mockResolvedValueOnce(bob); // assignedTo

      const created = {
        id: 10,
        title: baseDto.title,
        description: baseDto.description,
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(baseDto.dueDate),
        createdBy: alice,
        assignedTo: bob,
        project: { id: 7 },
      };

      (mockTaskRepository.create as jest.Mock).mockReturnValue(created);
      (mockTaskRepository.save as jest.Mock).mockResolvedValue(created);

      const result = await service.createTask(baseDto);

      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        title: baseDto.title,
        description: baseDto.description,
        status: TaskStatus.NOT_STARTED,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date(baseDto.dueDate),
        createdBy: alice,
        assignedTo: bob,
        project: { id: 7, name: 'Proj' },
      });
      expect(mockTaskRepository.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);

      expect(mockReportsService.createActivityLog).toHaveBeenCalledWith(
        alice.id,
        alice.role,
        TaskAction.CREATED,
        created.id,
        7,
      );
    });
  });

  // -------------------------------
  // findAll
  // -------------------------------
  describe('findAll', () => {
    it('sayfalama ile taskleri döndürmeli', async () => {
      //it tek bir test senaryosunu tanımlar. testin amacıda içinde yazlır
      const data = [{ id: 1 }, { id: 2 }]; //Burada test sırasında kullanacağımız sahte (mock) veri oluşturuyoruz.
      //data değişkeni, sanki veritabanında iki tane task varmış gibi davranıyor.
      (mockTaskRepository.findAndCount as jest.Mock).mockResolvedValue([
        data,
        2,
      ]);

      const result = await service.findAll(2, 5); //2:page nuamrası(2.sayfa) , 5: limit sayfa başına task sayısı
      expect(mockTaskRepository.findAndCount).toHaveBeenCalledWith({
        skip: (2 - 1) * 5, //ilk 5 kaydı atla demek
        take: 5, //bir sayfada 5 kayıt gelir
      });
      expect(result).toEqual({ data, total: 2 });
    });
  });

  // -------------------------------
  // findOne
  // -------------------------------
  describe('findOne', () => {
    it('id ile task döndürmeli (bulursa)', async () => {
      (mockTaskRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 9 });
      const res = await service.findOne(9);
      expect(mockTaskRepository.findOneBy).toHaveBeenCalledWith({ id: 9 });
      expect(res).toEqual({ id: 9 });
    });
  });

  // -------------------------------
  // remove
  // -------------------------------
  describe('remove', () => {
    it('task yoksa hata atmalı', async () => {
      (mockTaskRepository.findOne as jest.Mock).mockResolvedValue(null);
      await expect(service.remove(5)).rejects.toThrow(
        `ID'si 5 olan görev bulunamadı.`,
      );
    });

    it('task varsa activity log yazıp soft delete yapmalı', async () => {
      const creator = { id: 1, role: 'ADMIN' };
      (mockTaskRepository.findOne as jest.Mock).mockResolvedValue({
        id: 5,
        createdBy: creator,
      });

      (mockTaskRepository.softDelete as jest.Mock).mockResolvedValue({});

      await service.remove(5);

      expect(mockReportsService.createActivityLog).toHaveBeenCalledWith(
        1,
        'ADMIN',
        TaskAction.DELETED,
        5,
      );
      expect(mockTaskRepository.softDelete).toHaveBeenCalledWith(5);
    });
  });

  // -------------------------------
  // update
  // -------------------------------
  describe('update', () => {
    const existing = {
      id: 11,
      title: 'old',
      description: 'old',
      status: TaskStatus.NOT_STARTED,
      priority: TaskPriority.MEDIUM,
      createdBy: { id: 1, name: 'alice', role: 'ADMIN' },
      assignedTo: { id: 2, name: 'bob', role: 'USER' },
    };

    it('task yoksa NotFoundException', async () => {
      (mockTaskRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update(11, { title: 'new' })).rejects.toThrow(
        `ID'si 11 olan görev bulunamadı.`,
      );
    });

    it('createdBy ismi bulunamazsa NotFoundException', async () => {
      (mockTaskRepository.findOne as jest.Mock).mockResolvedValue({
        ...existing,
      });

      mockUserService.findByName.mockResolvedValueOnce(null);

      await expect(
        service.update(11, { createdBy: 'charlie' }),
      ).rejects.toThrow(`"charlie" isimli kullanıcı bulunamadı.`);
    });

    it('assignedTo ismi bulunamazsa NotFoundException', async () => {
      (mockTaskRepository.findOne as jest.Mock).mockResolvedValue({
        ...existing,
      });

      mockUserService.findByName
        .mockResolvedValueOnce({ id: 77, name: 'ok', role: 'ADMIN' }) // createdBy çağrısı varsayılıyor
        .mockResolvedValueOnce(null); // assignedTo

      await expect(
        service.update(11, { createdBy: 'ok', assignedTo: 'bad' }),
      ).rejects.toThrow(`"bad" isimli kullanıcı bulunamadı.`);
    });

    it('mutlu yol: alanları günceller, kaydeder ve activity log yazar', async () => {
      (mockTaskRepository.findOne as jest.Mock).mockResolvedValue({
        ...existing,
      });

      const newCreator = { id: 100, name: 'newCreator', role: 'MANAGER' };
      const newAssignee = { id: 200, name: 'newAssignee', role: 'USER' };

      mockUserService.findByName
        .mockResolvedValueOnce(newCreator) // createdBy
        .mockResolvedValueOnce(newAssignee); // assignedTo

      const afterSave = {
        ...existing,
        title: 'updated title',
        status: TaskStatus.IN_PROGRESS,
        createdBy: newCreator,
        assignedTo: newAssignee,
      };

      (mockTaskRepository.save as jest.Mock).mockResolvedValue(afterSave);

      const dto = {
        title: 'updated title',
        status: TaskStatus.IN_PROGRESS,
        createdBy: 'newCreator',
        assignedTo: 'newAssignee',
      };

      const res = await service.update(11, dto);

      expect(mockTaskRepository.save).toHaveBeenCalled();
      expect(res).toEqual(afterSave);

      expect(mockReportsService.createActivityLog).toHaveBeenCalledWith(
        newCreator.id,
        newCreator.role,
        TaskAction.UPDATE,
        afterSave.id,
      );
    });
  });

  // -------------------------------
  // findTasksByUserName (QueryBuilder)
  // -------------------------------
  describe('findTasksByUserName', () => {
    it('createdBy join ile user.name = :name filtresi kullanmalı', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
      };
      (mockTaskRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const res = await service.findTasksByUserName('elif');

      expect(mockTaskRepository.createQueryBuilder).toHaveBeenCalledWith(
        'task',
      );
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'task.createdBy',
        'user',
      );
      expect(qb.where).toHaveBeenCalledWith('user.name = :name', {
        name: 'elif',
      });
      expect(res).toEqual([{ id: 1 }]);
    });
  });

  // -------------------------------
  // findTasksByAssignedUserName (QueryBuilder)
  // -------------------------------
  describe('findTasksByAssignedUserName', () => {
    it('assignedTo join ile user.name = :name filtresi kullanmalı', async () => {
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 2 }]),
      };
      (mockTaskRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const res = await service.findTasksByAssignedUserName('deniz');

      expect(mockTaskRepository.createQueryBuilder).toHaveBeenCalledWith(
        'task',
      );
      expect(qb.leftJoinAndSelect).toHaveBeenCalledWith(
        'task.assignedTo',
        'user',
      );
      expect(qb.where).toHaveBeenCalledWith('user.name = :name', {
        name: 'deniz',
      });
      expect(res).toEqual([{ id: 2 }]);
    });
  });

  // -------------------------------
  // getFilteredTasks (QueryBuilder + sayfalama + sıralama)
  // -------------------------------
  describe('getFilteredTasks', () => {
    it('title/priority/status ile filtreleyip, DESC sıralayıp sayfalamalı', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
      };
      (mockTaskRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const filter: GetTasksFilterDto = {
        title: 'top',
        priority: TaskPriority.HIGH, // enum/string fark etmiyor; param geçiyoruz
        status: TaskStatus.NOT_STARTED,
        // sortOrder yok → DESC bekleriz
      };

      const res = await service.getFilteredTasks(filter, 2, 10);

      expect(qb.andWhere).toHaveBeenCalledWith('task.title ILIKE :title', {
        title: `%top%`,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('task.priority = :priority', {
        priority: filter.priority,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('task.status = :status', {
        status: filter.status,
      });
      expect(qb.orderBy).toHaveBeenCalledWith('task.createdAt', 'DESC');
      expect(qb.skip).toHaveBeenCalledWith((2 - 1) * 10);
      expect(qb.take).toHaveBeenCalledWith(10);

      expect(res).toEqual({ data: [{ id: 1 }], total: 1 });
    });

    it('sortOrder verildiyse onu kullanmalı (ASC örneği)', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      (mockTaskRepository.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const filter: GetTasksFilterDto = { sortOrder: 'ASC' };
      await service.getFilteredTasks(filter, 1, 5);

      expect(qb.orderBy).toHaveBeenCalledWith('task.createdAt', 'ASC');
    });
  });

  // -------------------------------
  // updateTaskStatus
  // -------------------------------
  describe('updateTaskStatus', () => {
    it('task yoksa NotFoundException', async () => {
      (mockTaskRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateTaskStatus(9, TaskStatus.IN_PROGRESS),
      ).rejects.toThrow(`Task with ID 9 not found`);
    });

    it('IN_PROGRESS ise özel IN_PROGRESS action’u yazmalı', async () => {
      const creator = { id: 1, role: 'ADMIN' };
      const task = {
        id: 9,
        status: TaskStatus.NOT_STARTED,
        createdBy: creator,
      };
      (mockTaskRepository.findOne as jest.Mock).mockResolvedValue(task);

      const saved = { ...task, status: TaskStatus.IN_PROGRESS };
      (mockTaskRepository.save as jest.Mock).mockResolvedValue(saved);

      const res = await service.updateTaskStatus(9, TaskStatus.IN_PROGRESS);

      expect(mockTaskRepository.save).toHaveBeenCalledWith({
        ...task,
        status: TaskStatus.IN_PROGRESS,
      });
      expect(mockReportsService.createActivityLog).toHaveBeenCalledWith(
        1,
        'ADMIN',
        TaskAction.IN_PROGRESS,
        9,
      );
      expect(res).toEqual(saved);
    });

    it('diğer durumlarda STATUS_CHANGED log yazmalı', async () => {
      const creator = { id: 1, role: 'ADMIN' };
      const task = {
        id: 9,
        status: TaskStatus.NOT_STARTED,
        createdBy: creator,
      };
      (mockTaskRepository.findOne as jest.Mock).mockResolvedValue(task);

      const saved = { ...task, status: TaskStatus.COMPLETED };
      (mockTaskRepository.save as jest.Mock).mockResolvedValue(saved);

      await service.updateTaskStatus(9, TaskStatus.COMPLETED);

      expect(mockReportsService.createActivityLog).toHaveBeenCalledWith(
        1,
        'ADMIN',
        TaskAction.STATUS_CHANGED,
        9,
      );
    });
  });
});
