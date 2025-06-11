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
		@Body() dto: CreatePostDto,
		@CurrentUser('id') userId: string,
		@UploadedFile() file: Express.Multer.File,
	) {
		return this.postService.create(dto, userId, file);
	}

	@Authorization()
	@UseInterceptors(FileInterceptor('file'))
	@Patch(':id')
	update(
		@Param('id') id: string,
		@CurrentUser('id') userId: string,
		@UploadedFile() file: Express.Multer.File,
		@Body() dto: UpdatePostDto,
	) {
		return this.postService.update(id, userId, dto, file);
	}

	@Get()
	getAll(
		@CurrentUser('id') userId: string,
		@Query('page') page = '1',
		@Query('take') take = '15',
	) {
		return this.postService.getAll(userId, +page, +take);
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
	discover(
		@CurrentUser('id') userId: string,
		@Query('page') page = '1',
		@Query('take') take = '10',
	) {
		return this.postService.getDiscover(userId, +page, +take);
	}

	@Authorization()
	@Get('user')
	getUserPosts(
		@CurrentUser('id') userId: string,
		@Query('page') page = '1',
		@Query('take') take = '10',
	) {
		return this.postService.getUserPosts(userId, +page, +take);
	}

	@Get('user/:userId')
	getOtherUserPosts(
		@Param('userId') userId: string,
		@Query('page') page = '1',
		@Query('take') take = '10',
	) {
		return this.postService.getUserPosts(userId, +page, +take);
	}

	@Authorization()
	@Get(':id')
	getPost(@Param('id') id: string, @CurrentUser('id') userId: string) {
		return this.postService.getOne(id, userId);
	}

	@Authorization()
	@Delete(':id')
	remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
		return this.postService.remove(id, userId);
	}
}
