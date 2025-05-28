import { BadRequestException, Injectable } from '@nestjs/common';
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
    });

    return chat;
  }

  async getChat(senderId: string, receiverId: string) {
    if (senderId === receiverId)
      throw new BadRequestException("Can't chat with yourself");

    const user = await this.userService.findById(receiverId);

    const chat = await this.prisma.chat.findFirst({
      where: {
        isGroup: false,
        participants: {
          some: { userId: senderId },
        },
        AND: {
          participants: {
            some: { userId: receiverId },
          },
        },
      },
    });

    return {
      user,
      chat: chat ? chat : null,
    };
  }

  async getUserChats(userId: string): Promise<ChatDto[]> {
    const chats = await this.prisma.chat.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
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
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
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
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      chats.map(async (chat) => ({
        chatId: chat.id,
        chatName: chat.name,
        isGroup: chat.isGroup,
        lastMessage: chat.messages[0]
          ? {
              id: chat.messages[0].id,
              content: chat.messages[0].content,
              imageUrl: chat.messages[0].imageUrl,
              createdAt: chat.messages[0].createdAt,
              sender: {
                id: chat.messages[0].sender.id,
                firstName: chat.messages[0].sender.firstName,
                lastName: chat.messages[0].sender.lastName,
                avatarUrl: chat.messages[0].sender.avatarUrl,
              },
            }
          : null,
        participants: await Promise.all(
          chat.participants.map(async (p) => ({
            id: p.user.id,
            firstName: p.user.firstName,
            lastName: p.user.lastName,
            avatarUrl: p.user.avatarUrl,
            isOnline: await this.userService.isUserOnline(p.user.id),
          })),
        ),
      })),
    );
  }
}
