import { forwardRef, Module } from '@nestjs/common';
import { EmailConfirmationService } from './email-confirmation.service';
import { MailModule } from 'src/common/mail/mail.module';
import { AuthModule } from '../auth.module';
import { UserService } from 'src/modules/user/user.service';
import { MailService } from 'src/common/mail/mail.service';
import { PrismaService } from '../../../common/prisma.service';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';

@Module({
	imports: [MailModule, forwardRef(() => AuthModule)],
	providers: [
		EmailConfirmationService,
		UserService,
		MailService,
		PrismaService,
		AuthService,
		CloudinaryService,
		JwtService,
	],
	exports: [EmailConfirmationService],
})
export class EmailConfirmationModule {}
