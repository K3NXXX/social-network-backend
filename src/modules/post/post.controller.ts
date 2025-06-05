import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Authorization } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { PostService } from './post.service';

@Controller('posts')
export class PostController {
	constructor(private readonly postService: PostService) {}

	@Authorization()
	@UseInterceptors(FileInterceptor('file'))
	@Post()
	create(
		@CurrentUser('id') userId: string,
		@Body() createPostDto: CreatePostDto,
		@UploadedFile() file: Express.Multer.File,
	) {
		return this.postService.create(createPostDto, userId, file);
	}

	@Authorization()
	@UseInterceptors(FileInterceptor('file'))
	@Patch(':id')
	async update(
		@CurrentUser('id') userId: string,
		@Param('id') id: string,
		@UploadedFile() file: Express.Multer.File,
		@Body() dto: UpdatePostDto,
	) {
		return this.postService.update(id, userId, dto, file, dto.removePhoto);
	}

	@Authorization()
	@Get('feed')
	getFeed(
		@CurrentUser('id') userId: string,
		@Query('page') page = '1',
		@Query('take') take = '10',
	) {
		return this.postService.getFeed(userId, +page, +take);
	}

	@Authorization()
	@Get('discover')
	async discover(
		@CurrentUser('id') userId: string,
		@Query('page') page = '1',
		@Query('take') take = '10',
	) {
		return this.postService.getDiscover(userId, +page, +take);
	}

	@Get()
	findAll(@Query('page') page = '1', @Query('take') take = '15') {
		return this.postService.getAll(+page, +take);
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

	@Authorization()
	@Get(':id')
	async getPost(@Param('id') id: string, @CurrentUser('id') userId: string) {
		return this.postService.findOne(id, userId);
	}

	@Authorization()
	@Delete(':id')
	remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
		return this.postService.remove(id, userId);
	}
}
