import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { PrismaService } from '../../../common/prisma.service';

@Module({
  providers: [MessageService, PrismaService],
})
export class MessageModule {}
