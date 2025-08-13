import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
  UseGuards,
  //UseGuards,
} from '@nestjs/common';
import { TaskService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './task.entity';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksByUserNameDto } from 'src/user/dto/get-tasksbyusername.dto';
//import { AuthGuard } from '@nestjs/passport';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { ActivityLog } from 'src/reports/entities/activitiy-log.entity';
import { ReportsService } from 'src/reports/reports.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from 'src/user/enums/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { minutes, Throttle } from '@nestjs/throttler';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt')) //JWT koruması ekle
@Controller('task')
export class TasksController {
  constructor(
    private readonly taskService: TaskService,
    private readonly reportsService: ReportsService, // ReportsService inject ediliyor
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new task', // Swagger UI'de bu işlemin açıklaması
    description:
      'Create a task with title, description, status, priority, dueDate, etc.', // Detaylı açıklama
  })
  @Throttle({ default: { limit: 20, ttl: minutes(1) } })
  createTask(@Body() CreateTaskDto: CreateTaskDto): Promise<Task> {
    return this.taskService.createTask(CreateTaskDto);
  }

  // Önce daha spesifik olan rotayı tanımlayın
  //kullanıcı adına göre oluşturduğu görevleri getiren rota
  @Get('created-by-user-id')
  @ApiOperation({
    summary: 'Retrieves all tasks created by a specific user by their name.',
  })
  @ApiQuery({
    type: GetTasksByUserNameDto,
    description: 'The name of the user who created the tasks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tasks created by the user were retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or no tasks were created by this user.',
  })
  @Throttle({ default: { limit: 100, ttl: minutes(1) } })
  async getTasksByUserName(@Query() filterDto: GetTasksByUserNameDto) {
    const { name } = filterDto;
    return await this.taskService.findTasksByUserName(name);
  }

  //kullanıcıya atanmış görevleri getiren rota
  @Get('assigned-to-user-id')
  @ApiOperation({
    summary: 'Retrieves all tasks assigned to a specific user by their name.',
  })
  @ApiQuery({
    type: GetTasksByUserNameDto,
    description: 'The name of the user to whom the tasks are assigned.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tasks assigned to the user were retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found or no tasks were assigned to this user.',
  })
  @Throttle({ default: { limit: 100, ttl: minutes(1) } })
  async getTasksByAssignedUserName(@Query() filterDto: GetTasksByUserNameDto) {
    const { name } = filterDto;
    return await this.taskService.findTasksByAssignedUserName(name);
  }

  @Get()
  @ApiOperation({
    summary: 'Get filtered tasks', // Endpoint'in kısa açıklaması
    description:
      'This endpoint retrieves tasks based on the provided filters such as status, priority, sorting, and pagination options.', // Endpoint'in açıklaması
  })
  @ApiQuery({
    name: 'page', // Sayfalama için query parametresi
    required: false,
    description: 'Page number for pagination', // Sayfa numarasını belirtir
    type: Number, // Parametre tipi Number
    example: 1, // Örnek değer
  })
  @ApiQuery({
    name: 'limit', // Sayfa başına görev sayısı
    required: false,
    description: 'Number of tasks per page', // Sayfa başına kaç görev döndürüleceğini belirtir
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'title',
    required: false,
    description: 'Filter tasks by title', // Başlığa göre filtreleme
    type: String,
    example: 'Sample Task',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter tasks by status', // Duruma göre filtreleme
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], // Enum değerleri
    example: 'IN_PROGRESS',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    description: 'Filter tasks by priority', // Önceliğe göre filtreleme
    enum: ['LOW', 'MEDIUM', 'HIGH'], // Enum değerleri
    example: 'MEDIUM',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort order for the tasks', // Sıralama düzeni
    enum: ['ASC', 'DESC'], // Enum değerleri
    example: 'ASC',
  })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.PROJECT_MANAGER, Role.TEAM_LEADER)
  @Throttle({ default: { limit: 120, ttl: minutes(1) } })
  async getTasks(@Query() filterDto: GetTasksFilterDto) {
    const page = filterDto.page ?? 1; //page ve limit değerleri için hep bir varsayılan değer kullan
    const limit = filterDto.limit ?? 10;

    return this.taskService.getFilteredTasks(filterDto, page, limit);
  }

  // Daha genel olan rotayı sonra tanımlayın
  @Get(':id')
  @ApiOperation({
    summary: 'Get a task by ID', // Endpoint'in kısa açıklaması
    description: 'This endpoint retrieves a task by its unique ID.', // Endpoint'in açıklaması
  })
  @ApiParam({
    name: 'id', // Parametre adı (Task ID)
    description: 'The ID of the task to retrieve', // Parametre açıklaması
    type: Number, // Parametre tipi
    example: 1, // Örnek değer
  })
  @Throttle({ default: { limit: 180, ttl: minutes(1) } })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Task | null> {
    return await this.taskService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a task by ID', // Endpoint'in kısa açıklaması
    description:
      'This endpoint deletes a task by its ID and returns a confirmation message.', // Endpoint'in açıklaması
  })
  @ApiParam({
    name: 'id', // Parametre adı (Task ID)
    description: 'The ID of the task to delete', // Parametre açıklaması
    type: Number, // Parametre tipi
    example: 1, // Örnek değer
  })
  @UseGuards(RolesGuard) // <-- Bu metoda özel Guard'ları ekliyoruz
  @Roles(Role.ADMIN) // <-- Sadece 'ADMIN' rolüne sahip kullanıcıların erişimini sağlıyoruz
  @Throttle({ default: { limit: 30, ttl: minutes(1) } })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.taskService.remove(id);
    return { message: `Task with id ${id} has been deleted.` };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update task information', // Endpoint'in kısa açıklaması
    description:
      'This endpoint allows you to update the details of an existing task.', // Endpoint'in açıklaması
  })
  @ApiParam({
    name: 'id', // Parametre adı (Task ID)
    description: 'The ID of the task to update', // Parametre açıklaması
    type: Number, // Parametre tipi
    example: 1, // Örnek değer
  })
  @ApiBody({
    description: 'Task update request body', // Body açıklaması
    type: UpdateTaskDto, // DTO tipi
  })
  @Throttle({ default: { limit: 30, ttl: minutes(1) } })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.taskService.update(id, updateTaskDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update the status of a task', // Endpoint'in kısa açıklaması
    description:
      'This endpoint updates the status of a specific task based on its ID.', // Endpoint'in açıklaması
  })
  @ApiParam({
    name: 'id', // Parametre adı (Task ID)
    description: 'The ID of the task to update', // Parametre açıklaması
    type: Number, // Parametre tipi
    example: 1, // Örnek değer
  })
  @ApiBody({
    description: 'Task status update request', // Body açıklaması
    type: UpdateTaskStatusDto, // DTO türü
  })
  @Throttle({ default: { limit: 60, ttl: minutes(1) } })
  async updateTaskStatus(
    @Param('id') id: number,
    @Body() dto: UpdateTaskStatusDto,
  ): Promise<Task> {
    return await this.taskService.updateTaskStatus(id, dto.status);
  }

  //belirli bir task'in geçmişindeki activity loglarını getiren rota
  @ApiOperation({
    summary: 'Retrieves activity logs for a task',
    description:
      'Returns all activity logs related to the task with the given ID.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'The ID of the task',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Activity logs retrieved successfully.',
    type: [ActivityLog],
  })
  @ApiResponse({
    status: 404,
    description: 'Task not found or no activity logs.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests — rate limit exceeded.',
  })
  @Get(':id/activity-log')
  @Throttle({ default: { limit: 60, ttl: minutes(1) } })
  async getTaskActivityLog(@Param('id') id: number): Promise<ActivityLog[]> {
    // Activity Log'ları, ReportsService üzerinden alıyoruz
    return await this.reportsService.getActivityLogsByTaskId(id);
  }
}
