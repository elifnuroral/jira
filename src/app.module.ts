import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TasksModule } from './tasks/tasks.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from './tasks/task.entity';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './reports/reports.module';
import { ActivityLog } from './reports/entities/activitiy-log.entity';
import { ProjectsModule } from './projects/projects.module';
import { Project } from './projects/entities/project.entity';

@Module({
  imports: [
    //imports ile bu modülün dışardan hangi modülleri kullanacağım belirtiyorum
    TypeOrmModule.forRoot({
      //veritabanı bağlantsını yapıyorum
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', // kendi kullanıcı adını gir
      password: '2003', // kendi şifreni gir
      database: 'postgres', // veritabanı adını gir
      entities: [Task, User, ActivityLog, Project], //projemde kullandığım tüm entityleri buraya giriyorum
      synchronize: true, // development aşamasında true olabilir
    }),
    TasksModule,
    UserModule,
    AuthModule,
    ReportsModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
