import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/user/entities/user.entity';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { Role } from 'src/user/enums/role.enum';

// uuid v4'ü sabitle
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-token'),
}));

describe('AuthService', () => {
  let service: AuthService;

  // ---- Servis mock'ları (tipli) ----
  const mockUserService = {
    findByName: jest.fn<Promise<User | undefined>, [string]>(),
    findByEmail: jest.fn<Promise<User | null>, [string]>(),
    createUser: jest.fn<Promise<User>, [CreateUserDto]>(),
    save: jest.fn<Promise<User>, [User]>(),
    findByResetToken: jest.fn<Promise<User | null>, [string]>(),
  };

  const mockJwtService = {
    sign: jest.fn<string, [any]>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('service tanımlı olmalı', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------
  // login
  // -----------------------------
  describe('login', () => {
    it('kullanıcı bulunamazsa UnauthorizedException', async () => {
      mockUserService.findByName.mockResolvedValue(undefined);

      const dto: LoginDto = { name: 'Elif', password: 'pw' };
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.findByName).toHaveBeenCalledWith('Elif');
    });

    it('şifre yanlışsa UnauthorizedException', async () => {
      const user = {
        id: 1,
        name: 'Elif',
        password: 'hashed',
        role: 'user',
      } as unknown as User;

      mockUserService.findByName.mockResolvedValue(user);

      const compareSpy = jest.spyOn(
        bcrypt,
        'compare',
      ) as unknown as jest.SpyInstance<
        Promise<boolean>,
        [string | Buffer, string]
      >;
      compareSpy.mockResolvedValue(false);

      const dto: LoginDto = { name: 'Elif', password: 'wrong' };
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'hashed');
    });

    it('başarılı girişte token dönmeli', async () => {
      const user = {
        id: 1,
        name: 'Elif',
        password: 'hashed',
        role: 'user',
      } as unknown as User;

      mockUserService.findByName.mockResolvedValue(user);

      const compareSpy = jest.spyOn(
        bcrypt,
        'compare',
      ) as unknown as jest.SpyInstance<
        Promise<boolean>,
        [string | Buffer, string]
      >;
      compareSpy.mockResolvedValue(true);

      mockJwtService.sign.mockReturnValue('signed-token');

      const dto: LoginDto = { name: 'Elif', password: '123456' };
      await expect(service.login(dto)).resolves.toEqual({
        accessToken: 'signed-token',
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        name: 'Elif',
        role: 'user',
      });
    });
  });

  // -----------------------------
  // register
  // -----------------------------
  describe('register', () => {
    it('email zaten kayıtlıysa ConflictException', async () => {
      mockUserService.findByEmail.mockResolvedValue({} as User);

      const dto: CreateUserDto = {
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret',
        role: Role.USER,
      };

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(
        'ada@example.com',
      );
      expect(mockUserService.createUser).not.toHaveBeenCalled();
    });

    it('yeni kullanıcıyı oluşturup döndürmeli', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

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

      mockUserService.createUser.mockResolvedValue(saved);

      await expect(service.register(dto)).resolves.toEqual(saved);
      expect(mockUserService.createUser).toHaveBeenCalledWith(dto);
    });
  });

  // -----------------------------
  // requestPasswordReset
  // -----------------------------
  describe('requestPasswordReset', () => {
    it('email bulunamazsa NotFoundException', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      const dto: ForgetPasswordDto = { email: 'x@example.com' };
      await expect(service.requestPasswordReset(dto)).rejects.toThrow(
        'No account found with this email address.',
      );
    });

    it('token üretip kullanıcıya set etmeli ve save çağrılmalı', async () => {
      const user = { id: 1, email: 'z@example.com' } as unknown as User;
      mockUserService.findByEmail.mockResolvedValue(user);

      const dto: ForgetPasswordDto = { email: 'z@example.com' };

      await expect(service.requestPasswordReset(dto)).resolves.toEqual({
        message:
          'Password reset link has been sent to your email address (logged).',
      });

      const anyDate = expect.any(Date) as unknown as Date;

      expect(mockUserService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          resetPasswordToken: 'mock-token',
          resetTokenExpires: anyDate,
        }),
      );
    });
  });

  // -----------------------------
  // resetPassword
  // -----------------------------
  describe('resetPassword', () => {
    it('token geçersizse BadRequestException', async () => {
      mockUserService.findByResetToken.mockResolvedValue(null);

      const dto: ResetPasswordDto = {
        token: 'bad',
        newPassword: 'a',
        confirmPassword: 'a',
      };

      await expect(service.resetPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('token süresi geçmişse BadRequestException', async () => {
      const user = {
        id: 2,
        resetTokenExpires: new Date(Date.now() - 1000),
      } as unknown as User;

      mockUserService.findByResetToken.mockResolvedValue(user);

      const dto: ResetPasswordDto = {
        token: 't',
        newPassword: 'a',
        confirmPassword: 'a',
      };

      await expect(service.resetPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('parolalar uyuşmazsa BadRequestException', async () => {
      const user = {
        id: 3,
        resetTokenExpires: new Date(Date.now() + 1000 * 60),
      } as unknown as User;

      mockUserService.findByResetToken.mockResolvedValue(user);

      const dto: ResetPasswordDto = {
        token: 't',
        newPassword: 'a',
        confirmPassword: 'b',
      };

      await expect(service.resetPassword(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('başarılı reset: bcrypt.hash, user.save ve alan temizleme', async () => {
      const user = {
        id: 4,
        resetTokenExpires: new Date(Date.now() + 1000 * 60),
        resetPasswordToken: 't',
        password: 'old',
      } as unknown as User;

      mockUserService.findByResetToken.mockResolvedValue(user);

      const hashSpy = jest.spyOn(bcrypt, 'hash') as unknown as jest.SpyInstance<
        Promise<string>,
        [string | Buffer, number]
      >;
      hashSpy.mockResolvedValue('new_hashed_pw');

      const dto: ResetPasswordDto = {
        token: 't',
        newPassword: 'new',
        confirmPassword: 'new',
      };

      await expect(service.resetPassword(dto)).resolves.toEqual({
        message: 'Your password has been successfully updated.',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('new', 10);
      expect(mockUserService.save).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'new_hashed_pw',
          resetPasswordToken: null,
          resetTokenExpires: null,
        }),
      );
    });
  });
});
