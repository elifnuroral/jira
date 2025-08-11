import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TaskAction } from '../enums/task-action.enum';
import { Role } from 'src/user/enums/role.enum';

@Entity()
export class ActivityLog {
  @ApiProperty({
    description: 'The unique ID of the activity log entry.',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The ID of the user who performed the action.',
    example: 101,
  })
  @Column()
  userId: number;

  @ApiProperty({
    description: 'The role of the user when the action was performed.',
    enum: Role,
    example: Role.USER,
  })
  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @ApiProperty({
    description: 'The action that was performed on the task.',
    enum: TaskAction,
    example: TaskAction.CREATED,
  })
  @Column({ nullable: true })
  action: TaskAction;

  @ApiProperty({
    description: 'The ID of the task that was affected.',
    example: 55,
  })
  @Column()
  taskId: number;

  @ApiProperty({
    description: 'The optional ID of the project the task belongs to.',
    example: 20,
    required: false,
  })
  @Column({ nullable: true })
  projectId: number;

  @ApiProperty({
    description: 'The timestamp when the action occurred.',
    example: '2025-08-10T20:30:00.000Z',
  })
  @CreateDateColumn()
  timestamp: Date;
}
