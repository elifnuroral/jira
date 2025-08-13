import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/user/enums/role.enum';

describe('AuthController', () => {
  let controller: AuthController;

  // AuthService mock’u — generics’i satır kırarak yazdım (prettier için)
  const mockAuthService = {
    login: jest.fn<Promise<{ accessToken: string }>, [LoginDto]>(),
    register: jest.fn<Promise<User>, [CreateUserDto]>(),
    requestPasswordReset: jest.fn<
      Promise<{ message: string }>,
      [ForgetPasswordDto]
    >(),
    resetPassword: jest.fn<Promise<{ message: string }>, [ResetPasswordDto]>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('controller tanımlı olmalı', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/login → signIn', () => {
    it('AuthService.login doğru DTO ile çağrılmalı ve token dönmeli', async () => {
      const dto: LoginDto = { name: 'Elif', password: 'pw' };
      mockAuthService.login.mockResolvedValue({ accessToken: 'token-123' });

      await expect(controller.signIn(dto)).resolves.toEqual({
        accessToken: 'token-123',
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    });

    it('AuthService.login hata atarsa controller da iletmeli', async () => {
      const dto: LoginDto = { name: 'bad', password: 'pw' };
      mockAuthService.login.mockRejectedValue(new UnauthorizedException());

      await expect(controller.signIn(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('POST /auth/register → register', () => {
    it('AuthService.register doğru DTO ile çağrılmalı ve kullanıcı dönmeli', async () => {
      const dto: CreateUserDto = {
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret',
        role: Role.USER,
      };

      const saved = {
        id: 10,
        name: 'Ada',
        email: 'ada@example.com',
        role: 'user',
        password: 'hashed',
      } as unknown as User;

      mockAuthService.register.mockResolvedValue(saved);

      await expect(controller.register(dto)).resolves.toEqual(saved);
      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('POST /auth/request-password-reset → requestPasswordRes', () => {
    it('AuthService.requestPasswordReset doğru DTO ile çağrılmalı ve mesaj dönmeli', async () => {
      const dto: ForgetPasswordDto = { email: 'x@example.com' };
      mockAuthService.requestPasswordReset.mockResolvedValue({
        message:
          'Password reset link has been sent to your email address (logged).',
      });

      await expect(controller.requestPasswordRes(dto)).resolves.toEqual({
        message:
          'Password reset link has been sent to your email address (logged).',
      });

      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(dto);
    });
  });

  describe('POST /auth/reset-password → resetPassword', () => {
    it('AuthService.resetPassword doğru DTO ile çağrılmalı ve başarı mesajı dönmeli', async () => {
      const dto: ResetPasswordDto = {
        token: 't',
        newPassword: 'new',
        confirmPassword: 'new',
      };

      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Your password has been successfully updated.',
      });

      await expect(controller.resetPassword(dto)).resolves.toEqual({
        message: 'Your password has been successfully updated.',
      });

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(dto);
    });
  });
});
