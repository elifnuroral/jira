import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskPriority } from './enums/task-priority.enum';
import { TaskStatus } from './enums/task-status.enum';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/entities/user.entity';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskAction } from 'src/reports/enums/task-action.enum';
import { ReportsService } from 'src/reports/reports.service';
import { Project } from 'src/projects/entities/project.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>, // Task repository
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>, // Project repository

    private readonly userService: UserService, // user service
    private readonly reportsService: ReportsService, // reports service
  ) {}
  async createTask(createTaskDto: CreateTaskDto): Promise<Task> {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      createdBy,
      assignedTo,
      projectId,
    } = createTaskDto;

    // Project ID'yi kullanarak projeyi buluyoruz
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // createdBy kullanıcı adını UserService ile bul
    const createdByUser = await this.userService.findByName(createdBy);
    if (!createdByUser) {
      throw new NotFoundException(`User with name ${createdBy} not found`);
    }

    // assignedTo kullanıcı adını bul (varsa)
    let assignedToUser: User | undefined = undefined;
    if (assignedTo) {
      assignedToUser = await this.userService.findByName(assignedTo);
      if (!assignedToUser) {
        throw new NotFoundException(`User with name ${assignedTo} not found`);
      }
    }

    const task = this.taskRepository.create({
      title,
      description,
      status: status ?? TaskStatus.OPEN, //status gelmezse enumdan OPEN'ı seç
      priority: priority ?? TaskPriority.MEDIUM, //status gelmezse enumdan MEDIUM'u seç
      dueDate: new Date(dueDate), //tarihi tarih objesi olarka kaydetti
      createdBy: createdByUser,
      assignedTo: assignedToUser,
      project,
    });

    const createdTask = await this.taskRepository.save(task);

    // 1. Activity Log kaydını oluştur
    await this.reportsService.createActivityLog(
      createdTask.createdBy.id, // Task'ı oluşturan kullanıcının ID'si
      TaskAction.CREATED, // Action türü (oluşturma işlemi)
      createdTask.id, // Oluşturulan Task ID'si
      project.id,
    );

    return createdTask;
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ data: Task[]; total: number }> {
    const [data, total] = await this.taskRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  async findOne(id: number): Promise<Task | null> {
    return await this.taskRepository.findOneBy({ id });
  }

  // Task silme işlemi sırasında Activity Log kaydını oluşturuyoruz
  async remove(id: number): Promise<void> {
    const taskToDelete = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });

    if (!taskToDelete) {
      throw new Error(`ID'si ${id} olan görev bulunamadı.`);
    }

    // 1. Activity Log kaydını oluştur
    await this.reportsService.createActivityLog(
      taskToDelete.createdBy.id, // Silen kullanıcının ID'si
      TaskAction.DELETED, // Action türü (silme işlemi)
      id, // Silinen Task ID'si
    );

    // 2. Task'ı sil
    await this.taskRepository.delete(id);
  }

  /**
   * Belirtilen ID'ye sahip bir görevi günceller.
   * Görevin temel alanlarının yanı sıra, ilişkili kullanıcıları da (görevi oluşturan ve atanan) güncelleyebilir.
   * @param id Güncellenecek görevin benzersiz kimliği (ID).
   * @param updateTaskDto Görev ve ilişkili kullanıcılar için güncellenecek verileri içeren DTO (Data Transfer Object).
   * @returns Güncelleme işlemi tamamlandığında, veritabanında güncellenmiş olan görev nesnesini döndürür.
   * @throws NotFoundException Eğer belirtilen ID'ye sahip görev veya DTO'da belirtilen kullanıcılar bulunamazsa fırlatılır.
   */

  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    // 1. Görevi bul ve ilişkili kullanıcıları da yükle.
    // Bu, TypeORM'in mevcut ilişkileri doğru bir şekilde takip etmesini sağlar.
    const taskToUpdate = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo'], //task entitysini çekerken o task'e bağlı olan ilişkili user nesnelerinide birlikte getir.
      //relations: [...] ile bu ilişkilere “join” yapılmasını ve o ilişkilere bağlı User objelerinin de yüklenmesini söylersin.
      //rerelations çok önemli
    });

    if (!taskToUpdate) {
      throw new NotFoundException(`ID'si ${id} olan görev bulunamadı.`);
    }

    // 2. DTO'dan sadece görev alanlarını al (ilişkili kullanıcılar hariç).
    const { createdBy, assignedTo, ...restOfTaskData } = updateTaskDto;
    //Bu ayrıştırma, ilişkisel verilerle diğer verilerin farklı mantıklarla işlenmesini sağlar ve kodun okunabilirliğini artırır.
    //...restOfTaskData ise, bu iki alan dışındaki tüm diğer alanları (title, description, status vb.) restOfTaskData adında yeni bir nesneye toplar.

    // 3. Görevin diğer alanlarını güncelle.
    // `Object.assign` ile sadece DTO'da gelen değerleri atıyoruz. sadece gönderilen alanları günceller.
    Object.assign(taskToUpdate, restOfTaskData);
    //Bu satır, restOfTaskData nesnesinde bulunan tüm özellikleri taskToUpdate nesnesine kopyalar

    // 4. `createdBy` ilişkisini güncelle (eğer istekte varsa).
    if (createdBy) {
      // Gönderilen isme göre kullanıcıyı bul.
      const creatorUser = await this.userService.findByName(createdBy);
      if (!creatorUser) {
        throw new NotFoundException(
          `"${createdBy}" isimli kullanıcı bulunamadı.`,
        );
      }
      // Bulunan User nesnesini taskToUpdate'e ata.
      taskToUpdate.createdBy = creatorUser;
    }

    // 5. `assignedTo` ilişkisini güncelle (eğer istekte varsa).
    if (assignedTo) {
      // Gönderilen isme göre kullanıcıyı bul.
      const assignedUser = await this.userService.findByName(assignedTo);
      if (!assignedUser) {
        throw new NotFoundException(
          `"${assignedTo}" isimli kullanıcı bulunamadı.`,
        );
      }
      // Bulunan User nesnesini taskToUpdate'e ata.
      taskToUpdate.assignedTo = assignedUser;
    }

    // 6. Task'ı güncelle ve veritabanına kaydet
    const updatedTask = await this.taskRepository.save(taskToUpdate);

    // 7. Activity Log kaydını oluştur
    await this.reportsService.createActivityLog(
      updatedTask.createdBy.id, // Güncelleyen kullanıcı ID'si
      TaskAction.UPDATE, // Action türü
      updatedTask.id, // Güncellenen Task ID'si
    );

    return updatedTask;
  }

  /**
   * Verilen bir kullanıcının adına göre, o kullanıcının oluşturduğu tüm görevleri bulur.
   * Veritabanında, görevler ile kullanıcılar arasındaki 'createdBy' ilişkisini kullanarak sorgu yapar.
   * * @param name Sorgulanacak kullanıcının adı (örneğin: 'nilgün').
   * @returns Verilen kullanıcı tarafından oluşturulan görevleri içeren bir dizi (Promise<Task[]>).
   */

  async findTasksByUserName(name: string): Promise<Task[]> {
    return await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'user') // createdBy ilişkisini join et
      .where('user.name = :name', { name }) // user.name ile filtrele
      .getMany(); // eşleşen tüm görevleri getir
  }

  /**
   * Verilen bir kullanıcının adına göre, o kullanıcıya atanan tüm görevleri bulur.
   * Veritabanında, görevler ile kullanıcılar arasındaki 'assignedTo' ilişkisini kullanarak sorgu yapar.
   * * @param name Görevin atandığı kullanıcının adı.
   * @returns Verilen kullanıcıya atanmış görevleri içeren bir dizi (Promise<Task[]>).
   */

  async findTasksByAssignedUserName(name: string): Promise<Task[]> {
    return await this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'user')
      .where('user.name = :name', { name })
      .getMany();
  }

  /**
   * Belirtilen filtre kriterlerine (title, priority, status) ve sayfalama bilgilerine göre
   * veritabanındaki görevleri (Task) döndürür.
   *
   * @param {GetTasksFilterDto} filterDto - Görevleri filtrelemek için title, priority ve status alanlarını içerir.
   * @param {number} page - Hangi sayfanın gösterileceğini belirtir (varsayılan: 1).
   * @param {number} limit - Her sayfada kaç görev gösterileceğini belirtir (varsayılan: 10).
   *
   * @returns {Promise<{ data: Task[]; total: number }>} -
   * Sayfalanmış görev listesi (`data`) ve bu filtrelere uyan toplam görev sayısı (`total`) döner.
   *
   * @example
   * // 2. sayfada, içinde "toplantı" geçen, önceliği "HIGH", durumu "OPEN" olan görevleri getir
   * getFilteredTasks({ title: 'toplantı', priority: 'HIGH', status: 'OPEN' }, 2, 10);
   */

  async getFilteredTasks(
    filterDto: GetTasksFilterDto,
    page: number,
    limit: number,
  ): Promise<{ data: Task[]; total: number }> {
    const { title, priority, status } = filterDto;

    const query = this.taskRepository.createQueryBuilder('task');
    //queryBuilder, TypeORM'de sorguları dinamik olarak oluşturmak için kullanılır.

    if (title) {
      query.andWhere('task.title ILIKE :title', { title: `%${title}%` });
    }

    if (priority) {
      query.andWhere('task.priority = :priority', { priority });
    }

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    //En güncel oluşturulan görev en üstte olacak şekilde sırala. bunu seçilebilri yaptım.
    const order = filterDto.sortOrder ?? 'DESC';
    query.orderBy('task.createdAt', order); //bu satır veritabanında oluşturulmma tarihine göre (createdAt) sıralama yapar.

    query.skip((page - 1) * limit).take(limit); // Sayfalama

    const [data, total] = await query.getManyAndCount(); //getManyAndCount, sorgunun hem verilerini hem de toplam sayısını döndürür.

    return { data, total };
  }

  // Task durumunu güncellerken Activity Log kaydını oluşturuyoruz
  async updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
    // 1. Task'ı buluyoruz ve 'createdBy' ilişkisini de yüklüyoruz
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy'], // 'createdBy' ilişkisini yüklemek için
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // 2. Task'ın durumunu güncelliyoruz
    task.status = status;

    const updatedTask = await this.taskRepository.save(task);

    // 3. Activity Log kaydını oluşturuyoruz
    if (task.createdBy) {
      // Durum "IN_PROGRESS" ise özel bir Activity Log kaydı ekliyoruz
      if (status === TaskStatus.IN_PROGRESS) {
        await this.reportsService.createActivityLog(
          task.createdBy.id, // Task'ı oluşturan kullanıcının ID'si
          TaskAction.IN_PROGRESS, // Durum değişikliği için action türü
          updatedTask.id, // Güncellenen Task ID'si
        );
      } else {
        await this.reportsService.createActivityLog(
          task.createdBy.id, // Task'ı oluşturan kullanıcının ID'si
          TaskAction.STATUS_CHANGED, // Durum değişikliği için genel action türü
          updatedTask.id, // Güncellenen Task ID'si
        );
      }
    } else {
      throw new Error('CreatedBy user not found on task');
    }

    return updatedTask;
  }
}
