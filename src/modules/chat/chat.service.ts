import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UserService } from '../user/user.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async getAll() {
    return this.prisma.chat.findMany({
      include: { participants: true, messages: true },
    });
  }

  async getChat(userId: string, receiverId: string) {
    if (userId === receiverId)
      throw new BadRequestException("Can't chat with yourself");

    const user = await this.userService.findById(receiverId);

    const existingChat = await this.prisma.chat.findFirst({
      where: {
        isGroup: false,
        participants: {
          some: { userId },
        },
        AND: {
          participants: {
            some: { userId: receiverId },
          },
        },
      },
      select: { id: true },
    });

    return {
      user,
      chatId: existingChat?.id || null,
    };
  }

  async getChatByMessageId(messageId: string) {
    return this.prisma.chat.findFirst({
      where: {
        messages: {
          some: {
            id: messageId,
          },
        },
      },
      include: {
        participants: true,
      },
    });
  }
}
