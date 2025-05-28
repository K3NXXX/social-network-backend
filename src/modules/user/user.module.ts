import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'src/common/prisma.service';
import { UserController } from './user.controller';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FollowService } from '../follow/follow.service';
import { NotificationModule } from '../notification/notification.module'
import { RedisModule } from '../../common/redis.module';

@Module({
  imports: [NotificationModule, RedisModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, CloudinaryService, FollowService],
})
export class UserModule {}