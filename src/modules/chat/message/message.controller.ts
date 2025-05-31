import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/user.decorator';
import { Authorization } from '../../../common/decorators/auth.decorator';
import { MessageService } from './message.service';

@Authorization()
@Controller('chat')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('messages/:receiverId')
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('receiverId') receiverId: string,
    @Query('cursor') cursor?: string,
    @Query('take') take: string = '30',
  ) {
    return this.messageService.getMessages(userId, receiverId, +take, cursor);
  }
}
