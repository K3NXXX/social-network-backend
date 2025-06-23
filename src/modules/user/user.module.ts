import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'src/common/prisma.service';
import { UserController } from './user.controller';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { NotificationModule } from '../notification/notification.module';
import { RedisModule } from '../../common/redis.module';
import { EmailModule } from '../auth/email/email.module';
import { FollowService } from '../follow/follow.service';
import { BlockUserService } from '../block-user/block-user.service';

@Module({
	imports: [NotificationModule, RedisModule, forwardRef(() => EmailModule)],
	controllers: [UserController],
	providers: [
		UserService,
		PrismaService,
		CloudinaryService,
		FollowService,
		BlockUserService,
	],
})
export class UserModule {}
