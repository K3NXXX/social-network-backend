import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Authorization } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { UpdateUserDto } from './dto/user.dto';
import { UserService } from './user.service';
import { FollowService } from '../follow/follow.service';
import { CheckBlocked } from '../../common/decorators/block-user.decorator';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly followService: FollowService,
  ) {}

  @Authorization()
  @Get()
  async getProfile(@CurrentUser('id') userId: string) {
    return this.userService.findById(userId);
  }

  @CheckBlocked()
  @Authorization()
  @Get('/profile/:id')
  async getUserProfile(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }

  @Authorization()
  @Get('followers')
  async getMyFollowers(@CurrentUser('id') userId: string) {
    return this.followService.getFollowers(userId);
  }

  @Authorization()
  @Get('following')
  getFollowing(@CurrentUser('id') userId: string) {
    return this.followService.getFollowing(userId);
  }

  @Authorization()
  @Patch('update')
  async updateUser(
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.userService.update(dto, userId);
  }

  @Authorization()
  @Patch('update/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.userService.uploadAvatar(file, userId);
  }

  @Authorization()
  @Delete('delete/avatar')
  async deleteAvatar(@CurrentUser('id') userId: string) {
    return this.userService.deleteAvatar(userId);
  }
}
