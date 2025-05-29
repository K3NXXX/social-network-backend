import { Controller, HttpCode, HttpStatus, Post, Req, Body } from '@nestjs/common';
import { EmailConfirmationService } from './email-confirmation.service';
import { ConfirmationDto } from './dto/confirmation.dto';
import { Request } from 'express';

@Controller('auth/email-confirmation')
export class EmailConfirmationController {
  constructor(
    private readonly emailConfirmationService: EmailConfirmationService
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  public async newVerification(
    @Req() req: Request,
    @Body() dto: ConfirmationDto
  ) {
    return this.emailConfirmationService.newVerification(req, dto)
  }
}
