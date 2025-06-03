import { Controller, Get } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Authorization } from '../../common/decorators/auth.decorator';

@Controller('user')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Authorization()
  @Get('notifications')
  getForUser(@CurrentUser('id') userId: string) {
    return this.notificationService.getUserNotifications(userId);
  }

  @Authorization()
  @Get('notifications/readAll')
  async markAllAsRead(@CurrentUser('id') userId: string) {
    await this.notificationService.markAllAsRead(userId);
    return { success: true };
  }
}
