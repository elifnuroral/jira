import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TaskAction } from '../enums/task-action.enum';
import { Role } from 'src/user/enums/role.enum';

@Entity()
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number; // İşlemi yapan kullanıcı ID'si

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ nullable: true })
  action: TaskAction; // Yapılan işlem (ör. 'create', 'update', 'delete')

  @Column()
  taskId: number; // İlgili görev ID'si

  @Column({ nullable: true })
  projectId: number;

  @CreateDateColumn()
  timestamp: Date; // İşlemin yapıldığı tarih ve saat
}
