import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { PrismaService } from '../../common/prisma.service';
import { PostService } from '../post/post.service';
import { CommentService } from '../comment/comment.service';

@Module({
  controllers: [LikeController],
  providers: [LikeService, PrismaService, PostService, CommentService],
})
export class LikeModule {}
