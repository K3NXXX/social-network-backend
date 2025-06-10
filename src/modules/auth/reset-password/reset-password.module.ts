import { Module } from '@nestjs/common';
import { ResetPasswordService } from './reset-password.service';
import { ResetPasswordController } from './reset-password.controller';
import { UserService } from 'src/modules/user/user.service';
import { MailService } from 'src/common/mail/mail.service';
import { PrismaService } from 'src/common/prisma.service';
import { EmailService } from '../email/email.service';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';

@Module({
  controllers: [ResetPasswordController],
  providers: [ResetPasswordService, UserService, MailService, PrismaService, EmailService, CloudinaryService],
})
export class ResetPasswordModule {}
