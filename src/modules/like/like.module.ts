import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CommentService } from '../comment/comment.service';
import { PostModule } from '../post/post.module';
import { PostService } from '../post/post.service';
import { LikeController } from './like.controller';
import { LikeService } from './like.service';
import { NotificationModule } from '../notification/notification.module'

@Module({
  imports: [PostModule, CloudinaryModule, NotificationModule],
  controllers: [LikeController],
  providers: [LikeService, PrismaService, PostService, CommentService],
})
export class LikeModule {}
