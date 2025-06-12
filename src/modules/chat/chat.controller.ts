import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Authorization } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Authorization()
@Controller()
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Get('user/all')
	async getUsers() {
		return this.chatService.getAllUsers();
	}

	@Get('chat/i')
	async findUserChats(@CurrentUser('id') userId: string) {
		return this.chatService.getUserChats(userId);
	}

	@Get('chat/:receiverId')
	async findChat(
		@CurrentUser('id') userId: string,
		@Param('receiverId') receiverId: string,
	) {
		return this.chatService.getChat(userId, receiverId);
	}
}
