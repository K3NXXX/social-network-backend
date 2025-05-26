import { Module } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { NotificationModule } from '../notification/notification.module';
import { FollowController } from './follow.controller';
import { FollowService } from './follow.service';

@Module({
  imports: [NotificationModule],
  controllers: [FollowController],
  providers: [FollowService, PrismaService],
})
export class FollowModule {}
