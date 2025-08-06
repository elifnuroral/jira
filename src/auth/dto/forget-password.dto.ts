import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
// Bu sınıf ile sadece geçerli ve boş olmayan e-posta adresleri kabul edilir.
