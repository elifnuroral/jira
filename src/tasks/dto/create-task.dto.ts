import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title', example: 'Task Title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Detailed task description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    example: TaskStatus.NOT_STARTED,
  })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status?: TaskStatus;

  @ApiProperty({
    description: 'Task priority',
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
    required: false, // priority is optional
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiProperty({
    description: 'Due date of the task in ISO 8601 format',
    example: '2025-08-01T12:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string; // ISO 8601 formatında olmalı: "2025-08-01T12:00:00Z"

  @ApiProperty({
    description: 'The user who created the task',
    example: 'Elif Nur Oral',
  })
  @IsString()
  @IsNotEmpty()
  createdBy: string; // Oluşturan kullanıcının ismi

  @ApiProperty({
    description: 'The user assigned to the task',
    example: 'Ece Yılmaz',
    required: false, // assignedTo is optional
  })
  @IsString()
  @IsOptional()
  assignedTo?: string; // Atanan kullanıcının ismi, opsiyonel

  @ApiProperty({
    description: 'ID of the project to which the task belongs',
    example: 1,
    required: false, // projectId is optional
  })
  @IsOptional()
  projectId: number; // Proje ID'si, opsiyonel
}
