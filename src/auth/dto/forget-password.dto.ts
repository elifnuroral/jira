import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgetPasswordDto {
  @ApiProperty({
    description: 'email address of the account',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
// Bu sınıf ile sadece geçerli ve boş olmayan e-posta adresleri kabul edilir.
