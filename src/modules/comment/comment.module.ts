import { forwardRef, Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PrismaService } from '../../common/prisma.service';
import { NotificationModule } from '../notification/notification.module';
import { LikeModule } from '../like/like.module';

@Module({
	imports: [forwardRef(() => LikeModule), NotificationModule],
	controllers: [CommentController],
	providers: [CommentService, PrismaService],
	exports: [CommentService],
})
export class CommentModule {}
