import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MessageModule } from './message/message.module';
import { PrismaService } from '../../common/prisma.service';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessageService } from './message/message.service';
import { UserService } from '../user/user.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
  imports: [MessageModule],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    ChatService,
    MessageService,
    PrismaService,
    JwtService,
    ConfigService,
    UserService,
    CloudinaryService,
    PrismaService,
  ],
})
export class ChatModule {}
