import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PaginateQueryDto } from './dto/paginate-query.dto';
import { Role } from 'src/user/enums/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

type AuthUser = { id: number; role: Role };

@ApiTags('comments')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt')) //JWT koruması ekle
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Bir task'e yorum ekler. `parentId` verilirse yanıt (reply) olarak kaydeder.
   * POST /tasks/:taskId/comments
   */

  @Post('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Bir task’e yorum ekle' })
  @ApiParam({ name: 'taskId', type: Number })
  @ApiBody({ type: CreateCommentDto })
  @UseGuards(RolesGuard)
  async create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.create(taskId, user.id, dto);
  }

  /**
   * Bir task'in yorumlarını sayfalı olarak listeler.
   * GET /tasks/:taskId/comments?page=&limit=
   */
  @Get('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Bir task’in yorumlarını listele (paginate)' })
  @ApiParam({ name: 'taskId', type: Number })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findByTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Query() query: PaginateQueryDto,
  ) {
    return this.commentsService.findByTask(taskId, query);
  }

  /**
   * Bir yorumu günceller (sadece sahibi).
   * PATCH /comments/:id
   */
  @Patch('comments/:id')
  @ApiOperation({ summary: 'Yorumu güncelle (sadece sahibi)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCommentDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.update(id, user.id, dto);
  }

  /**
   * Bir yorumu soft delete ile siler ve log yazar (sadece sahibi).
   * DELETE /comments/:id
   */
  @Delete('comments/:id')
  @ApiOperation({ summary: 'Yorumu sil (soft delete) + activity log' })
  @ApiParam({ name: 'id', type: Number })
  // @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    // remove imzan: (id: number, actorId: number, actorRole: Role)
    const actorRole = Role.USER; // user.role
    return this.commentsService.remove(id, user.id, actorRole);
  }
}
