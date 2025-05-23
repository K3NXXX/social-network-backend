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

  @Get('followers/:userId')
  getFollowers(@Param('userId') userId: string) {
    return this.followService.getFollowers(userId);
  }

  @Get('following/:userId')
  getFollowing(@Param('userId') userId: string) {
    return this.followService.getFollowing(userId);
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
