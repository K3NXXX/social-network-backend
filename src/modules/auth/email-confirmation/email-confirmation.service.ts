import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { TokenType } from '@prisma/client';
import { PrismaService } from '../../../common/prisma.service';
import { MailService } from 'src/common/mail/mail.service';
import { UserService } from 'src/modules/user/user.service';
import { SignupDto, SignupMeta } from '../dto/auth.dto';
import { hash } from 'bcrypt';

@Injectable()
export class EmailConfirmationService {
	public constructor(
		private readonly prisma: PrismaService,
		private readonly mailService: MailService,
		private readonly userService: UserService,
	) {}

	private generateVerificationCode(): string {
		return Math.floor(100000 + Math.random() * 900000).toString();
	}

	public async sendVerificationCode(dto: SignupDto) {
		const code = this.generateVerificationCode();
		const expiresIn = new Date(Date.now() + 15 * 60 * 1000);

		const existing = await this.prisma.token.findFirst({
			where: { email: dto.email, type: TokenType.VERIFICATION },
		});

		if (existing)
			await this.prisma.token.delete({ where: { id: existing.id } });

		const hashedPassword = await hash(dto.password, 10);

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

	public async verifyCode(code: number) {
		const record = await this.prisma.token.findFirst({
			where: { code: +code, type: TokenType.VERIFICATION },
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
}
