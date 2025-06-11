import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { MessageDto } from './dto/message.dto';
import { ChatService } from '../chat.service';

@Injectable()
export class MessageService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly chatService: ChatService,
	) {}

	async sendMessage(senderId: string, dto: MessageDto, chatId?: string) {
		const { content, imageUrl, receiverId } = dto;

		if (!content?.trim() && !imageUrl)
			throw new BadRequestException('Message must contain content or image');

		let chat;
		let isNew = false;

		if (chatId) {
			chat = await this.chatService.getChatById(chatId);
			if (!chat)
				throw new NotFoundException(`Chat with ID ${chatId} not found`);
		} else {
			const chatResult = await this.chatService.getOrCreateChat(
				senderId,
				receiverId,
			);
			chat = chatResult.chat;
			isNew = chatResult.isNew;
		}

		const message = await this.prisma.message.create({
			data: {
				content: content?.trim() || '',
				imageUrl,
				senderId,
				chatId: chat.id,
			},
			include: {
				sender: {
					select: this.USER,
				},
				chat: { select: { id: true } },
			},
		});

		return { ...message, isNew, chat };
	}

	async getMessages(
		userId: string,
		receiverId: string,
		take = 30,
		cursor?: string,
	) {
		const chat = await this.chatService.getChat(userId, receiverId);

		if (!chat)
			return {
				messages: [],
				chat: null,
				hasNextPage: false,
				nextCursor: null,
			};

		const where: any = { chatId: chat.id };

		if (cursor) where.id = { lt: cursor };

		const messages = await this.prisma.message.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			take: take + 1,
			include: {
				sender: {
					select: this.USER,
				},
			},
		});

		const hasNextPage = messages.length > take;

		if (hasNextPage) messages.pop();

		return {
			chat,
			messages: messages.reverse(),
			hasNextPage,
			nextCursor: messages.length ? messages[0].id : null,
		};
	}

	async markMessageAsSeen(messageId: string, userId: string) {
		const message = await this.prisma.message.findUnique({
			where: { id: messageId },
			include: {
				chat: {
					select: {
						id: true,
						participants: { select: { userId: true } },
					},
				},
			},
		});

		if (!message) throw new NotFoundException('Message not found');

		const isParticipant = message.chat.participants.some(
			p => p.userId === userId,
		);

		if (!isParticipant)
			throw new ForbiddenException('You are not a participant of this chat');

		await this.prisma.message.update({
			where: { id: messageId },
			data: { isRead: true },
		});

		return { chatId: message.chat.id };
	}

	private readonly USER = {
		id: true,
		firstName: true,
		lastName: true,
		username: true,
		avatarUrl: true,
	};
}
