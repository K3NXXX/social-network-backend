import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaService } from 'src/common/prisma.service'
import { NotificationsGateway } from './notifications.gateway'

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, PrismaService, NotificationsGateway],
  exports: [NotificationService, NotificationsGateway]
})
export class NotificationModule {}
