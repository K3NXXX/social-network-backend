import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto } from './dto/chat.dto';
import { Authorization } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@Authorization()
@Controller('chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async createChat(@CurrentUser('id') userId: string, @Body() dto: ChatDto) {
    return this.chatService.createChat(userId, dto);
  }

  @Get()
  async getAll() {
    return this.chatService.getAll();
  }

  @Get(':participantId')
  async getOrCreatePrivateChatInfo(
    @CurrentUser('id') userId: string,
    @Param('participantId') participantId: string,
  ) {
    return this.chatService.getChat(userId, participantId);
  }
}
