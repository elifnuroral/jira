import { Body, Controller, Get, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateLogDto } from './dto/create-log.dto'; // DTO'yu import ediyoruz
import { ActivityLog } from './entities/activitiy-log.entity';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Yeni activity log kaydı oluşturur
  @Post('activity-log')
  async createActivityLog(
    @Body() createLogDto: CreateLogDto, // DTO'yu alıyoruz
  ): Promise<ActivityLog> {
    // Artık dönüşüm işlemi ReportsService içinde yapılacak
    return this.reportsService.createActivityLog(
      createLogDto.userId,
      createLogDto.action, // Enum olarak geliyor, dönüşüm burada yapılacak
      createLogDto.taskId,
    );
  }

  // Tüm activity logları getirir
  @Get('activity-log')
  async getActivityLogs(): Promise<ActivityLog[]> {
    return this.reportsService.getActivityLogs();
  }
}
