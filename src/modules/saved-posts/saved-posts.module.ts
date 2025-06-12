import { Module } from '@nestjs/common';
import { SavedPostsService } from './saved-posts.service';
import { SavedPostsController } from './saved-posts.controller';
import { PrismaService } from '../../common/prisma.service';
import { PostService } from '../post/post.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationsGateway } from '../notification/notifications.gateway';
import { FollowService } from '../follow/follow.service';
import { BlockUserService } from '../block-user/block-user.service';

@Module({
	controllers: [SavedPostsController],
	providers: [
		SavedPostsService,
		PrismaService,
		PostService,
		CloudinaryService,
		FollowService,
		NotificationService,
		NotificationsGateway,
		BlockUserService,
	],
})
export class SavedPostsModule {}
