import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

import { PrismaService } from "../../../common/prisma.service";
import { TokenType, User } from "@prisma/client";
import { Request } from "express";
import { ConfirmationDto } from "./dto/confirmation.dto";
import { MailService } from "src/common/mail/mail.service";
import { UserService } from "src/modules/user/user.service";
import { AuthService } from "../auth.service";

@Injectable()
export class EmailConfirmationService {
  public constructor(
    private readonly prismaService: PrismaService, 
    private readonly mailService: MailService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService
  ) {}

  public async newVerification(req: Request, dto: ConfirmationDto) {
    const existingToken = await this.prismaService.token.findUnique({
      where: {
        token: dto.token,
        type: TokenType.VERIFICATION
      }
    })

    if(!existingToken) {
      throw new NotFoundException(
        'Token not found. Please make sure your token is correct.'
      )
    }

    const hasExpired = new Date(existingToken.expiresIn) < new Date()

    if(hasExpired) {
      throw new BadRequestException(
        'Verification token expired.'
      )
    }

    const existingUser = await this.userService.findByEmail(
      existingToken.email
    )

    if (!existingUser) {
      throw new NotFoundException(
        'User with this email was not found.'
      )
    }

    await this.prismaService.user.update({
      where: {
        id: existingUser.id
      },
      data: {
        isVerified: true
      }
    })

    await this.prismaService.token.delete({
      where: {
        id: existingToken.id,
        type: TokenType.VERIFICATION
      }
    })

    /////////////////////////////////////////////
  }

  public async sendVerificationToken(user: User) {
     const verificationToken = await this.generateVerificationToken(
      user.email
     )

     await this.mailService.sendConfirmationEmail(
      verificationToken.email,
      verificationToken.token
     )

     return true
  }

  private async generateVerificationToken(email: string) {
    const token = uuidv4();
    const expiresIn = new Date(new Date().getTime() + 3600 * 1000);

    const existingToken = await this.prismaService.token.findFirst({
      where: {
        email,
        type: TokenType.VERIFICATION
      }
    })

    if (existingToken) {
      await this.prismaService.token.delete({
        where: {
          id: existingToken.id,
          type: TokenType.VERIFICATION
        }
      })
    }

    const verificationToken = await this.prismaService.token.create({
      data: {
        email,
        token,
        expiresIn,
        type: TokenType.VERIFICATION
      }
    })

    return verificationToken
    }
}