import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TaskService } from './tasks.service';
import { Task } from './task.entity';
import { UserModule } from 'src/user/user.module';
import { ReportsModule } from 'src/reports/reports.module';
import { ProjectsModule } from 'src/projects/projects.module'; // Circular dependency için forwardRef kullanılıyor
import { UserService } from 'src/user/user.service';
import { Project } from 'src/projects/entities/project.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, Project]),
    forwardRef(() => ProjectsModule), // Circular dependency çözümü için
    UserModule,
    ReportsModule,
    AuthModule,
  ],
  controllers: [TasksController],
  providers: [TaskService, UserService, ReportsModule],
  exports: [TaskService], // TaskService'i dışa aktarıyoruz
})
export class TasksModule {}
