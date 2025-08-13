import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import * as bcrypt from 'bcrypt';
import { Role } from './enums/role.enum';

describe('UserService', () => {
  let service: UserService;

  // --- Repository mock'u ---
  const mockUserRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  // -----------------------------
  // findByName
  // -----------------------------
  describe('findByName', () => {
    it('kullanıcı varsa User döndürmeli', async () => {
      const user = { id: 1, name: 'Elif' } as User;
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByName('Elif');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Elif' },
      });
      expect(result).toEqual(user);
    });

    it('kullanıcı yoksa undefined döndürmeli', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByName('Yok');
      expect(result).toBeUndefined();
    });
  });

  // -----------------------------
  // findByEmail
  // -----------------------------
  describe('findByEmail', () => {
    it('email ile kullanıcıyı döndürmeli (bulursa)', async () => {
      const user = { id: 2, email: 'a@b.com' } as User;
      mockUserRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findByEmail('a@b.com');

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({
        email: 'a@b.com',
      });
      expect(result).toEqual(user);
    });

    it('bulamazsa null döndürmeli', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findByEmail('x@y.com');
      expect(result).toBeNull();
    });
  });

  // -----------------------------
  // createUser
  // -----------------------------
  describe('createUser', () => {
    it('şifreyi bcrypt ile hashleyip kullanıcıyı kaydetmeli (rol verilmişse Role.USER)', async () => {
      const dto: CreateUserDto = {
        name: 'Elif',
        email: 'elif@example.com',
        password: '123456',
        role: Role.USER, // testte role veriyoruz
      };

      // TS overload sorununu önlemek için mockImplementation kullan
      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => 'hashed_pw');

      const saved = {
        id: 10,
        name: 'Elif',
        email: 'elif@example.com',
        role: 'user', // entity tarafında string tutuyorsan bu OK
        password: 'hashed_pw',
      } as User;

      mockUserRepository.save.mockResolvedValue(saved);

      const result = await service.createUser(dto);

      // bcrypt.hash doğru parametrelerle çağrıldı mı?
      expect(hashSpy).toHaveBeenCalledWith('123456', 10);

      // repository.save hash'li şifre ve role ile çağrıldı mı?
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Elif',
          email: 'elif@example.com',
          role: 'user',
          password: 'hashed_pw',
        }),
      );

      expect(result).toEqual(saved);
    });

    it('rol verilmişse onu kullanmalı', async () => {
      const dto: CreateUserDto = {
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret',
        role: Role.ADMIN,
      };

      jest.spyOn(bcrypt, 'hash').mockImplementation(() => 'hpw');

      const saved = {
        id: 11,
        name: 'Ada',
        email: 'ada@example.com',
        role: 'admin',
        password: 'hpw',
      } as User;

      mockUserRepository.save.mockResolvedValue(saved);

      const result = await service.createUser(dto);
      expect(result.role).toBe('admin');
    });
  });

  // -----------------------------
  // findAllUser (pagination)
  // -----------------------------
  describe('findAllUser', () => {
    it('sayfalı kullanıcı listesi ve total döndürmeli', async () => {
      const users = [
        { id: 1, name: 'E' } as User,
        { id: 2, name: 'F' } as User,
      ];
      mockUserRepository.findAndCount.mockResolvedValue([users, 2]);

      const result = await service.findAllUser(2, 5);

      expect(mockUserRepository.findAndCount).toHaveBeenCalledWith({
        skip: (2 - 1) * 5,
        take: 5,
      });

      // instanceToPlain ile düzleştirilmiş veri bekliyoruz
      expect(result).toEqual({
        data: [
          expect.objectContaining({ id: 1, name: 'E' }),
          expect.objectContaining({ id: 2, name: 'F' }),
        ],
        total: 2,
      });
    });
  });

  // -----------------------------
  // findOneUser
  // -----------------------------
  describe('findOneUser', () => {
    it('bulursa düzleştirilmiş user döndürmeli', async () => {
      const user = { id: 5, name: 'Z' } as User;
      mockUserRepository.findOneBy.mockResolvedValue(user);

      // any → unknown → Partial<User>
      const resultUnknown: unknown = await service.findOneUser(5);
      const result = resultUnknown as Partial<User>;

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: 5 });
      expect(result).toEqual(expect.objectContaining({ id: 5, name: 'Z' }));
    });

    it('bulamazsa null döndürmeli', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      // any → unknown, null bekliyoruz
      const resultUnknown: unknown = await service.findOneUser(999);
      expect(resultUnknown).toBeNull();
    });
  });

  // -----------------------------
  // removeUser
  // -----------------------------
  describe('removeUser', () => {
    it('kullanıcı yoksa NotFoundException atmalı', async () => {
      mockUserRepository.softDelete.mockResolvedValue({ affected: 0 });

      await expect(service.removeUser(77)).rejects.toThrow(
        new NotFoundException('User with ID 77 not found'),
      );
    });

    it('varsa soft delete yapmalı ve hata atmamalı', async () => {
      mockUserRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.removeUser(10);

      expect(mockUserRepository.softDelete).toHaveBeenCalledWith(10);
    });
  });

  // -----------------------------
  // updateUser
  // -----------------------------
  describe('updateUser', () => {
    it('yoksa NotFoundException', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateUser(3, { name: 'Yeni' } as UpdateUserDto),
      ).rejects.toThrow(new NotFoundException('User with ID 3 not found'));
    });

    it('varsa alanları kopyalayıp kaydetmeli ve düzleştirilmiş sonucu döndürmeli', async () => {
      const existing = {
        id: 3,
        name: 'Eski',
        email: 'old@example.com',
        role: 'user',
      } as User;

      mockUserRepository.findOneBy.mockResolvedValue(existing);

      const dto: UpdateUserDto = { name: 'Yeni', role: Role.ADMIN };

      const saved = {
        ...existing,
        ...dto,
      } as User;

      mockUserRepository.save.mockResolvedValue(saved);

      const resultUnknown: unknown = await service.updateUser(3, dto);
      const result = resultUnknown as Partial<User>;

      // save çağrısına giden obje dto ile merge edilmiş olmalı
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 3,
          name: 'Yeni',
          email: 'old@example.com',
          role: 'admin',
        }),
      );

      // instanceToPlain sonucu
      expect(result).toEqual(
        expect.objectContaining({ id: 3, name: 'Yeni', role: 'admin' }),
      );
    });
  });

  // -----------------------------
  // findByResetToken
  // -----------------------------
  describe('findByResetToken', () => {
    it('token ile user aramalı', async () => {
      const user = { id: 42, resetPasswordToken: 'abc' } as User;
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findByResetToken('abc');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { resetPasswordToken: 'abc' },
      });
      expect(result).toEqual(user);
    });

    it('bulamazsa null döndürmeli', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByResetToken('nope');
      expect(result).toBeNull();
    });
  });

  // -----------------------------
  // save (passthrough)
  // -----------------------------
  describe('save', () => {
    it('repository.save proxy çağrısı yapmalı', async () => {
      const user = { id: 99, name: 'X' } as User;
      mockUserRepository.save.mockResolvedValue(user);

      const result = await service.save(user);

      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });
  });
});
