
import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/notification.dto'
import { PrismaService } from 'src/common/prisma.service'

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        ...dto,
      },
    });
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
          lastName: true
        },
      },
      post: {
        select: {
          id: true,
          content: true,
          photo: true,
        },
      },
      like: {
        select: {
          id: true,
        },
      },
      comment: {
        select: {
          id: true,
        },
      },
    },
  });
}


  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }
}