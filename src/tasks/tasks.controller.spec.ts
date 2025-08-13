import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TaskService } from './tasks.service';
import { ReportsService } from 'src/reports/reports.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';

describe('TasksController', () => {
  let controller: TasksController;

  // ---- Service mock'ları ----
  const mockTaskService = {
    createTask: jest.fn(),
    findTasksByUserName: jest.fn(),
    findTasksByAssignedUserName: jest.fn(),
    getFilteredTasks: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    updateTaskStatus: jest.fn(),
  };

  const mockReportsService = {
    getActivityLogsByTaskId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        { provide: TaskService, useValue: mockTaskService },
        { provide: ReportsService, useValue: mockReportsService },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('controller tanımlı olmalı', () => {
    expect(controller).toBeDefined();
  });

  // POST /task
  it('createTask -> TaskService.createTask doğru DTO ile çağrılmalı ve sonucu döndürmeli', async () => {
    const dto: CreateTaskDto = {
      title: 'T1',
      description: 'desc',
      // status/priority vermezsek service default atar
      dueDate: '2025-08-15T00:00:00.000Z',
      createdBy: 'alice',
      assignedTo: 'bob',
      projectId: 10,
    };

    const created = { id: 1, ...dto };
    mockTaskService.createTask.mockResolvedValue(created);

    const result = await controller.createTask(dto);

    expect(mockTaskService.createTask).toHaveBeenCalledWith(dto);
    expect(result).toEqual(created);
  });

  // GET /task/created-by-user-id?name=...
  it('getTasksByUserName -> adı verilen kullanıcıya göre TaskService.findTasksByUserName çağrılmalı', async () => {
    const name = 'alice';
    const tasks = [{ id: 1 }, { id: 2 }];
    mockTaskService.findTasksByUserName.mockResolvedValue(tasks);

    const result = await controller.getTasksByUserName({ name });

    expect(mockTaskService.findTasksByUserName).toHaveBeenCalledWith(name);
    expect(result).toEqual(tasks);
  });

  // GET /task/assigned-to-user-id?name=...
  it('getTasksByAssignedUserName -> adı verilen kullanıcıya göre TaskService.findTasksByAssignedUserName çağrılmalı', async () => {
    const name = 'bob';
    const tasks = [{ id: 3 }];
    mockTaskService.findTasksByAssignedUserName.mockResolvedValue(tasks);

    const result = await controller.getTasksByAssignedUserName({ name });

    expect(mockTaskService.findTasksByAssignedUserName).toHaveBeenCalledWith(
      name,
    );
    expect(result).toEqual(tasks);
  });

  // GET /task?title=...&status=...&priority=...&sortOrder=...&page=&limit=
  it('getTasks -> page/limit verilmediyse varsayılan (1,10) ile TaskService.getFilteredTasks çağrılmalı', async () => {
    const filter: GetTasksFilterDto = {
      title: 'login',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      sortOrder: 'DESC',
      // page, limit yok → default 1 ve 10 kullanılacak
    };
    const response = { data: [], total: 0 };
    mockTaskService.getFilteredTasks.mockResolvedValue(response);

    const result = await controller.getTasks(filter);

    expect(mockTaskService.getFilteredTasks).toHaveBeenCalledWith(
      filter,
      1,
      10,
    );
    expect(result).toEqual(response);
  });

  it('getTasks -> page/limit verilirse aynen aktarılmalı', async () => {
    const filter: GetTasksFilterDto = {
      page: 3,
      limit: 2,
      sortOrder: 'ASC',
    } as GetTasksFilterDto;
    const response = { data: [{ id: 1 }], total: 1 };
    mockTaskService.getFilteredTasks.mockResolvedValue(response);

    const result = await controller.getTasks(filter);

    expect(mockTaskService.getFilteredTasks).toHaveBeenCalledWith(filter, 3, 2);
    expect(result).toEqual(response);
  });

  // GET /task/:id
  it('findOne -> id ile TaskService.findOne çağrılmalı ve sonucu dönmeli', async () => {
    mockTaskService.findOne.mockResolvedValue({ id: 7 });

    const result = await controller.findOne(7);

    expect(mockTaskService.findOne).toHaveBeenCalledWith(7);
    expect(result).toEqual({ id: 7 });
  });

  // DELETE /task/:id
  it('remove -> TaskService.remove çağrılmalı ve onay mesajı dönmeli', async () => {
    mockTaskService.remove.mockResolvedValue(undefined);

    const result = await controller.remove(9);

    expect(mockTaskService.remove).toHaveBeenCalledWith(9);
    expect(result).toEqual({ message: 'Task with id 9 has been deleted.' });
  });

  // PATCH /task/:id
  it('update -> TaskService.update id ve dto ile çağrılmalı, sonucu dönmeli', async () => {
    const dto: UpdateTaskDto = {
      title: 'new title',
      status: TaskStatus.COMPLETED,
    };
    const updated = { id: 11, ...dto };
    mockTaskService.update.mockResolvedValue(updated);

    const result = await controller.update(11, dto);

    expect(mockTaskService.update).toHaveBeenCalledWith(11, dto);
    expect(result).toEqual(updated);
  });

  // PATCH /task/:id/status
  it('updateTaskStatus -> TaskService.updateTaskStatus id ve status ile çağrılmalı, sonucu dönmeli', async () => {
    const dto: UpdateTaskStatusDto = { status: TaskStatus.IN_PROGRESS };
    const updated = { id: 12, status: TaskStatus.IN_PROGRESS };
    mockTaskService.updateTaskStatus.mockResolvedValue(updated);

    const result = await controller.updateTaskStatus(12, dto);

    expect(mockTaskService.updateTaskStatus).toHaveBeenCalledWith(
      12,
      dto.status,
    );
    expect(result).toEqual(updated);
  });

  // GET /task/:id/activity-log
  it('getTaskActivityLog -> ReportsService.getActivityLogsByTaskId çağrılmalı', async () => {
    const logs = [{ id: 1 }, { id: 2 }];
    mockReportsService.getActivityLogsByTaskId.mockResolvedValue(logs);

    const result = await controller.getTaskActivityLog(5);

    expect(mockReportsService.getActivityLogsByTaskId).toHaveBeenCalledWith(5);
    expect(result).toEqual(logs);
  });
});
