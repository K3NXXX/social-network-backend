import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from 'src/common/prisma.service';
import { UserController } from './user.controller'
import { CloudinaryService } from '../cloudinary/cloudinary.service'

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, CloudinaryService],
})
export class UserModule {}
