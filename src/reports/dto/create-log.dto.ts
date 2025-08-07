import { IsInt, IsEnum } from 'class-validator';
import { TaskAction } from '../enums/task-action.enum'; // Enum'u import ediyoruz
import { Role } from 'src/user/enums/role.enum';

export class CreateLogDto {
  @IsInt()
  userId: number; // Kullanıcı ID'si

  @IsEnum(Role)
  role: Role;

  @IsEnum(TaskAction)
  action: TaskAction; // Enum olarak action'ı alıyoruz

  @IsInt()
  taskId: number; // Görev ID'si

  @IsInt()
  projectId: number; // Proje ID'si, opsiyonel olabilir
}
