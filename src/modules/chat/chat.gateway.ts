import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { MessageService } from './message/message.service';
import { MessageDto } from './message/dto/message.dto';
import { UserService } from '../user/user.service';
import { ChatService } from './chat.service';
import { ChatEvents } from './chat.events';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server: Server;

	private userSockets = new Map<string, Set<string>>();

	private logger = new Logger(ChatGateway.name);

	constructor(
		private readonly messageService: MessageService,
		private readonly chatService: ChatService,
		private readonly userService: UserService,
		private readonly jwt: JwtService,
		private readonly configService: ConfigService,
	) {}

	async handleConnection(client: Socket) {
		try {
			const authHeader = client.handshake.headers['authorization'];
			const token =
				client.handshake.auth?.token ||
				(authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

			if (!token) {
				client.emit(ChatEvents.Error, { message: 'Unauthorized' });
				client.disconnect();
				return;
			}

			const payload = await this.jwt.verify(token, {
				secret: this.configService.getOrThrow<string>('JWT_SECRET'),
			});

			const userId = payload.sub || payload.id;
			client.data.user = { id: userId };

			const userSocketSet = this.userSockets.get(userId) ?? new Set();
			userSocketSet.add(client.id);
			this.userSockets.set(userId, userSocketSet);

			const wasOnline = await this.userService.isUserOnline(userId);
			await this.userService.setUserOnline(userId);

			if (!wasOnline) {
				await this.userService.updateLastLogin(userId);
				this.server.emit(ChatEvents.UserOnline, { userId });
			}

			this.logger.log(`User connected: ${userId}`);
		} catch (error) {
			this.logger.warn(`Socket auth failed: ${error}`);
			client.emit(ChatEvents.Error, { message: 'Unauthorized' });
			client.disconnect();
			throw error;
		}
	}

	async handleDisconnect(client: Socket) {
		for (const [userId, socketIds] of this.userSockets.entries()) {
			if (socketIds.has(client.id)) {
				socketIds.delete(client.id);

				if (socketIds.size === 0) {
					this.userSockets.delete(userId);
					await this.userService.setUserOffline(userId);
					this.server.emit(ChatEvents.UserOffline, { userId });
				}

				this.logger.log(`User disconnected: ${userId}`);
				break;
			}
		}
	}

	@SubscribeMessage(ChatEvents.JoinChat)
	async handleJoinChat(
		@MessageBody() chatId: string,
		@ConnectedSocket() client: Socket,
	) {
		client.join(chatId);
	}

	@SubscribeMessage(ChatEvents.LeaveChat)
	async handleLeaveChat(
		@MessageBody() chatId: string,
		@ConnectedSocket() client: Socket,
	) {
		client.leave(chatId);
	}

	@SubscribeMessage(ChatEvents.NewMessage)
	async handleSendMessage(
		@MessageBody() dto: MessageDto,
		@ConnectedSocket() client: Socket,
	) {
		try {
			const senderId = client.data.user?.id;
			if (!senderId)
				throw new InternalServerErrorException('User ID not found in socket');

			const message = await this.messageService.sendMessage(senderId, dto);

			const chatId = message.chat?.id;
			if (!chatId)
				throw new InternalServerErrorException('Chat ID missing in message');

			client.join(chatId);

			if (message.isNew) {
				const chat = await this.chatService.getChatById(chatId);

				client.emit(ChatEvents.ChatCreated, chat);

				const receiverId = dto.receiverId;
				if (!receiverId)
					throw new InternalServerErrorException('Receiver ID is missing');

				const receiverSocketIds = this.userSockets.get(receiverId) ?? new Set();
				for (const id of receiverSocketIds) {
					const sock = this.server.sockets.sockets.get(id);
					if (sock) {
						sock.join(chatId);
						sock.emit(ChatEvents.ChatCreated, chat);
					}
				}
			}

			this.server.to(chatId).emit(ChatEvents.Message, {
				...message,
				chatId,
			});
		} catch (error) {
			this.logger.error(`Send message error: ${error.message}`);
			client.emit(ChatEvents.Error, { message: error.message });
		}
	}

	@SubscribeMessage(ChatEvents.MessageSeen)
	async handleMessageSeen(
		@MessageBody() data: { messageId: string },
		@ConnectedSocket() client: Socket,
	) {
		try {
			const userId = client.data.user?.id;
			if (!userId)
				throw new InternalServerErrorException('User not found in socket');

			if (!data?.messageId) {
				client.emit(ChatEvents.Error, { message: 'Message ID is required' });
				return;
			}

			const updatedMessage = await this.messageService.markMessageAsSeen(
				data.messageId,
				userId,
			);

			const chatId = updatedMessage.chatId;
			if (!chatId) {
				client.emit(ChatEvents.Error, {
					message: 'Chat ID not found in updated message',
				});
				return;
			}

			this.server.to(chatId).emit(ChatEvents.MessageSeen, {
				messageId: data.messageId,
				userId,
			});
		} catch (error) {
			this.logger.error(`Error marking message as seen: ${error.message}`);
			client.emit(ChatEvents.Error, { message: error.message });
			throw error;
		}
	}
}
