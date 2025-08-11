import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'The name of the project.',
    example: 'Task Management System',
    required: true,
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'A brief description of the project.',
    example: 'A web application for managing tasks and team projects.',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The ID of the user who owns the project.',
    example: 1,
    required: true,
  })
  @IsNotEmpty()
  ownerId: number; // Sahip kullanıcı ID'si
}
