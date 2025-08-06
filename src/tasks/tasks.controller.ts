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

//@UseGuards(AuthGuard('jwt')) //JWT koruması ekle
@Controller('task')
export class TasksController {
  constructor(
    private readonly taskService: TaskService,
    private readonly reportsService: ReportsService, // ReportsService inject ediliyor
  ) {}

  @Post()
  createTask(@Body() CreateTaskDto: CreateTaskDto): Promise<Task> {
    return this.taskService.createTask(CreateTaskDto);
  }

  // Önce daha spesifik olan rotayı tanımlayın
  //kullanıcı adına göre oluşturduğu görevleri getiren rota
  @Get('created-by-user-id')
  async getTasksByUserName(@Query() filterDto: GetTasksByUserNameDto) {
    const { name } = filterDto;
    return await this.taskService.findTasksByUserName(name);
  }

  //kullanıcıya atanmış görevleri getiren rota
  @Get('assigned-to-user-id')
  async getTasksByAssignedUserName(@Query() filterDto: GetTasksByUserNameDto) {
    const { name } = filterDto;
    return await this.taskService.findTasksByAssignedUserName(name);
  }

  @Get()
  async getTasks(@Query() filterDto: GetTasksFilterDto) {
    const page = filterDto.page ?? 1; //page ve limit değerleri için hep bir varsayılan değer kullan
    const limit = filterDto.limit ?? 10;

    return this.taskService.getFilteredTasks(filterDto, page, limit);
  }

  // Daha genel olan rotayı sonra tanımlayın
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Task | null> {
    return await this.taskService.findOne(id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.taskService.remove(id);
    return { message: `Task with id ${id} has been deleted.` };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.taskService.update(id, updateTaskDto);
  }

  @Patch(':id/status')
  async updateTaskStatus(
    @Param('id') id: number,
    @Body() dto: UpdateTaskStatusDto,
  ): Promise<Task> {
    return await this.taskService.updateTaskStatus(id, dto.status);
  }

  //belirli bir task'in geçmişindeki activity loglarını getiren rota
  @Get(':id/activity-log')
  async getTaskActivityLog(@Param('id') id: number): Promise<ActivityLog[]> {
    // Activity Log'ları, ReportsService üzerinden alıyoruz
    return await this.reportsService.getActivityLogsByTaskId(id);
  }
}
