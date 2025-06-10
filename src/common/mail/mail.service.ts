import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { render } from '@react-email/components';
import { ConfirmationTemplate } from './templates/confirmation.template';
import { ConfigService } from '@nestjs/config';
import { EmailChangeTemplate } from './templates/email-change.template';
import { ResetPasswordTemplate } from './templates/reset-password.template';

@Injectable()
export class MailService {
	private transporter: nodemailer.Transporter;

	constructor(private readonly configService: ConfigService) {
		this.transporter = nodemailer.createTransport({
			service: this.configService.get<string>('EMAIL_SERVICE'),
			auth: {
				user: this.configService.get<string>('EMAIL_USER'),
				pass: this.configService.get<string>('EMAIL_PASS'),
			},
		});
	}

	public async sendConfirmationCode(email: string, code: number) {
		const html = await render(ConfirmationTemplate(code));

		return this.sendMail(email, 'Mail Confirmation', html);
	}

	public async sendEmailChangeCode(email: string, code: number) {
		const html = await render(EmailChangeTemplate(code));

		return this.sendMail(email, 'Change Email', html);
	}

	public async sendResetPassword(email: string, code: number) {
		const html = await render(ResetPasswordTemplate(code));
	
		return this.sendMail(email, "Reset Password", html);
	  }

	private sendMail(email: string, subject: string, html: string) {
		return this.transporter.sendMail({
			to: email,
			subject,
			html,
		});
	}
}
