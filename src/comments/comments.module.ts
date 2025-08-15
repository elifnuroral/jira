import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Task } from 'src/tasks/task.entity';
import { ReportsModule } from 'src/reports/reports.module'; // activity log kullanıyorsan
import { User } from 'src/user/entities/user.entity';
import { Comment } from 'src/comments/entities/comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, Task, User]),
    forwardRef(() => ReportsModule), // mevcutsa
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
