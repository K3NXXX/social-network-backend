import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Authorization } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Authorization()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('i')
  async findUserChats(@CurrentUser('id') userId: string) {
    return this.chatService.findUserChats(userId);
  }

  @Get(':receiverId')
  async findChat(
    @CurrentUser('id') userId: string,
    @Param('receiverId') receiverId: string,
  ) {
    return this.chatService.findChat(userId, receiverId);
  }
}
