import { Controller, Get, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('user/:userId')
  getForUser(@Param('userId') userId: string) {
    return this.notificationService.getUserNotifications(userId);
  }
}
