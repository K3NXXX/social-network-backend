import { Controller, Get, Param, Post } from '@nestjs/common';
import { FollowService } from './follow.service';
import { Authorization } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Controller()
export class FollowController {
	constructor(private readonly followService: FollowService) {}

	@Authorization()
	@Post('follow/:followingId')
	toggleFollow(
		@CurrentUser('id') followerId: string,
		@Param('followingId') followingId: string,
	) {
		return this.followService.toggleFollow(followerId, followingId);
	}

	@Authorization()
	@Get('followers/:userId')
	getUserFollowers(
		@CurrentUser('id') currentUserId: string,
		@Param('userId') userId: string,
	) {
		return this.followService.getUserFollowers(userId, currentUserId);
	}

	@Authorization()
	@Get('following/:userId')
	getUserFollowing(
		@CurrentUser('id') currentUserId: string,
		@Param('userId') userId: string,
	) {
		return this.followService.getUserFollowing(userId, currentUserId);
	}

	@Authorization()
	@Get('is-following/:followingId')
	isFollowing(
		@CurrentUser('id') userId: string,
		@Param('followingId') followingId: string,
	) {
		return this.followService.isFollowing(userId, followingId);
	}
}
