import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class BlockUserService {
  constructor(private prisma: PrismaService) {}

  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId)
      throw new ForbiddenException("You can't block yourself");

    if (await this.isBlocked(blockerId, blockedId))
      throw new ConflictException('User is already blocked');

    return this.prisma.blockedUser.create({
      data: {
        blockerId,
        blockedId,
      },
    });
  }

  async unblock(blockerId: string, blockedId: string) {
    if (!(await this.isBlocked(blockerId, blockedId)))
      throw new ConflictException('User is not blocked');

    return this.prisma.blockedUser.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const blocked = await this.prisma.blockedUser.findFirst({
      where: {
        OR: [
          { blockerId, blockedId },
          { blockedId, blockerId },
        ],
      },
    });
    return !!blocked;
  }

  async getBlockedUsers(userId: string) {
    return this.prisma.blockedUser.findMany({
      where: { blockerId: userId },
      select: {
        blocked: {
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
  }
}
