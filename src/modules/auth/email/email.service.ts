import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
} from '@nestjs/common';
import { TokenType } from '@prisma/client';
import { PrismaService } from '../../../common/prisma.service';
import { MailService } from 'src/common/mail/mail.service';
import { UserService } from 'src/modules/user/user.service';
import { SignupDto, SignupMeta } from '../dto/auth.dto';
import { hash } from 'bcrypt';
import { EmailChangeMeta } from './types/email-change.type';

@Injectable()
export class EmailService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly mailService: MailService,
		@Inject(forwardRef(() => UserService))
		private readonly userService: UserService,
	) {}

	private generateVerificationCode(): string {
		return Math.floor(100000 + Math.random() * 900000).toString();
	}

	public async sendConfirmationCode(dto: SignupDto) {
		const existing = await this.prisma.token.findFirst({
			where: { email: dto.email, type: TokenType.VERIFICATION },
		});

		if (existing) {
			const secondsElapsed =
				(Date.now() - new Date(existing.createdAt).getTime()) / 1000;

			if (secondsElapsed < 60)
				throw new BadRequestException(
					`Please wait ${Math.ceil(60 - secondsElapsed)} seconds before requesting a new code.`,
				);

			await this.prisma.token.delete({ where: { id: existing.id } });
		}

		const hashedPassword = await hash(dto.password, 10);
		const code = this.generateVerificationCode();
		const expiresIn = new Date(Date.now() + 15 * 60 * 1000);

		const meta: SignupMeta = {
			firstName: dto.firstName,
			lastName: dto.lastName,
			email: dto.email,
			password: hashedPassword,
		};

		await this.prisma.token.create({
			data: {
				email: dto.email,
				code: +code,
				expiresIn,
				type: TokenType.VERIFICATION,
				meta,
			},
		});

		await this.mailService.sendConfirmationCode(dto.email, +code);
	}

	public async resendConfirmationCode(email: string) {
		const existing = await this.prisma.token.findFirst({
			where: { email, type: TokenType.VERIFICATION },
		});

		if (!existing)
			throw new NotFoundException(
				'No pending registration found for this email',
			);

		const secondsElapsed =
			(Date.now() - new Date(existing.createdAt).getTime()) / 1000;

		if (secondsElapsed < 60)
			throw new BadRequestException(
				`Please wait ${Math.ceil(60 - secondsElapsed)} seconds before requesting a new code.`,
			);

		const newCode = this.generateVerificationCode();
		const newExpires = new Date(Date.now() + 15 * 60 * 1000);

		await this.prisma.token.update({
			where: { id: existing.id },
			data: {
				code: +newCode,
				expiresIn: newExpires,
				createdAt: new Date(),
			},
		});

		await this.mailService.sendConfirmationCode(email, +newCode);
	}

	public async confirmCode(code: number) {
		const record = await this.prisma.token.findFirst({
			where: { code, type: TokenType.VERIFICATION },
		});

		if (!record) throw new NotFoundException('Invalid code');
		if (new Date(record.expiresIn) < new Date())
			throw new BadRequestException('Code expired');

		const existingUser = await this.userService.findByEmail(record.email);
		if (existingUser) throw new BadRequestException('User already verified');

		const dto = record.meta as SignupMeta;

		const user = await this.prisma.user.create({
			data: {
				firstName: dto.firstName,
				lastName: dto.lastName,
				email: dto.email,
				password: dto.password,
				isVerified: true,
				lastLogin: new Date(),
			},
		});

		await this.prisma.token.delete({ where: { id: record.id } });

		return user;
	}

	public async sendEmailChangeCode(userId: string, newEmail: string) {
		const user = await this.userService.findById(userId);

		if (newEmail === user.email)
			throw new BadRequestException(
				'New email cannot be the same as current one',
			);

		const existingUser = await this.userService.findByEmail(newEmail);
		if (existingUser)
			throw new BadRequestException('This email is already in use');

		const recentToken = await this.prisma.token.findFirst({
			where: {
				email: newEmail,
				type: TokenType.EMAIL_CHANGE,
			},
		});

		if (recentToken) {
			const secondsElapsed =
				(Date.now() - new Date(recentToken.createdAt).getTime()) / 1000;

			if (secondsElapsed < 60) {
				throw new BadRequestException(
					`Please wait ${Math.ceil(60 - secondsElapsed)} seconds before requesting a new code.`,
				);
			}

			await this.prisma.token.delete({ where: { id: recentToken.id } });
		}

		const code = this.generateVerificationCode();
		const expiresIn = new Date(Date.now() + 15 * 60 * 1000);

		await this.prisma.token.create({
			data: {
				email: newEmail,
				code: +code,
				type: TokenType.EMAIL_CHANGE,
				expiresIn,
				meta: { userId: userId },
			},
		});

		await this.mailService.sendEmailChangeCode(newEmail, +code);
	}

	public async confirmEmailChange(code: number) {
		const token = await this.prisma.token.findFirst({
			where: {
				code,
				type: TokenType.EMAIL_CHANGE,
			},
		});

		if (!token) throw new BadRequestException('Invalid or expired code');

		if (new Date(token.expiresIn) < new Date()) {
			await this.prisma.token.delete({ where: { id: token.id } });
			throw new BadRequestException('Code expired');
		}

		const meta = token.meta as EmailChangeMeta;
		const userId = meta?.userId;

		if (!userId)
			throw new InternalServerErrorException('Token meta is missing userId');

		await this.prisma.user.update({
			where: { id: userId },
			data: { email: token.email },
		});

		await this.prisma.token.delete({ where: { id: token.id } });

		return { message: 'Email successfully updated' };
	}
}
