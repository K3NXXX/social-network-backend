import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { PrismaService } from '../../common/prisma.service';
import { UserService } from '../user/user.service';
import { getJwtConfig } from 'src/common/config/jwt.config';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import { EmailConfirmationModule } from './email-confirmation/email-confirmation.module';
import { MailService } from 'src/common/mail/mail.service';

@Module({
  imports: [
    UserModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig,
    }),
    forwardRef(() => EmailConfirmationModule)
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy, UserService, CloudinaryService, MailService],
  exports: [AuthService]
})
export class AuthModule {}
