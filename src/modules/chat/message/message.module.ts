import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { PrismaService } from '../../../common/prisma.service';
import { ChatService } from '../chat.service';
import { UserService } from '../../user/user.service';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { MessageController } from './message.controller';

@Module({
	controllers: [MessageController],
	providers: [
		MessageService,
		PrismaService,
		ChatService,
		UserService,
		CloudinaryService,
	],
})
export class MessageModule {}
