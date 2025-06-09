import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { SavedPostsService } from './saved-posts.service';
import { Authorization } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Authorization()
@Controller()
export class SavedPostsController {
	constructor(private readonly savedPostsService: SavedPostsService) {}

	@Post('posts/save/:postId')
	save(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
		return this.savedPostsService.savePost(userId, postId);
	}

	@Delete('posts/unsave/:postId')
	unsave(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
		return this.savedPostsService.unsavePost(userId, postId);
	}

	@Get('user/saved')
	getAll(@CurrentUser('id') userId: string) {
		return this.savedPostsService.getSavedPosts(userId);
	}

	@Get('posts/saved/:postId')
	check(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
		return this.savedPostsService.isPostSaved(userId, postId);
	}
}
