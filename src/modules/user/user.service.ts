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
  public async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
    },
  ) {
    const user = await this.findById(id);
    if (data.email && data.email !== user.email) {
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictException(`Користувач з email ${data.email} вже існує`);
      }
    }

    let hashedPassword: string | undefined;
    if (data.password) {
      const salt = await genSalt(10);
      hashedPassword = await hash(data.password, salt);
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    return updatedUser;
  }

  public async delete(id: string) {
    await this.findById(id);

    await this.prismaService.user.delete({
      where: { id },
    });

    return { message: 'Користувача успішно видалено' };
  }
}
