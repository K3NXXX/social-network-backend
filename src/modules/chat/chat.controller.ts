import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  @Post()
  async create(
    @CurrentUser('id') senderId: string,
    @Body('receiverId') receiverId: string,
  ) {
    return this.chatService.create(senderId, receiverId);
  }

  @Get('i')
  async getUserChats(@CurrentUser('id') userId: string) {
    return this.chatService.getUserChats(userId);
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
