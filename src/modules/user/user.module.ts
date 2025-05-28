import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'src/common/prisma.service';
import { UserController } from './user.controller';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FollowService } from '../follow/follow.service';
import { RedisModule } from '../../common/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [UserController],
  providers: [UserService, PrismaService, CloudinaryService, FollowService],
})
export class UserModule {}
