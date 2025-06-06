import { Controller, Param, Post } from '@nestjs/common';
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
}
