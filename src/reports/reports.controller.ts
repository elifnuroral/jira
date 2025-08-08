import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateLogDto } from './dto/create-log.dto'; // DTO'yu import ediyoruz
import { ActivityLog } from './entities/activitiy-log.entity';
import { BurndownChartData } from './interfaces/burndown-chart.interface';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Yeni activity log kaydı oluşturur
  @Post('activity-log')
  async createActivityLog(
    @Body() createLogDto: CreateLogDto, // DTO'yu alıyoruz
  ): Promise<ActivityLog> {
    // Artık dönüşüm işlemi ReportsService içinde yapılacak
    return await this.reportsService.createActivityLog(
      createLogDto.userId,
      createLogDto.role,
      createLogDto.action, // Enum olarak geliyor, dönüşüm burada yapılacak
      createLogDto.taskId,
    );
  }

  // Tüm activity logları getirir
  @Get('activity-log')
  async getActivityLogs(): Promise<ActivityLog[]> {
    return this.reportsService.getActivityLogs();
  }

  // Burndown Chart verilerini almak için endpoint
  @Get('burndown-chart/:projectId')
  async getBurndownChart(
    @Param('projectId') projectId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<BurndownChartData[]> {
    // Dönen veri tipini BurndownChartData[] olarak belirtiyoruz
    // Burndown verisini reportsService üzerinden alıyoruz
    const burndownData = await this.reportsService.getBurndownData(
      projectId,
      startDate,
      endDate,
    );
    return burndownData; // Burndown datasını döndürüyoruz
  }
}
