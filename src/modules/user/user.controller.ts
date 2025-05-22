import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Authorization } from 'src/common/decorators/auth.decorator';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { UpdateUserDto } from './dto/user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Authorization()
  @Get()
  async getProfile(@CurrentUser('id') userId: string) {
    return this.userService.findById(userId);
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
  @Patch('uploadAvatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.userService.uploadAvatar(file, userId);
  }

  @Authorization()
  @Delete('deleteAvatar')
  async deleteAvatar(@CurrentUser('id') userId: string) {
    return this.userService.deleteAvatar(userId);
  }
}
