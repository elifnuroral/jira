import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TaskService } from './tasks.service';
import { Task } from './task.entity';
import { UserModule } from 'src/user/user.module';
import { ReportsModule } from 'src/reports/reports.module';

@Module({
  imports: [TypeOrmModule.forFeature([Task]), UserModule, ReportsModule],
  controllers: [TasksController],
  providers: [TaskService],
})
export class TasksModule {}
