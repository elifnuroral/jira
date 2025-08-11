import { IsString, IsEmail, MinLength, IsEnum } from 'class-validator';
import { Role } from '../enums/role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: "User's first and last name.",
    example: 'Elif Nur Oral',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "User's email address (must be unique).",
    example: 'elifnuroral@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "User's password (must be at least 6 characters).",
    example: 'secretpassword',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: "User's role.",
    enum: Role,
    example: Role.USER,
  })
  @IsEnum(Role)
  role: Role;
}
