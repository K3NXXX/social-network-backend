import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { MessageDto } from './dto/message.dto';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(userId: string, dto: MessageDto) {
    let { chatId, content, imageUrl, participantId } = dto;

    if (!content && !imageUrl)
      throw new BadRequestException('Message must contain content or image');

    if (chatId) {
      const chat = await this.prisma.chat.findUnique({
        where: { id: chatId },
        include: { participants: true },
      });

      if (!chat) throw new NotFoundException('Chat not found');

      const isParticipant = chat.participants.some((p) => p.userId === userId);
      if (!isParticipant)
        throw new NotFoundException('You are not a participant in this chat');
    }

    if (!chatId && participantId) {
      if (participantId === userId)
        throw new BadRequestException("Can't create chat with yourself");

      const existing = await this.prisma.chat.findFirst({
        where: {
          isGroup: false,
          participants: {
            some: { userId },
          },
          AND: {
            participants: {
              some: { userId: participantId },
            },
          },
        },
      });

      if (existing) {
        chatId = existing.id;
      } else {
        const newChat = await this.prisma.chat.create({
          data: {
            isGroup: false,
            creatorId: userId,
            participants: {
              create: [{ userId }, { userId: participantId }],
            },
          },
        });

        chatId = newChat.id;
      }
    }

    return this.prisma.message.create({
      data: {
        content,
        imageUrl,
        senderId: userId,
        chatId: chatId as string,
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
          select: { id: true, isGroup: true },
        },
      },
    });
  }
}
