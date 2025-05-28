import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Authorization } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { UpdateUserDto } from './dto/user.dto';
import { UserService } from './user.service';
import { FollowService } from '../follow/follow.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly followService: FollowService,
  ) {}

  @Get()
  async search(@Query('search') query: string) {
    return this.userService.search(query);
  }

  @Authorization()
  @Get()
  async getUser(@CurrentUser('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Get('profile/:id')
  async getProfile(@Param('id') userId: string) {
    return this.userService.getProfile(userId);
  }

  @Authorization()
  @Get('friends')
  async getOnlineFollows(@CurrentUser('id') userId: string) {
    return this.userService.getOnlineFollows(userId);
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
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.userService.update(updateUserDto, userId);
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
