import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { TaskAction } from './enums/task-action.enum'; // Enum'u import ediyoruz
import { ActivityLog } from './entities/activitiy-log.entity';
import { Role } from 'src/user/enums/role.enum';
import { Task } from 'src/tasks/task.entity';
import { TaskStatus } from 'src/tasks/enums/task-status.enum';
import { BurndownChartData } from './interfaces/burndown-chart.interface';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>, // Task entity'sini de inject ediyoruz
  ) {}

  // Yeni bir activity log kaydı oluşturur
  async createActivityLog(
    userId: number,
    role: string, // Role artık bir string olarak alınıyor
    action: TaskAction, // Action'ı direkt enum olarak alıyoruz
    taskId: number,
    projectId?: number, // Proje ID'si opsiyonel
  ): Promise<ActivityLog> {
    // role değerinin Role enum'unun değerlerinden biri olup olmadığını kontrol edin
    if (!Object.values(Role).includes(role as Role)) {
      throw new Error('Geçersiz role türü');
    }

    // action değerinin TaskAction enum'unun değerlerinden biri olup olmadığını kontrol edin
    if (!Object.values(TaskAction).includes(action)) {
      throw new Error('Geçersiz action türü');
    }

    const log = this.activityLogRepository.create({
      userId,
      role: role as Role, // String değeri doğrudan Role'e atayabilirsiniz
      action,
      taskId,
      projectId,
    });

    return await this.activityLogRepository.save(log);
  }

  // Tüm activity logları getirir
  async getActivityLogs(): Promise<ActivityLog[]> {
    return await this.activityLogRepository.find();
  }

  async getActivityLogsByTaskId(taskId: number): Promise<ActivityLog[]> {
    return await this.activityLogRepository.find({
      where: { taskId },
      order: { timestamp: 'DESC' },
    });
    //taskId'ye göre filtreleme yapıyoruz ve timestamp'e göre azalan sırada yani en güncel işlemler en yukarda olucak şekilde sıralıyoruz
  }

  // Burndown chart verisini döndüren fonksiyon
  async getBurndownData(
    projectId: number,
    startDate: string,
    endDate: string,
  ): Promise<BurndownChartData[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateRange = this.getDateRange(start, end); // Date aralığını alıyoruz.

    const result: BurndownChartData[] = [];

    // Her gün için Burndown data oluşturuluyor
    for (const date of dateRange) {
      const completedTasks = await this.getTaskCountByStatus(
        projectId,
        date,
        TaskStatus.COMPLETED,
      );
      const inProgressTasks = await this.getTaskCountByStatus(
        projectId,
        date,
        TaskStatus.IN_PROGRESS,
      );
      const notStartedTasks = await this.getTaskCountByStatus(
        projectId,
        date,
        TaskStatus.NOT_STARTED,
      );

      result.push({
        date: date.toISOString().split('T')[0], // Tarih formatını YYYY-MM-DD yapıyoruz
        completed: completedTasks,
        inProgress: inProgressTasks,
        notStarted: notStartedTasks,
      });
    }

    return result;
  }

  // Tarih aralığına göre günlük görev verilerini alıyoruz
  private getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1); // Gün bir artırılır
    }

    return dates;
  }

  // Verilen tarihte belirli bir projedeki görev sayısını durumuna göre alıyoruz
  private async getTaskCountByStatus(
    projectId: number,
    date: Date,
    status: TaskStatus,
  ): Promise<number> {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    // Veritabanında belirtilen tarihteki görevleri sayıyoruz
    const tasksCount = await this.taskRepository.count({
      where: {
        projectId,
        status,
        createdAt: Between(date, nextDay),
      },
    });

    return tasksCount;
  }
}
