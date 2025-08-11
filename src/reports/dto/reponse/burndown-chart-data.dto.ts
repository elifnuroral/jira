import { ApiProperty } from '@nestjs/swagger';

export class BurndownChartResponseDto {
  @ApiProperty({
    example: '2025-08-11',
    description: 'Tarihin YYYY-MM-DD formatında gösterimi',
  })
  date: string;

  @ApiProperty({
    example: 5,
    description: 'Tamamlanan görev sayısı',
  })
  completed: number;

  @ApiProperty({
    example: 3,
    description: 'Devam eden görev sayısı',
  })
  inProgress: number;

  @ApiProperty({
    example: 7,
    description: 'Henüz başlamamış görev sayısı',
  })
  notStarted: number;
}
