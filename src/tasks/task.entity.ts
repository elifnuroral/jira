import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TaskStatus } from './enums/task-status.enum';
import { TaskPriority } from './enums/task-priority.enum';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.OPEN })
  status: TaskStatus;

  @Column({ type: 'enum', enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date; //Kaydın veritabanına ilk eklendiği zamanı otomatik olarak tutar.

  @UpdateDateColumn()
  updatedAt: Date; //Kaydın her güncellendiği zamanı otomatik olarak tutar.
  //@CreateDateColumn() ve @UpdateDateColumn() dekoratörleri, TypeORM’un sağladığı otomatik zaman damgası (timestamp) kolonlarıdır.
  //Sen bu alanlara değer atamasan bile TypeORM, kayıt oluştururken ve güncellerken bu tarihleri otomatik olarak kaydeder. sistem bu tarihleri otomatik atar

  // Görevi oluşturan kullanıcı
  //@ManyToOne(() => User, (user) => user.createdTasks, { eager: true }) //{ eager: true } ekleyerek, görevi çekerken ilgili kullanıcıyı da otomatik olarak çeker (join gibi).
  //createdBy: User;

  // Görev atanan kullanıcı
  // @ManyToOne(() => User, (user) => user.assignedTasks, { eager: true })
  //assignedTo: User;

  @ManyToOne(() => User, (user) => user.createdTasks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'createdByUserId' }) // Buradaki isim veritabanınızdaki yabancı anahtar sütunuyla eşleşmeli
  createdBy: User;

  // assignedTo ilişkisi
  @ManyToOne(() => User, (user) => user.assignedTasks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assignedToUserId' })
  assignedTo: User;
}
