import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Query,
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

	@Authorization()
	@Post()
	@UseInterceptors(FileInterceptor('file'))
	create(
		@CurrentUser('id') userId: string,
		@Body() createPostDto: CreatePostDto,
		@UploadedFile() file: Express.Multer.File,
	) {
		return this.postService.create(createPostDto, userId, file);
	}

	@Get()
	findAll(@Query('page') page = '1', @Query('take') take = '15') {
		return this.postService.findAll(+page, +take);
	}

	@Authorization()
	@Get('user')
	findUserPosts(
		@CurrentUser('id') userId: string,
		@Query('page') page = '1',
		@Query('take') take = '10',
	) {
		return this.postService.findUserPosts(userId, +page, +take);
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.postService.findOne(id);
	}

	@Authorization()
	@Delete(':id')
	remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
		return this.postService.remove(id, userId);
	}
}
