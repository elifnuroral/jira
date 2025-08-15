import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { Task } from 'src/tasks/task.entity';
import { User } from 'src/user/entities/user.entity';
@Entity()
@Index(['task', 'createdAt'])
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Task, (task) => task.comments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  task: Task;

  @ManyToOne(() => User, (user) => user.comments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  author?: User | null;

  @Column({ type: 'text' })
  content: string;

  // (İsteğe bağlı) Cevap/thread desteği
  @ManyToOne(() => Comment, (c) => c.children, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  parent?: Comment | null;

  @OneToMany(() => Comment, (c) => c.parent)
  children?: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete istersen:
  @DeleteDateColumn()
  deletedAt?: Date | null;

  @Column({ type: 'boolean', default: false })
  isEdited: boolean; //yorum değişitirildi mi değiştirilmedi mi onu tutuyor değiştirildiyse 0'dan 1 'e geçiyor.
}
