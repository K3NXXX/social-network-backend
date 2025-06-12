import {
	Body,
	Controller,
	Post,
	Req,
	Res,
	UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './dto/auth.dto';
import { Request, Response } from 'express';
import { Authorization } from '../../common/decorators/auth.decorator';
import { EmailService } from './email/email.service';

@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private emailService: EmailService,
	) {}

	@Post('register')
	async register(@Body() dto: SignupDto) {
		await this.authService.register(dto);
		return {
			message: 'Verification code sent to your email',
		};
	}

	@Post('register/confirm')
	async verifyCode(
		@Body('code') code: string,
		@Res({ passthrough: true }) res: Response,
	) {
		const user = await this.emailService.confirmCode(+code);

		const tokens = this.authService.issueTokens(user.id);
		this.authService.addRefreshToken(res, tokens.refreshToken);

		return {
			message: 'Account verified and registered successfully!',
			user,
			accessToken: tokens.accessToken,
		};
	}

	@Post('register/resend')
	async resendCode(@Body('email') email: string) {
		await this.emailService.resendConfirmationCode(email);
		return {
			message: 'New verification code sent',
		};
	}

	@Post('login')
	async login(
		@Body() dto: LoginDto,
		@Res({ passthrough: true }) res: Response,
	) {
		const { refreshToken, ...response } = await this.authService.login(dto);

		this.authService.addRefreshToken(res, refreshToken);

		return response;
	}

	@Post('logout')
	async logout(@Res({ passthrough: true }) res: Response) {
		this.authService.removeRefreshToken(res);
		return true;
	}

	@Authorization()
	@Post('refresh')
	async refresh(
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const refreshToken = req.cookies['refreshToken'];
		if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

		const {
			user,
			accessToken,
			refreshToken: newRefreshToken,
		} = await this.authService.refresh(refreshToken);

		this.authService.addRefreshToken(res, newRefreshToken);

		return { accessToken, user };
	}
}
