import { forwardRef, Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PostModule } from '../post/post.module';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { NotificationModule } from '../notification/notification.module';
import { CommentModule } from '../comment/comment.module';
import { PostService } from '../post/post.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
	imports: [PostModule, forwardRef(() => CommentModule), NotificationModule],
	controllers: [LikeController],
	providers: [LikeService, PrismaService, CloudinaryService, PostService],
	exports: [LikeService],
})
export class LikeModule {}
