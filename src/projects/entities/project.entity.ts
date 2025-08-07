import { Task } from 'src/tasks/task.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  ownerId: number; // Projeyi oluşturan kullanıcının ID'si

  @OneToMany(() => Task, (task) => task.project) //1 projede birden fazla task olabilir
  tasks: Task[]; //projeye ait görevler
}
