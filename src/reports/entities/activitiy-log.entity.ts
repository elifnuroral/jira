import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaskAction } from '../enums/task-action.enum';

@Entity()
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number; // İşlemi yapan kullanıcı ID'si

  @Column({ nullable: true })
  action: TaskAction; // Yapılan işlem (ör. 'create', 'update', 'delete')

  @Column()
  taskId: number; // İlgili görev ID'si

  @Column({ nullable: true })
  projectId: number;

  @CreateDateColumn()
  timestamp: Date; // İşlemin yapıldığı tarih ve saat
}
