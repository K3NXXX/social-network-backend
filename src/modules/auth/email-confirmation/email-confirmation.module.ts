import { forwardRef, Module } from '@nestjs/common';
import { EmailConfirmationService } from './email-confirmation.service';
import { EmailConfirmationController } from './email-confirmation.controller';
import { MailModule } from 'src/common/mail/mail.module';
import { AuthModule } from '../auth.module';
import { UserService } from 'src/modules/user/user.service';
import { MailService } from 'src/common/mail/mail.service';
import { PrismaService } from '../../../common/prisma.service';
import { AuthService } from '../auth.service';
import { CloudinaryService } from '../../../modules/cloudinary/cloudinary.service'
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [MailModule, forwardRef(() => AuthModule)],
  controllers: [EmailConfirmationController],
  providers: [EmailConfirmationService, UserService, MailService, PrismaService, AuthService, CloudinaryService, JwtService],
  exports: [EmailConfirmationService]
})
export class EmailConfirmationModule {}
