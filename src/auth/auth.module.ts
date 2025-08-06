import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt'; //JWT kimlik doğrulama ve yetkilendirme işlemleri için kullanılır.
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    //imports ile auth modülü için dışardan hangi modülleri kullanacaksam onları belirtiyorum
    PassportModule,
    JwtModule.register({
      secret: 'your-secret-key', //.env dosyasına alınabilir mantıklı olur.
      signOptions: { expiresIn: '1h' }, //token geçerlilik süresi 1 saat olaraak belirleyebilirsin
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtModule, JwtStrategy],
})
export class AuthModule {}
