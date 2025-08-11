import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'The name of the user for login.',
    example: 'john.doe',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The user’s password.',
    example: 'password123',
    required: true,
  })
  @IsString()
  password: string;
}
