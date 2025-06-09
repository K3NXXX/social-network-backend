import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './common/prisma.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { PostModule } from './modules/post/post.module';
import { CommentModule } from './modules/comment/comment.module';
import { LikeModule } from './modules/like/like.module';
import { FollowModule } from './modules/follow/follow.module';
import { BlockUserModule } from './modules/block-user/block-user.module';
import { NotificationModule } from './modules/notification/notification.module';
import { MailModule } from './common/mail/mail.module';
import { EmailModule } from './modules/auth/email/email.module';
import { ChatModule } from './modules/chat/chat.module';
import { MessageModule } from './modules/chat/message/message.module';
import { SavedPostsModule } from './modules/saved-posts/saved-posts.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		UserModule,
		AuthModule,
		CloudinaryModule,
		PostModule,
		CommentModule,
		LikeModule,
		FollowModule,
		ChatModule,
		MessageModule,
		NotificationModule,
		BlockUserModule,
		MailModule,
		EmailModule,
		SavedPostsModule,
	],
	controllers: [AppController],
	providers: [AppService, PrismaService],
})
export class AppModule {}
