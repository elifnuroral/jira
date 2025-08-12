import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'The name of the user for login.',
    example: 'Merve Ekşi',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The user’s password.',
    example: 'merve1234',
    required: true,
  })
  @IsString()
  password: string;
}
