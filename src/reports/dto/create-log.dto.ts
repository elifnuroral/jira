import { IsInt, IsEnum } from 'class-validator';
import { TaskAction } from '../enums/task-action.enum'; // Enum'u import ediyoruz

export class CreateLogDto {
  @IsInt()
  userId: number; // Kullanıcı ID'si

  @IsEnum(TaskAction)
  action: TaskAction; // Enum olarak action'ı alıyoruz

  @IsInt()
  taskId: number; // Görev ID'si
}
