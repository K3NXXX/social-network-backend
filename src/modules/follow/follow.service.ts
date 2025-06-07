import { BadRequestException, Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationsGateway } from '../notification/notifications.gateway';

@Injectable()
export class FollowService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly notification: NotificationService,
		private readonly notificationsGateway: NotificationsGateway,
	) {}

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

		const sender = await this.prisma.user.findUnique({
			where: { id: followerId },
			select: { username: true, firstName: true, lastName: true },
		});

		const username = sender?.username
			? sender.username
			: ((sender?.firstName ?? '') + ' ' + (sender?.lastName ?? '')).trim() ||
				'Someone';

		await this.notification.create({
			type: NotificationType.NEW_FOLLOWER,
			message: `${username} followed you`,
			userId: followingId,
			senderId: followerId,
		});

		this.notificationsGateway.sendNotification(followingId, {
			type: NotificationType.LIKE,
			message: `${username} liked your post`,
			senderId: followerId,
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

	async getFollowingIds(userId: string): Promise<string[]> {
		const follows = await this.prisma.follow.findMany({
			where: { followerId: userId },
			select: { followingId: true },
		});
		return follows.map(f => f.followingId);
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
