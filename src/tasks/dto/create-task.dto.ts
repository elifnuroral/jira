import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string; // ISO 8601 formatında olmalı: "2025-08-01T12:00:00Z"

  @IsString()
  @IsNotEmpty()
  createdBy: string; // Oluşturan kullanıcının ismi

  @IsString()
  @IsOptional()
  assignedTo?: string; // Atanan kullanıcının ismi, opsiyonel

  @IsOptional()
  projectId: number; // Proje ID'si, opsiyonel
}
