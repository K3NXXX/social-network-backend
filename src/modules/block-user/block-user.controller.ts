import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Authorization } from '../../common/decorators/auth.decorator';
import { BlockUserService } from './block-user.service';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Authorization()
@Controller()
export class BlockUserController {
  constructor(private blockedUserService: BlockUserService) {}

  @Post('block/:blockedId')
  block(
    @CurrentUser('id') userId: string,
    @Param('blockedId') blockedId: string,
  ) {
    return this.blockedUserService.block(userId, blockedId);
  }

  @Get('user/blocked-users')
  getBlockedUsers(@CurrentUser('id') userId: string) {
    return this.blockedUserService.getBlockedUsers(userId);
  }

  @Delete('unblock/:blockedId')
  unblock(
    @CurrentUser('id') userId: string,
    @Param('blockedId') blockedId: string,
  ) {
    return this.blockedUserService.unblock(userId, blockedId);
  }
}
