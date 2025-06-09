import { Module } from '@nestjs/common';
import { SavedPostsService } from './saved-posts.service';
import { SavedPostsController } from './saved-posts.controller';
import { PrismaService } from '../../common/prisma.service';
import { PostService } from '../post/post.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Module({
	controllers: [SavedPostsController],
	providers: [SavedPostsService, PrismaService, PostService, CloudinaryService],
})
export class SavedPostsModule {}
