import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt'; // bcrypt'i içeri aktar
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   *Bu fonksiyon verilen ismi veritabanında arar.
   * @param name -arayacağımız kullanıcının adı
   * @returns - kullanıcı bulursa user bulunmazsa undefined döner
   */
  async findByName(name: string): Promise<User | undefined> {
    const user = await this.userRepository.findOne({ where: { name } });
    console.log('Veritabanından dönen kullanıcı:', user);
    return user ?? undefined;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const user = new User();

    user.name = data.name;
    user.email = data.email;
    user.role = data.role || 'user';

    // Şifreyi hashle (10 rounds salt kullanarak)
    const hashedPassword = await bcrypt.hash(data.password, 10);
    user.password = hashedPassword;
    return await this.userRepository.save(user); //oluşturulan User nesnesini veritabanına kaydeder ve döndürür.
  }

  //pagination işlemi ile tüm kullanıcıları getirir.
  async findAllUser(
    page = 1,
    limit = 10,
  ): Promise<{ data: any; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit, //sayfada kaç kayıt
    });

    const data = instanceToPlain(users);
    return { data, total }; //findAndCount mehodu sayesinde data yı ve toplam kullanıcı sayısını tekbir sorguda döndürür.
  }

  async findOneUser(id: number): Promise<any> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) return null;

    return instanceToPlain(user);
  }

  async removeUser(id: number): Promise<void> {
    const deleteResult = await this.userRepository.delete(id);
    if (deleteResult.affected === 0) {
      //resuslt.affected 0 veya 1 olabilir. çünkü id benzersizdir
      //result.affected delete ya da update işlemi sonucunda kaç tane kayıt etkilendiğini gösterir. yani kaç row silindiğini ya da güncellendiğini belirtir.

      throw new NotFoundException(`User with ID ${id} not found`); //0 dönerse hiç kayır yoktur ve hata döndürür.
    }
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<any> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, updateUserDto); // updateUserDto'daki alanları user objesine kopyala

    const updateUser = await this.userRepository.save(user); // Güncellenmiş kullanıcıyı kaydet ve döndür
    return instanceToPlain(updateUser) as Partial<User>;
  }

  //tokene göre kullanıcıyı bulur
  async findByResetToken(token: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });
  }

  async save(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }
}
