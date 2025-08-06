import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  //PartialType sayesinde CreateTaskDto'daki tüm alanları alır ama hepsini isteğe bağlı (optional) yapar.
  //her alanın zorunlu olmasını istemiyorsan PartialType kullanabilirsin.
}
