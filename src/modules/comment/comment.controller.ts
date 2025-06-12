import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { Authorization } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CommentDto, UpdateCommentDto } from './dto/comment.dto';

@Controller('comments')
export class CommentController {
	constructor(private readonly commentService: CommentService) {}

	@Authorization()
	@Post()
	createComment(@CurrentUser('id') userId: string, @Body() dto: CommentDto) {
		return this.commentService.create(userId, dto);
	}

	@Authorization()
	@Get('post/:postId')
	findAllForPost(
		@Param('postId') postId: string,
		@CurrentUser('id') userId: string,
		@Query('page') page = '1',
		@Query('take') take = '15',
	) {
		return this.commentService.findAllForPost(postId, userId, +page, +take);
	}

	@Authorization()
	@Get(':id/replies')
	findReplies(
		@Param('id') id: string,
		@CurrentUser('id') userId: string,
		@Query('page') page = '1',
		@Query('take') take = '5',
	) {
		return this.commentService.findReplies(id, userId, +page, +take);
	}

	@Authorization()
	@Get(':id')
	findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
		return this.commentService.findOne(id, userId);
	}

	@Authorization()
	@Patch(':id')
	update(
		@Param('id') id: string,
		@CurrentUser('id') userId: string,
		@Body() dto: UpdateCommentDto,
	) {
		return this.commentService.update(id, userId, dto.content as string);
	}

	@Authorization()
	@Delete(':id')
	remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
		return this.commentService.remove(id, userId);
	}
}
