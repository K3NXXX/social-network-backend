import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { MessageDto } from './dto/message.dto';
import { ChatService } from '../chat.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async sendMessage(dto: MessageDto) {
    const { content, imageUrl, senderId, receiverId } = dto;

    if (!content?.trim() && !imageUrl)
      throw new BadRequestException('Message must contain content or image');
    if (!receiverId)
      throw new BadRequestException('ReceiverId must be provided');

    const chat = await this.prisma.chat.findFirst({
      where: {
        participants: {
          every: {
            OR: [{ userId: senderId }, { userId: receiverId }],
          },
        },
      },
      include: {
        participants: true,
      },
    });

    let chatId: string;

    if (!chat) {
      const newChat = await this.prisma.chat.create({
        data: {
          creatorId: senderId,
          participants: {
            create: [
              { user: { connect: { id: senderId } } },
              { user: { connect: { id: receiverId } } },
            ],
          },
        },
      });
      chatId = newChat.id;
    } else chatId = chat.id;

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

    return message;
  }

  async getMessages(userId: string, receiverId: string) {
    const chat = await this.chatService.getChat(userId, receiverId);
    let messages: any[] = [];
    if (chat.chatId) {
      messages = await this.prisma.message.findMany({
        where: {
          chatId: chat.chatId as string,
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
        },
      });
    } else {
      return false;
    }

    return messages;
  }
}
