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

    if (!receiverId)
      throw new BadRequestException('ReceiverId must be provided');

    const existingChat = await this.chatService.getChat(senderId, receiverId);

    let chatId: string;
    let isNewChat = false;

    if (existingChat?.chat?.id) {
      chatId = existingChat.chat.id;
    } else {
      const newChat = await this.chatService.create(senderId, receiverId);
      chatId = newChat.id;
      isNewChat = true;
    }

    const message = await this.prisma.message.create({
      data: {
        content: content?.trim(),
        imageUrl,
        sender: { connect: { id: senderId } },
        chat: { connect: { id: chatId } },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        chat: {
          select: {
            id: true,
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return { ...message, isNewChat };
  }

  async getMessages(userId: string, receiverId: string) {
    const chat = await this.chatService.getChat(userId, receiverId);
    if (!chat.chat?.id) return [];

    const messages = await this.prisma.message.findMany({
      where: { chatId: chat.chat?.id },
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

    return messages;
  }

  async getMessage(id: string) {
    return this.prisma.message.findUnique({
      where: { id },
      include: {
        chat: {
          select: {
            id: true,
            creatorId: true,
            participants: {
              select: { id: true },
            },
          },
        },
      },
    });
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
      (participant) => participant.userId.toString() === userId.toString(),
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
