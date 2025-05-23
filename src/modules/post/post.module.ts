import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaService } from '../../common/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import { CloudinaryModule } from '../cloudinary/cloudinary.module'

@Module({
   imports: [CloudinaryModule],
  controllers: [PostController],
  providers: [PostService, PrismaService, CloudinaryService],
})
export class PostModule {}
