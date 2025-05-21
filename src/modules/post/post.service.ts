import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, userId: string) {
    return this.prisma.post.create({
      data: {
        content: createPostDto.content,
        photo: createPostDto.photo,
        userId,
      },
    });
  }

  async findAll() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
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
      },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
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
      },
    });

    if (!post) throw new NotFoundException(`Post with this id: ${id} is not found`);
    return post;
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    if (!post) throw new NotFoundException('Пост не знайдено');
    if (post.userId !== userId)
      throw new NotFoundException('Ви не можете видалити чужий пост');

    await this.prisma.post.delete({ where: { id } });
    return { message: 'Пост успішно видалено' };
  }
}
