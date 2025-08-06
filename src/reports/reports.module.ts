import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activitiy-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog])], //ActivityLog entity'sini dahil ediyoruz
  providers: [ReportsService],
  controllers: [ReportsController],
  exports: [ReportsService],
})
export class ReportsModule {}
