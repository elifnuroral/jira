import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Bu taske başlıyorum.',
    description: 'Yorum içeriği',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    example: 123,
    description: 'Yanıt verilen (ebeveyn) yorumun id’si',
  })
  @IsOptional()
  @Type(() => Number) // "123" gelse bile sayıya çevirir
  @IsInt()
  @Min(1)
  parentId?: number;
}
