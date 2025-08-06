import {
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

export class GetTasksFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsIn(['ASC', 'DESC']) //ASC: ascending yania artan sıra , DESC: descending yani azalan sıra.
  sortOrder?: 'ASC' | 'DESC'; //sortOrder alanı ASC veya DESC değerlerini alabilir.
}
