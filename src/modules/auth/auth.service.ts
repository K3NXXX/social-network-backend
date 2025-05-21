import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { LoginDto, SignupDto } from './dto/auth.dto';
import { compare } from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}
  
  async register(dto: SignupDto) {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) throw new BadRequestException('User already exists');
    
    const user = await this.userService.create(
      dto.firstName,
      dto.lastName,
      dto.email,
      dto.password,
      dto.confirmPassword,
    );
    const tokens = this.issueTokens(user.id);
    
    return { user, ...tokens };
  }
  
  async login(dto: LoginDto) {
    const user = await this.validate(dto);
    const tokens = this.issueTokens(user.id);
    
    return { user, ...tokens };
  }
  
  private async validate(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new NotFoundException('User not found');
    
    const isPasswordValid = await compare(dto.password, user.password);
    if (!isPasswordValid) throw new BadRequestException('Invalid credentials');
    
    return user;
  }
  
  issueTokens(userId: string) {
    const data = { id: userId };
    
    const accessToken = this.jwt.sign(data, {
      expiresIn: '1h',
    });
    
    const refreshToken = this.jwt.sign(data, {
      expiresIn: '15d',
    });
    
    return { accessToken, refreshToken };
  }
  
  async refresh(refreshToken: string) {
    const result = await this.jwt.verifyAsync(refreshToken);
    if (!result) throw new UnauthorizedException('Invalid refresh token');
    
    const user = await this.userService.findById(result.id);
    const tokens = this.issueTokens(user.id);
    
    return { user, ...tokens };
  }
  
  addRefreshToken(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      domain: this.configService.get('SERVER_DOMAIN'),
      expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      secure: true,
      sameSite: 'lax',
    });
  }
  
  removeRefreshToken(res: Response) {
    res.cookie('refreshToken', '', {
      httpOnly: true,
      domain: this.configService.get('SERVER_DOMAIN'),
      expires: new Date(0),
      secure: true,
      sameSite: 'lax',
    });
  }
}