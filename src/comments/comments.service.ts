import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from 'src/tasks/task.entity';
import { User } from 'src/user/entities/user.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginateQueryDto } from './dto/paginate-query.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { ReportsService } from 'src/reports/reports.service';
import { TaskAction } from 'src/reports/enums/task-action.enum';
import { Role } from 'src/user/enums/role.enum';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) // <— ÖNEMLİ
    private readonly commentRepo: Repository<Comment>, // <— ÖNEMLİ
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly reportsService: ReportsService,
  ) {}

  /**
   * Bir task'e yorum ekler. `parentId` verilirse ilgili yoruma **cevap (reply)** olarak bağlar.
   *
   * @param taskId - Yorumun bağlanacağı Task ID'si (route param).
   * @param authorId - Yorumu yazan kullanıcının ID'si. (@CurrentUser().id) Yoksa `null` (anonim).
   * @param dto - İstek gövdesi (`content`, opsiyonel `parentId`).
   * @returns Kaydedilmiş yorum nesnesi.
   *
   * @throws NotFoundException - Task bulunamazsa.
   * @throws BadRequestException - `parentId` geçersizse / başka task'a aitse / içerik boşsa.
   *
   * @example
   * // Root yorum
   * await service.create(42, 7, { content: 'Başlıyorum.' });
   * // Cevap (reply)
   * await service.create(42, 7, { content: 'Detay?', parentId: 1 });
   */
  async create(
    taskId: number,
    authorId: number | null,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    // 1) Task var mı?
    //db'de taskId var mı kontrol et yoksa hata fırlat
    const task = await this.taskRepo.findOneBy({ id: taskId });
    if (!task) throw new NotFoundException('Task not found');

    // 2) parentId geldiyse parent yorumu doğrula + aynı task'e ait mi?
    let parent: Comment | null = null; //varsayılan kök root yorum
    if (dto.parentId) {
      // → parentId varsa bu bir “cevap (reply)”
      // a) parent yorum var mı?
      //parentId verilmişse önce o ID’de yorum var mı kontrolü.
      const parentRow = await this.commentRepo.findOneBy({ id: dto.parentId }); //parent yorum gerçketen var mı?
      if (!parentRow) throw new BadRequestException('Parent comment not found'); //yoksa 400

      // b) parent aynı task'e ait mi?
      const sameTask = await this.commentRepo
        .createQueryBuilder('comment') //comments tablosu için sorgu başlatır.
        .innerJoin('comment.task', 'task')
        .where('comment.id = :pid', { pid: dto.parentId })
        .andWhere('task.id = :tid', { tid: taskId })
        .getOne();

      if (!sameTask) {
        throw new BadRequestException('Parent comment belongs to another task');
      }

      parent = parentRow;
    }

    // 3) authorId geldiyse kullanıcıyı yükle (anonim olabilir)
    const author = authorId
      ? await this.userRepo.findOneBy({ id: authorId }) //varsa db'den çek
      : null; //yoksa anonim

    // 4) içerik boş kalmasın
    const content = dto.content?.trim() ?? ''; //.trim->string’in başındaki ve sonundaki tüm boşluk karakterlerini siler.
    if (!content) throw new BadRequestException('Content cannot be empty'); // → Tamamen boşsa 400

    // 5) yorum oluştur + kaydet
    const entity = this.commentRepo.create({
      //yorum oluşturuldu
      task,
      author: author ?? null,
      content,
      parent: parent ?? null,
    });

    return await this.commentRepo.save(entity); //yorum db'e kaydedildi
  }

  /**
   * Verilen bir task'in yorumlarını **sayfalı** olarak listeler.
   * `author` ve `parent` ilişkileri ile birlikte döner; `createdAt ASC` sıralıdır.
   *
   * @param taskId - Listeleme yapılacak Task ID'si.
   * @param pageDto - Sayfalama bilgileri (`page`, `limit`). Varsayılan: 1 ve 10.
   * @returns `{ data, total, page, limit }` yapısında sayfalı sonuç.
   *
   * @example
   * const { data, total } = await service.findByTask(42, { page: 1, limit: 10 });
   */
  async findByTask(
    taskId: number,
    { page = 1, limit = 10 }: PaginateQueryDto,
  ): Promise<{
    data: Comment[]; //yorum listesi
    total: number; //toplam yorum sayısı
    page: number;
    limit: number;
  }> {
    const p = Math.max(1, Number(page) || 1); //Number ile sayıya çevirir . sonucu en az 1 e sabitler. soldaki değer falsy ise saağdaki 1 değerini döndürür.
    const l = Math.max(1, Number(limit) || 10);

    const qb = this.commentRepo //qb:typeORM QueryBuilder nesnesi
      .createQueryBuilder('c') //c takma adıyla Comment tablosu üzerinde sorgu yapacağız
      .leftJoinAndSelect('c.author', 'author')
      .leftJoinAndSelect('c.parent', 'parent')
      .innerJoin('c.task', 't')
      .where('t.id = :taskId', { taskId })
      .orderBy('c.createdAt', 'ASC') //Yorumları oluşturulma zamanına göre eskiden yeniye sıralar.
      .skip((p - 1) * l)
      .take(l);

    const [data, total] = await qb.getManyAndCount(); //2 sorgu çaşıitırır biri SELECT....LIMIT , SELECT....COUNT
    return { data, total, page: p, limit: l };
  }

  /**
   * Yorumu **günceller**. Varsayılan politikaya göre **sadece sahibi** güncelleyebilir.
   *
   * @param id - Güncellenecek yorumun ID'si.
   * @param actorId - İsteği yapan kullanıcının ID'si (@CurrentUser().id) veya `null`.
   * @param dto - Güncellenecek alanlar (`content`).
   * @returns Güncellenmiş yorum nesnesi.
   *
   * @throws NotFoundException - Yorum bulunamazsa.
   * @throws ForbiddenException - Kullanıcının bu yorumu güncelleme yetkisi yoksa.
   * @throws BadRequestException - Değişiklik gelmezse veya içerik boşsa.
   *
   * @example
   * await service.update(13, 7, { content: 'Güncel metin' });
   */
  async update(
    id: number, //güncellenecek yorum id'si
    actorId: number | null,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    // 1) Yorumu ilişkileriyle yükle
    const comment = await this.commentRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.author', 'author')
      .leftJoinAndSelect('c.task', 'task')
      .where('c.id = :id', { id }) //güncellenecek yorumu id'ye göre filtrele
      .getOne(); //tek kayıt bekliyoruz

    if (!comment) throw new NotFoundException('Comment not found'); //bu id'de bir yorum yoksa 404

    // → Yetki kontrolü: Yorumun sahibi değilse (ve admin muafiyeti tanımlamadıysan) 403 yasak
    if (comment.author?.id !== actorId) {
      throw new ForbiddenException('You cannot edit this comment');
    }

    // → Hiç değişiklik alanı gelmemişse 400 döndür.
    if (dto.content === undefined) {
      throw new BadRequestException('No changes provided');
    }

    // 4) İçeriği güncelle (trim + boş olamaz)
    if (typeof dto.content === 'string') {
      const trimmed = dto.content.trim(); //boştaki ve sondaki boşlukları temizle
      if (!trimmed) throw new BadRequestException('Content cannot be empty');

      //adece gerçekten değiştiyse bayrağı yak
      const contentChanged = trimmed !== comment.content; //Güncellenen metnin eski metinden farklı olup olmadığına bakar.
      if (contentChanged) {
        comment.content = trimmed; //bu satır, veritabanından yüklediğin comment entity’sinin content alanını, az önce boşlukları temizlenmiş yeni metinle (trimmed) RAM üzerinde güncelliyor.
        comment.isEdited = true; // 0 ➜ 1 (false ➜ true)
      }
    }

    // 5) Kaydet ve döndür
    return await this.commentRepo.save(comment);
  }

  /**
   * Yorumu **soft delete** ile siler ve bir **activity log** kaydı oluşturur.
   * Varsayılan politikaya göre **sadece sahibi** silebilir.
   *
   * Log formatı (öneri):
   * {
   *   action: 'COMMENT_DELETED',
   *   taskId,
   *   userId: actorId,
   *   metadata: {
   *     commentId,
   *     parentId,
   *     contentPreview,
   *     deletedAt
   *   }
   * }
   */
  async remove(
    id: number,
    actorId: number, // anonim silmeye izin vermeyin; log imzanız number bekliyor
    actorRole: Role, // controller’dan gelmeli
  ): Promise<{ message: string }> {
    const comment = await this.commentRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.author', 'author')
      .leftJoinAndSelect('c.task', 'task')
      .leftJoinAndSelect('c.parent', 'parent')
      .where('c.id = :id', { id })
      .getOne();

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.author?.id !== actorId /* && !isAdmin(actorRole) */) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    // (İstersen snapshot tutmak için ayrı tablo/sütun eklemelisin; bu imza metadata almıyor)
    await this.commentRepo.softRemove(comment);

    // 🔧 createActivityLog(userId, role, action, taskId, projectId?)
    await this.reportsService.createActivityLog(
      actorId,
      actorRole, // Role/string: ReportsService içindeki Role enum’uyla uyumlu
      TaskAction.COMMENT_DELETED, // Enum’da yoksa ekle
      comment.task.id,
      // comment.task.projectId ?? undefined,
    );

    return { message: `Comment ${id} deleted` };
  }
}
