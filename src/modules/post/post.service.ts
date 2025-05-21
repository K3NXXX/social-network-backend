import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreatePostDto } from './dto/post.dto';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultPostInclude = {
    user: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatarUrl: true,
      },
    },
    comments: true,
    likes: true,
  } as const;

  async create(createPostDto: CreatePostDto, userId: string) {
    return this.prisma.post.create({
      data: {
        ...createPostDto,
        userId,
      },
      include: this.defaultPostInclude,
    });
  }

  async findAll() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: this.defaultPostInclude,
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.defaultPostInclude,
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async findUserPosts(userId: string) {
    return this.prisma.post.findMany({
      where: { userId },
      include: this.defaultPostInclude,
    });
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId)
      throw new ForbiddenException('You are not allowed to delete this post');

    await this.prisma.post.delete({ where: { id } });
    return { message: 'Post deleted successfully' };
  }
}
