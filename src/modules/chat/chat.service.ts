import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { ChatDto } from './dto/chat.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  async createChat(userId: string, dto: ChatDto) {
    const { isGroup, participantIds, name } = dto;

    if (!isGroup) {
      if (participantIds.length !== 1)
        throw new BadRequestException('Private chat requires one participant');

      const existing = await this.prisma.chat.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: { in: [userId, participantIds[0]] },
            },
          },
        },
        include: { participants: true },
      });

      if (existing && existing.participants.length === 2) {
        return existing;
      }

      return this.prisma.chat.create({
        data: {
          isGroup: false,
          creatorId: userId,
          participants: {
            create: [{ userId }, { userId: participantIds[0] }],
          },
        },
        include: { participants: true },
      });
    } else {
      if (!name) throw new BadRequestException('Group chat requires name');
      if (participantIds.length < 2)
        throw new BadRequestException('Group chat must have at least 2 users');
      if (participantIds.includes(userId))
        throw new BadRequestException('You cannot add yourself explicitly');

      const allIds = [...new Set([userId, ...participantIds])];

      return this.prisma.chat.create({
        data: {
          isGroup: true,
          name,
          creatorId: userId,
          participants: {
            create: allIds.map((id) => ({
              userId: id,
            })),
          },
        },
        include: { participants: true },
      });
    }
  }

  async getAll() {
    return this.prisma.chat.findMany({
      include: { participants: true },
    });
  }

  async getChat(userId: string, participantId: string) {
    if (userId === participantId)
      throw new BadRequestException("Can't chat with yourself");

    const user = await this.userService.findById(participantId);

    const existingChat = await this.prisma.chat.findFirst({
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
      select: { id: true },
    });

    return {
      user,
      chatId: existingChat?.id || null,
    };
  }
}
