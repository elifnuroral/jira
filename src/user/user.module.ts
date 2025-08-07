import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], //******burada User entity'si için repository import ediliyor
  //sadece bu module özel olarak User tablosuyla çalışmamızı sağlar
  controllers: [UserController],
  providers: [UserService], //providerlar bu modül için kullanılacak serviceleri belirtir.
  exports: [UserService, TypeOrmModule], //başka modülde kullanacaksan
})
export class UserModule {}
