import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { PrismaService } from '../../common/prisma.service';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { MessageService } from './message/message.service';
import { EmailService } from '../auth/email/email.service';
import { MailService } from '../../common/mail/mail.service';

@Module({
	controllers: [ChatController],
	providers: [
		ChatGateway,
		ChatService,
		PrismaService,
		JwtService,
		ConfigService,
		UserService,
		CloudinaryService,
		MessageService,
		EmailService,
		MailService,
	],
})
export class ChatModule {}
