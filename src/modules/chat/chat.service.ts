import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UserService } from '../user/user.service';
import { ChatDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
	constructor(
		private prisma: PrismaService,
		private readonly userService: UserService,
	) {}

	async create(senderId: string, receiverId: string) {
		const chat = await this.prisma.chat.create({
			data: {
				creatorId: senderId,
				participants: {
					create: [
						{ user: { connect: { id: senderId } } },
						{ user: { connect: { id: receiverId } } },
					],
				},
			},
			include: {
				participants: {
					select: { user: { select: this.USER } },
				},
			},
		});

		return chat;
	}

	async findChat(senderId: string, receiverId: string) {
		if (senderId === receiverId)
			throw new BadRequestException("Can't chat with yourself");

		const chat = await this.prisma.chat.findFirst({
			where: {
				isGroup: false,
				AND: [
					{ participants: { some: { userId: senderId } } },
					{ participants: { some: { userId: receiverId } } },
				],
			},
			include: {
				participants: {
					select: { user: { select: this.USER } },
				},
			},
		});

		return chat;
	}

	async findOrCreateChat(senderId: string, receiverId: string) {
		const chat = await this.findChat(senderId, receiverId);

		if (chat) return { chat, isNew: false };

		const receiver = await this.prisma.user.findUnique({
			where: { id: receiverId },
			select: this.USER,
		});

		if (!receiver) throw new NotFoundException('Receiver not found');

		const newChat = await this.create(senderId, receiverId);
		return { chat: newChat, isNew: true, receiver };
	}

	async findUserChats(
		userId: string,
		take = 20,
		cursor?: string,
	): Promise<ChatDto[]> {
		const chats = await this.prisma.chat.findMany({
			where: { participants: { some: { userId } } },
			take,
			skip: cursor ? 1 : undefined,
			...(cursor && { cursor: { id: cursor } }),
			include: {
				participants: {
					include: { user: { select: this.USER } },
				},
				messages: {
					orderBy: { createdAt: 'desc' },
					take: 1,
					include: { sender: { select: this.USER } },
				},
			},
			orderBy: { updatedAt: 'desc' },
		});

		return Promise.all(
			chats.map(async chat => ({
				chatId: chat.id,
				name: chat.name ?? null,
				isGroup: chat.isGroup,
				lastMessage: chat.messages[0]
					? {
							id: chat.messages[0].id,
							content: chat.messages[0].content ?? undefined,
							imageUrl: chat.messages[0].imageUrl ?? null,
							createdAt: chat.messages[0].createdAt,
							sender: {
								id: chat.messages[0].sender.id,
								firstName: chat.messages[0].sender.firstName,
								lastName: chat.messages[0].sender.lastName,
								avatarUrl: chat.messages[0].sender.avatarUrl ?? null,
							},
						}
					: null,
				participants: await Promise.all(
					chat.participants.map(async p => ({
						id: p.user.id,
						firstName: p.user.firstName,
						lastName: p.user.lastName,
						avatarUrl: p.user.avatarUrl ?? null,
						isOnline: await this.userService.isUserOnline(p.user.id),
					})),
				),
			})),
		);
	}

	private readonly USER = {
		id: true,
		firstName: true,
		lastName: true,
		username: true,
		avatarUrl: true,
	};
}
