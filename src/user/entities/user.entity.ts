import { Exclude } from 'class-transformer';
import { Task } from 'src/tasks/task.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  @Exclude() //şifre alanını dışarıya gizler.
  password: string;

  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Task[];

  @OneToMany(() => Task, (task) => task.assignedTo)
  assignedTasks: Task[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  //Bu alanlar nullable: true olduğu için başlangıçta boş olabilir, sadece kullanıcı şifresini sıfırlamak istediğinde değer alırlar.
  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken?: string | null; //	Şifre sıfırlama isteği geldiğinde, kullanıcıya gönderilen benzersiz token

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpires?: Date | null; //Şifre sıfırlama token'inin geçerlilik süresi

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;
}
