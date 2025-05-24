import { Controller, Get, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Authorization } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { MessageService } from './message/message.service';

@Authorization()
@Controller('chats')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
  ) {}

  @Get()
  async getAll() {
    return this.chatService.getAll();
  }

  @Get(':receiverId')
  async getOrCreatePrivateChatInfo(
    @CurrentUser('id') userId: string,
    @Param('receiverId') receiverId: string,
  ) {
    return this.chatService.getChat(userId, receiverId);
  }

  @Get('messages/:receiverId')
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('receiverId') receiverId: string,
  ) {
    return this.messageService.getMessages(userId, receiverId);
  }
}
