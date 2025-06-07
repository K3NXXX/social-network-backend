import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { NotificationModule } from '../notification/notification.module';
import { PostService } from '../post/post.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FollowService } from '../follow/follow.service';

@Module({
	imports: [NotificationModule],
	controllers: [LikeController],
	providers: [
		LikeService,
		PrismaService,
		PostService,
		CloudinaryService,
		FollowService,
	],
	exports: [LikeService],
})
export class LikeModule {}
