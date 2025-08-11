import { IsInt, IsEnum } from 'class-validator';
import { TaskAction } from '../enums/task-action.enum'; // Enum'u import ediyoruz
import { Role } from 'src/user/enums/role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLogDto {
  @ApiProperty({
    description: 'The ID of the user performing the action.',
    example: 1,
  })
  @IsInt()
  userId: number;

  @ApiProperty({
    description: 'The role of the user.',
    enum: Role,
    example: Role.USER,
  })
  @IsEnum(Role)
  role: Role;

  @ApiProperty({
    description: 'The action performed on the task.',
    enum: TaskAction,
    example: TaskAction.CREATED,
  })
  @IsEnum(TaskAction)
  action: TaskAction;

  @ApiProperty({
    description: 'The ID of the task being acted upon.',
    example: 5,
  })
  @IsInt()
  taskId: number;

  @ApiProperty({
    description: 'The ID of the project the task belongs to (optional).',
    example: 2,
    required: true,
  })
  @IsInt()
  projectId: number;
}
