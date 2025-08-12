// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy'; // strateji dosyasının konumu doğru olmalı
console.log(
  'JWT Verify Secret:',
  'faa7ccf01307cc266522d4ed7403b159af7bd564d93eb2a6293693129d0e05ba',
);

@Module({
  imports: [
    //imports ile auth modülü için dışarıdan hangi modülleri kullanacaksam onları belirtiyorum.
    PassportModule,
    JwtModule.register({
      secret:
        'faa7ccf01307cc266522d4ed7403b159af7bd564d93eb2a6293693129d0e05ba',
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [
    AuthService,
    JwtModule, // JwtModule'ü dışa aktararak diğer modüllerin kullanmasına izin veriyoruz
    PassportModule, // PassportModule'ü dışa aktarıyoruz
  ],
})
export class AuthModule {}
