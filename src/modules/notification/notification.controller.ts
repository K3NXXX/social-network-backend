import { Controller, Get, Param } from '@nestjs/common';
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
	@Get('notifications/read')
	async markAllAsRead(@CurrentUser('id') userId: string) {
		await this.notificationService.markAllAsRead(userId);
		return { success: true };
	}

	@Authorization()
	@Get('notification/:id/read')
	async markAsRead(@Param('id') notificationId: string) {
		await this.notificationService.markAsRead(notificationId);
		return { success: true };
	}
}
