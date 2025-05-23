import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePostDto } from './dto/post.dto';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private readonly defaultPostInclude = {
    user: {
      select: {
        firstName: true,
        lastName: true,
        username: true,
        avatarUrl: true,
      },
    },
    comments: {
      select: {
        id: true,
        content: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
        likes: {
          select: {
            id: true,
          },
        },
        createdAt: true,
      },
    },
    likes: true,
  } as const;

  async create(dto: CreatePostDto, userId: string, file?: Express.Multer.File) {
    try {
      let photo;

      if (file) {
        try {
          const uploadResult = await this.cloudinaryService.uploadFile(file);
          photo = uploadResult.secure_url;
        } catch (error) {
          throw new BadRequestException(error);
        }
      }

      const post = await this.prisma.post.create({
        data: {
          content: dto.content,
          photo,
          userId,
        },
        include: this.defaultPostInclude,
      });

      return post;
    } catch (error) {
      throw new BadRequestException(error);
    }
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

    if (!post) throw new NotFoundException('Post not found');

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
