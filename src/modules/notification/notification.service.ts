import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/notification.dto';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class NotificationService {
	constructor(private prisma: PrismaService) {}

	async create(dto: CreateNotificationDto) {
		const notification = await this.prisma.notification.create({
			data: {
				...dto,
			},
		});

		const count = await this.prisma.notification.count({
			where: { userId: dto.userId },
		});

		if (count > 50) {
			const excess = count - 50;

			const oldest = await this.prisma.notification.findMany({
				where: { userId: dto.userId },
				orderBy: { createdAt: 'asc' },
				take: excess,
				select: { id: true },
			});

			const idsToDelete = oldest.map(n => n.id);

			await this.prisma.notification.deleteMany({
				where: { id: { in: idsToDelete } },
			});
		}

		return notification;
	}

	async getUserNotifications(userId: string) {
		return this.prisma.notification.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				type: true,
				message: true,
				isRead: true,
				createdAt: true,
				sender: {
					select: {
						id: true,
						username: true,
						firstName: true,
						lastName: true,
						avatarUrl: true,
					},
				},
				post: {
					select: {
						id: true,
						content: true,
						photo: true,
					},
				},
			},
		});
	}

	async markAllAsRead(userId: string) {
		return this.prisma.notification.updateMany({
			where: { userId, isRead: false },
			data: { isRead: true },
		});
	}

	async markAsRead(notificationId: string) {
		return this.prisma.notification.update({
			where: { id: notificationId },
			data: { isRead: true },
		});
	}
}
