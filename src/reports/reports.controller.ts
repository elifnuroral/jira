import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateLogDto } from './dto/create-log.dto'; // DTO'yu import ediyoruz
import { ActivityLog } from './entities/activitiy-log.entity';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { BurndownChartResponseDto } from './dto/reponse/burndown-chart-data.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Yeni activity log kaydı oluşturur
  @Post('activity-log')
  @ApiOperation({ summary: 'Creates a new activity log entry.' })
  @ApiBody({ type: CreateLogDto })
  @ApiResponse({
    status: 201,
    description: 'Activity log created successfully.',
    type: ActivityLog,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid data provided.',
  })
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
  @ApiOperation({ summary: 'Retrieves all activity logs.' })
  @ApiResponse({
    status: 200,
    description: 'A list of all activity logs.',
    type: [ActivityLog],
  })
  async getActivityLogs(): Promise<ActivityLog[]> {
    return this.reportsService.getActivityLogs();
  }

  // Burndown Chart verilerini almak için endpoint
  @Get('burndown-chart/:projectId')
  @ApiOperation({ summary: 'Retrieves burndown chart data for a project.' })
  @ApiParam({
    name: 'projectId',
    type: 'number',
    description: 'The ID of the project to retrieve burndown data for.',
    example: 1,
  })
  @ApiQuery({
    name: 'startDate',
    type: 'string',
    description: 'The start date for the chart data (YYYY-MM-DD).',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    type: 'string',
    description: 'The end date for the chart data (YYYY-MM-DD).',
    example: '2025-01-31',
  })
  @ApiOkResponse({
    type: [BurndownChartResponseDto],
    description: 'Burndown chart data retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Project not found or no tasks within the specified date range.',
  })
  async getBurndownChart(
    @Param('projectId') projectId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<BurndownChartResponseDto[]> {
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
