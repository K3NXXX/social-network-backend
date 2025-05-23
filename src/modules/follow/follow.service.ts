import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class FollowService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId)
      throw new BadRequestException('Cannot follow yourself');

    const followingUser = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!followingUser)
      throw new BadRequestException('User to follow not found');

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existing) {
      await this.prisma.follow.delete({
        where: { id: existing.id },
      });
      return { following: false };
    }

    await this.prisma.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    return { following: true };
  }

  async getFollowers(userId: string) {
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      select: {
        follower: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
        createdAt: true,
      },
    });
  }

  async getFollowing(userId: string) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      select: {
        following: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
        createdAt: true,
      },
    });
  }

  async isFollowing(userId: string, followingId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: followingId,
        },
      },
    });
    return { isFollowing: !!existing };
  }
}
