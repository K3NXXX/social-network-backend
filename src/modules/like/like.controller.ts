import { Controller, Get, Param, Post } from '@nestjs/common';
import { LikeService } from './like.service';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Authorization } from '../../common/decorators/auth.decorator';

@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Authorization()
  @Post('post/:postId')
  togglePostLike(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.likeService.togglePostLike(postId, userId);
  }

  @Authorization()
  @Post('comment/:commentId')
  toggleCommentLike(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.likeService.toggleCommentLike(commentId, userId);
  }

  @Get('post/:postId')
  getPostLikesCount(@Param('postId') postId: string) {
    return this.likeService.getPostLikesCount(postId);
  }

  @Get('comment/:commentId')
  getCommentLikesCount(@Param('commentId') commentId: string) {
    return this.likeService.getCommentLikesCount(commentId);
  }
}
