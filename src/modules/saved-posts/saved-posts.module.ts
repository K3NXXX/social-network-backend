import { Module } from '@nestjs/common';
import { SavedPostsService } from './saved-posts.service';
import { SavedPostsController } from './saved-posts.controller';
import { PrismaService } from '../../common/prisma.service';
import { PostService } from '../post/post.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { LikeService } from '../like/like.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationsGateway } from '../notification/notifications.gateway';
import { CommentService } from '../comment/comment.service';

@Module({
	controllers: [SavedPostsController],
	providers: [
		SavedPostsService,
		PrismaService,
		PostService,
		CloudinaryService,
		LikeService,
		NotificationService,
		NotificationsGateway,
		CommentService,
	],
})
export class SavedPostsModule {}
