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
import { ApiProperty } from '@nestjs/swagger';

export class GetTasksFilterDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'The page number for pagination', // Sayfalama için sayfa numarası
    example: 1,
    required: false,
  })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: 'The number of tasks to display per page', // Sayfa başına gösterilecek görev sayısı
    example: 10,
    required: false,
  })
  limit?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'The title of the task to filter by', // Başlık ile filtreleme
    example: 'Sample Task',
    required: false,
  })
  title?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  @ApiProperty({
    description: 'The status of the task to filter by', // Görev durumuna göre filtreleme
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
    required: false,
  })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  @ApiProperty({
    description: 'The priority of the task to filter by', // Görev önceliğine göre filtreleme
    enum: TaskPriority,
    example: TaskPriority.MEDIUM,
    required: false,
  })
  priority?: TaskPriority;

  @IsOptional()
  @IsIn(['ASC', 'DESC']) //ASC: ascending yania artan sıra , DESC: descending yani azalan sıra.
  @ApiProperty({
    description: 'The order to sort the tasks by', // Görev sıralama düzeni
    enum: ['ASC', 'DESC'],
    example: 'ASC',
    required: false,
  })
  sortOrder?: 'ASC' | 'DESC'; //sortOrder alanı ASC veya DESC değerlerini alabilir.
}
