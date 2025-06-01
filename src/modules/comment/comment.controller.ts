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

	@Post()
	@Authorization()
	createComment(@Body() dto: CommentDto, @CurrentUser('id') userId: string) {
		return this.commentService.create(dto, userId);
	}

	@Get('post/:postId')
	findAllForPost(
		@Param('postId') postId: string,
		@Query('page') page = '1',
		@Query('take') take = '15',
	) {
		return this.commentService.findAllForPost(postId, +page, +take);
	}

	@Get(':id/replies')
	findReplies(
		@Param('id') id: string,
		@Query('page') page = '1',
		@Query('take') take = '5',
	) {
		return this.commentService.findReplies(id, +page, +take);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.commentService.findOne(id);
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
