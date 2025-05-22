import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CommentDto } from './dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CommentDto, userId: string) {
    const { postId, content, parentId } = dto;

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment || parentComment.postId !== postId)
        throw new BadRequestException('Invalid parent comment');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        userId,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        likes: true,
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            likes: true,
          },
        },
      },
    });

    return comment;
  }

  async findAllForPost(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        likes: true,
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            likes: true,
          },
        },
      },
    });
  }

  async findReplies(parentId: string) {
    const parent = await this.prisma.comment.findUnique({
      where: { id: parentId },
    });
    if (!parent) throw new NotFoundException('Parent comment not found');

    return this.prisma.comment.findMany({
      where: { parentId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        likes: true,
      },
    });
  }

  async update(id: string, userId: string, content: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId)
      throw new ForbiddenException('You can only edit your own comments');

    return this.prisma.comment.update({
      where: { id },
      data: { content },
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { replies: true },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId)
      throw new ForbiddenException('You can only delete your own comments');

    await this.prisma.comment.deleteMany({
      where: { parentId: comment.id },
    });

    await this.prisma.comment.delete({ where: { id: comment.id } });

    return { message: 'Comment deleted successfully' };
  }
}
