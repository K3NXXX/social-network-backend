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
import { UserDto } from './dto/user.dto';
import { UserService } from './user.service';
import { FollowService } from '../follow/follow.service';
import { AccountDto } from './dto/account.dto';

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
	@Get('profile')
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
	@Patch('profile')
	async updateProfile(@CurrentUser('id') userId: string, @Body() dto: UserDto) {
		return this.userService.updateProfile(dto, userId);
	}

	@Authorization()
	@Patch('account')
	async updateAccount(
		@CurrentUser('id') userId: string,
		@Body() dto: AccountDto,
	) {
		return this.userService.updateAccount(dto, userId);
	}

	@Authorization()
	@Patch('update/avatar')
	@UseInterceptors(FileInterceptor('file'))
	async uploadAvatar(
		@CurrentUser('id') userId: string,
		@UploadedFile() file: Express.Multer.File,
	) {
		return this.userService.uploadAvatar(userId, file);
	}

	@Authorization()
	@Delete('delete/avatar')
	async deleteAvatar(@CurrentUser('id') userId: string) {
		return this.userService.deleteAvatar(userId);
	}
}
