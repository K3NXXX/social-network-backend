import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { genSalt, hash } from 'bcrypt';

@Injectable()
export class UserService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async findById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  public async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    return user;
  }

  public async create(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    confirmPassword: string,
  ) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existingUser)
      throw new ConflictException(`User with email ${email} already exists`);

    if (password !== confirmPassword)
      throw new ConflictException('Passwords do not match');

    const salt = await genSalt(10);
    password = await hash(password, salt);

    const user = await this.prismaService.user.create({
      data: {
        firstName,
        lastName,
        email,
        password,
      },
    });

    return user;
  }
}
