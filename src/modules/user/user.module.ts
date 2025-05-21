import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [UserController],
  providers: [UserService, UserService, PrismaService],
})
export class UserModule {}
