import { Injectable } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
import { render } from "@react-email/components";
import { ConfirmationTemplate } from "./templates/confirmation.template";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  public async sendConfirmationEmail(email: string, token: string) {
    const domain = this.configService.getOrThrow<string>("ALLOWED_ORIGIN");
    const html = await render(ConfirmationTemplate({ domain, token }));

    return this.sendMail(email, "Mail Confirmation", html);
  }

  private sendMail(email: string, subject: string, html: string) {
    return this.mailerService.sendMail({
      to: email,
      subject,
      html,
    });
  }
}
