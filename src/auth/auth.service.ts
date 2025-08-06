import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { User } from 'src/user/entities/user.entity';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { v4 as uuidv4 } from 'uuid'; // rastgele token üretmek için
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Kullanıcının giriş işlemini gerçekleştirir.
   *
   *  Kullanıcı varsa ve şifre doğruysa JWT access token üretir.
   *  Token'ı client'a döner.
   *
   * @param loginDto - Giriş yapan kullanıcının adı ve şifresini içeren DTO.
   * @param bcrypt.compare - Verilen düz şifre, veritabanındaki hash ile uyuşuyor mu diye kontrol eder.
   * @returns accessToken - Başarılı giriş sonrası client'a gönderilecek JWT token.
   * @throws UnauthorizedException - Kullanıcı bulunamazsa veya şifre hatalıysa fırlatılır.
   */

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { name, password } = loginDto;

    const user = await this.userService.findByName(name);

    if (!user) {
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('🔐 Şifre eşleşmesi:', passwordMatch);

    if (!passwordMatch) {
      throw new UnauthorizedException('Geçersiz kimlik bilgileri');
    }

    const payload = { sub: user.id, name: user.name };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async register(registerDto: CreateUserDto): Promise<User> {
    //E-posta adresinin zaten kullanılıp kullanılmadığını kontrol et
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('This email address is already registered.');
      //Conflic yani çakışma hatası fırlatır(409)
    }
    return this.userService.createUser(registerDto);
  }

  async requestPasswordReset(
    forgetPasswordDto: ForgetPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgetPasswordDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No account found with this email address.');
    }

    // 2. Şifre sıfırlama token'ı oluştur
    const resetToken = uuidv4(); // örnek token: "f3c9b3c5-e8b0-4a7e-bc3d-58aaf69dcd18"
    const tokenExpireDate = new Date(Date.now() + 1000 * 60 * 15); // 15 dakika geçerli

    // 3. Token'ı kullanıcıya ata (user tablosunda resetToken ve expireDate alanı olmalı)
    user.resetPasswordToken = resetToken;
    user.resetTokenExpires = tokenExpireDate;
    await this.userService.save(user);

    // 4. Şifre sıfırlama bağlantısını logla (gerçekte e-posta gönderilir)
    console.log(
      `Şifre sıfırlama linki: http://localhost:3000/reset-password?token=${resetToken}`,
    );

    return {
      message:
        'Password reset link has been sent to your email address (logged).',
    };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    // 1. Token ile kullanıcıyı bul
    const user = await this.userService.findByResetToken(token);
    if (
      !user ||
      !user.resetTokenExpires ||
      user.resetTokenExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired token.');
      //kullanıcı var mı , token geçerlilik süresi var mı, tooken geçerlilik süresi geçmiş mi bu 3'ünü kontorl ediyor
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match.',
      );
    }

    // 2. Yeni şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Kullanıcının şifresini güncelle
    user.password = hashedPassword;

    //token ve geçerlilik süresini temizle. bu güvenlik açısından çok önemli
    user.resetPasswordToken = null;
    user.resetTokenExpires = null;

    await this.userService.save(user);

    return { message: 'Your password has been successfully updated.' };
  }
}
