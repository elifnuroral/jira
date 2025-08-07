import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskAction } from './enums/task-action.enum'; // Enum'u import ediyoruz
import { ActivityLog } from './entities/activitiy-log.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
  ) {}

  // Yeni bir activity log kaydı oluşturur
  async createActivityLog(
    userId: number,
    action: TaskAction, // Action'ı direkt enum olarak alıyoruz
    taskId: number,
    projectId?: number, // Proje ID'si opsiyonel
  ): Promise<ActivityLog> {
    //

    const actionEnum = TaskAction[action as keyof typeof TaskAction]; // Dönüştürme işlemi burada yapılacak

    // Geçersiz bir action değeri gönderilmişse, hata fırlatıyoruz
    if (actionEnum === undefined) {
      throw new Error('Geçersiz action türü');
    }

    const log = this.activityLogRepository.create({
      userId,
      action: actionEnum, // Enum'a dönüştürdük
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
}
