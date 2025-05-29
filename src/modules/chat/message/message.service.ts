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

  async sendMessage(senderId: string, dto: MessageDto) {
    const { content, imageUrl, receiverId } = dto;

    if (!content?.trim() && !imageUrl)
      throw new BadRequestException('Message must contain content or image');

    const { chat, isNew } = await this.chatService.getChat(
      senderId,
      receiverId,
    );

    const message = await this.prisma.message.create({
      data: {
        content: content?.trim() || '',
        imageUrl,
        senderId,
        chatId: chat.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
        chat: {
          select: {
            id: true,
          },
        },
      },
    });

    return { ...message, chatId: chat.id, isNew: isNew };
  }

  async getMessages(
    userId: string,
    receiverId: string,
    take = 30,
    cursor?: string,
  ) {
    const { chat } = await this.chatService.getChat(userId, receiverId);
    if (!chat) return [];

    const where: any = {
      chatId: chat.id,
    };

    if (cursor) where.id = { lt: cursor };

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return messages.reverse();
  }

  async markMessageAsSeen(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          select: {
            id: true,
            participants: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!message) throw new NotFoundException('Message not found');

    const isParticipant = message.chat.participants.some(
      (p) => p.userId === userId,
    );

    if (!isParticipant)
      throw new ForbiddenException('You are not a participant of this chat');

    await this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    return { chatId: message.chat.id };
  }
}
