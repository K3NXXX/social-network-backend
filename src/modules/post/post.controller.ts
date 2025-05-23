import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Authorization } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CreatePostDto } from './dto/post.dto';
import { PostService } from './post.service';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @Authorization()
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.postService.create(createPostDto, userId, file);
  }

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Get('user')
  @Authorization()
  findUserPosts(@CurrentUser('id') userId: string) {
    return this.postService.findUserPosts(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Delete(':id')
  @Authorization()
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.postService.remove(id, userId);
  }
}
