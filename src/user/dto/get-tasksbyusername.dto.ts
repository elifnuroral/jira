import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetTasksByUserNameDto {
  @ApiProperty({
    description: 'The name of the user whose tasks you want to retrieve.',
    example: 'Elif Nur Oral',
  })
  @IsString()
  name: string;
}
