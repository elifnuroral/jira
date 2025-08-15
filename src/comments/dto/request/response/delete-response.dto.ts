import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class DeleteResponseDto {
  @Expose()
  @ApiProperty({
    example: 'Comment 13 deleted',
    description: 'Silme işlemi sonrası bilgilendirme mesajı.',
  })
  message: string;
}
