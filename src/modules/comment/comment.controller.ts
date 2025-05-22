import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { Authorization } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CommentDto, UpdateCommentDto } from './dto/comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @Authorization()
  createComment(@Body() dto: CommentDto, @CurrentUser('id') userId: string) {
    return this.commentService.create(dto, userId);
  }

  @Get('post/:postId')
  findAllForPost(@Param('postId') postId: string) {
    return this.commentService.findAllForPost(postId);
  }

  @Get(':id/replies')
  findReplies(@Param('id') id: string) {
    return this.commentService.findReplies(id);
  }

  @Patch(':id')
  @Authorization()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentService.update(id, userId, dto.content as string);
  }

  @Delete(':id')
  @Authorization()
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.commentService.remove(id, userId);
  }
}
