import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaService } from '../../common/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FollowService } from '../follow/follow.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationsGateway } from '../notification/notifications.gateway';

@Module({
	controllers: [PostController],
	providers: [
		PostService,
		PrismaService,
		CloudinaryService,
		FollowService,
		NotificationService,
		NotificationsGateway,
	],
})
export class PostModule {}
