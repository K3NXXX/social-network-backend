import { Module } from '@nestjs/common';
import { BlockUserService } from './block-user.service';
import { BlockUserController } from './block-user.controller';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [BlockUserController],
  providers: [BlockUserService, PrismaService],
})
export class BlockUserModule {}
