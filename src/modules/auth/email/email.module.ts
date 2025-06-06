import { forwardRef, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailModule } from 'src/common/mail/mail.module';
import { AuthModule } from '../auth.module';
import { UserService } from 'src/modules/user/user.service';
import { MailService } from 'src/common/mail/mail.service';
import { PrismaService } from '../../../common/prisma.service';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { UserModule } from '../../user/user.module';

@Module({
	imports: [
		MailModule,
		forwardRef(() => AuthModule),
		forwardRef(() => UserModule),
	],
	providers: [
		EmailService,
		UserService,
		MailService,
		PrismaService,
		AuthService,
		CloudinaryService,
		JwtService,
	],
	exports: [EmailService],
})
export class EmailModule {}
