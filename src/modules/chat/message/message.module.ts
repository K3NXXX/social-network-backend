import { forwardRef, Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { PrismaService } from '../../../common/prisma.service';
import { ChatService } from '../chat.service';
import { UserService } from '../../user/user.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { ChatModule } from '../chat.module';

@Module({
  imports: [forwardRef(() => ChatModule)],
  providers: [
    MessageService,
    PrismaService,
    ChatService,
    UserService,
    CloudinaryService,
  ],
  exports: [MessageService],
})
export class MessageModule {}
