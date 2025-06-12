import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { SavedPostsService } from './saved-posts.service';
import { Authorization } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Authorization()
@Controller()
export class SavedPostsController {
	constructor(private readonly savedPostsService: SavedPostsService) {}

	@Post('posts/save/:postId')
	save(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
		return this.savedPostsService.save(userId, postId);
	}

	@Delete('posts/unsave/:postId')
	unsave(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
		return this.savedPostsService.unsave(userId, postId);
	}

	@Get('user/saved')
	getAll(
		@CurrentUser('id') userId: string,
		@Query('page') page = '1',
		@Query('take') take = '10',
	) {
		return this.savedPostsService.getSavedPosts(userId, +page, +take);
	}

	@Get('posts/saved/:postId')
	check(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
		return this.savedPostsService.isPostSaved(userId, postId);
	}
}
