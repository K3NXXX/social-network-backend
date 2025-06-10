import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma.service';
import { MailService } from 'src/common/mail/mail.service';
import { UserService } from 'src/modules/user/user.service';
import { TokenType } from '@prisma/client';
import { hash } from 'bcrypt';
import { ResetPasswordDto } from 'src/modules/auth/reset-password/dto/reset-password.dto';
import { NewPasswordDto } from 'src/modules/auth/reset-password/dto/new-password.dto';

@Injectable()
export class ResetPasswordService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly mailService: MailService,
        private readonly userService: UserService,
    ) {}

    private generatePasswordResetCode(): number {
        return Math.floor(100000 + Math.random() * 900000);
    }

    public async resetPassword(dto: ResetPasswordDto): Promise<boolean> {
        const existingUser = await this.userService.findByEmail(dto.email);

        if (!existingUser) {
            throw new NotFoundException(
                `User with email ${dto.email} does not exist. Please check the email and try again.`,
            );
        }

        const existingToken = await this.prisma.token.findFirst({
            where: {
                email: dto.email,
                type: TokenType.PASSWORD_RESET,
            },
        });

        if (existingToken) {
            const secondsElapsed =
                (Date.now() - new Date(existingToken.createdAt).getTime()) / 1000;
            if (secondsElapsed < 60)
                throw new BadRequestException(
                    `Please wait ${Math.ceil(60 - secondsElapsed)} seconds before requesting a new reset.`,
                );

            await this.prisma.token.delete({ where: { id: existingToken.id } });
        }

        const code = this.generatePasswordResetCode();
        const expiresIn = new Date(Date.now() + 30 * 60 * 1000);

        await this.prisma.token.create({
            data: {
                email: dto.email,
                code: code,
                type: TokenType.PASSWORD_RESET,
                expiresIn,
            },
        });

        await this.mailService.sendResetPassword(dto.email, code);

        return true;
    }

    public async newPassword(dto: NewPasswordDto, code: number): Promise<boolean> {
        const existingToken = await this.prisma.token.findFirst({
            where: {
                code: code,
                type: TokenType.PASSWORD_RESET,
            },
        });

        if (!existingToken) {
            throw new NotFoundException(
                'Invalid or expired code provided. Please request a new password reset.',
            );
        }

        if (new Date(existingToken.expiresIn) < new Date()) {
            await this.prisma.token.delete({ where: { id: existingToken.id } });
            throw new BadRequestException('Your code has expired. Please request a new one.');
        }

        const user = await this.userService.findByEmail(existingToken.email);

        if (!user) {
            throw new NotFoundException(`User with email ${existingToken.email} not found.`);
        }

        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: await hash(dto.password, 10) },
        });

        await this.prisma.token.delete({
            where: { id: existingToken.id },
        });

        return true;
    }
}