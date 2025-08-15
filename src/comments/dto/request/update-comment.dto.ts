import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 'Mesajı güncelledim.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string; //yorumun içeriğini güncelleme
}
