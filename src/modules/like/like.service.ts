import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PostService } from '../post/post.service';
import { CommentService } from '../comment/comment.service';

@Injectable()
export class LikeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly post: PostService,
    private readonly comment: CommentService,
  ) {}

  async togglePostLike(postId: string, userId: string) {
    const post = await this.post.findOne(postId);
    if (!post) throw new Error('Post not found');

    const existing = await this.prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existing) {
      await this.prisma.like.delete({
        where: { id: existing.id },
      });
      return { liked: false };
    }

    await this.prisma.like.create({
      data: {
        postId,
        userId,
      },
    });

    return { liked: true };
  }

  async toggleCommentLike(commentId: string, userId: string) {
    const existing = await this.prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existing) {
      await this.prisma.like.delete({
        where: { id: existing.id },
      });
      return { liked: false };
    }

    await this.prisma.like.create({
      data: {
        commentId,
        userId,
      },
    });

    return { liked: true };
  }

  async getPostLikesCount(postId: string) {
    const count = await this.prisma.like.count({ where: { postId } });
    return { postId, likes: count };
  }

  async getCommentLikesCount(commentId: string) {
    const count = await this.prisma.like.count({ where: { commentId } });
    return { commentId, likes: count };
  }
}
