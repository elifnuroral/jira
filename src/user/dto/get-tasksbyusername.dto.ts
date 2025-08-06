import { IsString } from 'class-validator';

export class GetTasksByUserNameDto {
  @IsString()
  name: string;
}
