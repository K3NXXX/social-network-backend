import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MessageModule } from './message/message.module';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [MessageModule],
})
export class ChatModule {}
