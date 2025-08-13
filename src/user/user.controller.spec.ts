import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersFilterDto } from './dto/get-users-filtere.dto';
import { User } from './entities/user.entity';
import { Role } from './enums/role.enum';

describe('UserController', () => {
  let controller: UserController;

  // Servis mock’unu tipli kuruyoruz (return ve argüman tipleri belli olsun diye)
  const mockUserService = {
    createUser: jest.fn<Promise<User>, [CreateUserDto]>(),
    findAllUser: jest.fn<
      Promise<{ data: Partial<User>[]; total: number }>,
      [number, number]
    >(),
    findOneUser: jest.fn<Promise<Partial<User> | null>, [number]>(),
    removeUser: jest.fn<Promise<void>, [number]>(),
    updateUser: jest.fn<Promise<Partial<User>>, [number, UpdateUserDto]>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('controller tanımlı olmalı', () => {
    expect(controller).toBeDefined();
  });

  // POST /user
  it('create -> UserService.createUser doğru DTO ile çağrılır ve sonucu döner', async () => {
    const dto: CreateUserDto = {
      name: 'Elif',
      email: 'elif@example.com',
      password: '123456',
      role: Role.USER, // DTO zorunluysa enum ver
    };

    const created: User = {
      id: 1,
      name: 'Elif',
      email: 'elif@example.com',
      password: 'hashed',
      role: Role.USER,
    } as User;

    mockUserService.createUser.mockResolvedValue(created);

    const result = await controller.create(dto);

    expect(mockUserService.createUser).toHaveBeenCalledWith(dto);
    expect(result).toEqual(created);
  });

  // GET /user  (AuthGuard unit testte çalışmaz; direkt metodu çağırıyoruz)
  it('getUser -> page/limit verilmezse varsayılan (1,5) ile çağrılmalı', async () => {
    const filter: GetUsersFilterDto = {}; // page/limit yok
    const response = { data: [], total: 0 };

    mockUserService.findAllUser.mockResolvedValue(response);

    const result = await controller.getUser(filter);

    expect(mockUserService.findAllUser).toHaveBeenCalledWith(1, 5);
    expect(result).toEqual(response);
  });

  it('getUser -> page/limit verilirse aynen aktarılmalı', async () => {
    const filter: GetUsersFilterDto = { page: 3, limit: 2 };
    const response = { data: [{ id: 1, name: 'A' }], total: 1 };

    mockUserService.findAllUser.mockResolvedValue(response);

    const result = await controller.getUser(filter);

    expect(mockUserService.findAllUser).toHaveBeenCalledWith(3, 2);
    expect(result).toEqual(response);
  });

  // GET /user/:id
  it('findOne -> id string gelir, +id ile sayıya çevrilip UserService.findOneUser çağrılır', async () => {
    const user: Partial<User> = { id: 7, name: 'Ada' };
    mockUserService.findOneUser.mockResolvedValue(user);

    const result = await controller.findOne('7');

    expect(mockUserService.findOneUser).toHaveBeenCalledWith(7);
    expect(result).toEqual(user);
  });

  // DELETE /user/:id
  it('remove -> id string gelir, +id ile sayıya çevrilip UserService.removeUser çağrılır', async () => {
    mockUserService.removeUser.mockResolvedValue(undefined);

    const result = await controller.remove('9');

    expect(mockUserService.removeUser).toHaveBeenCalledWith(9);
    expect(result).toBeUndefined(); // controller remove herhangi bir mesaj dönmüyor
  });

  // PATCH /user/:id
  it('update -> UserService.updateUser id ve dto ile çağrılır ve sonucu döner', async () => {
    const dto: UpdateUserDto = { name: 'Yeni', role: Role.ADMIN };
    const updated: Partial<User> = { id: 11, name: 'Yeni', role: Role.ADMIN };

    mockUserService.updateUser.mockResolvedValue(updated);

    const result = await controller.update(11, dto);

    expect(mockUserService.updateUser).toHaveBeenCalledWith(11, dto);
    expect(result).toEqual(updated);
  });
});
