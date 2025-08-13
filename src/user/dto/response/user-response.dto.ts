import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty()
  @Expose() //expose kullandığımızda çıktıd görünmesini istediğimiz kısımlara koyuyoruz.
  id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  role: string; // Entity'de enum da olsa, dışarı string göstermek genelde yeterli
}
