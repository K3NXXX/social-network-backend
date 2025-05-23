import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare, genSalt, hash } from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email,
        password,
      },
    });

    return user;
  }

  public async update(updateUserDto: UpdateUserDto, userId: string) {
    const { currentPassword, newPassword, email, ...otherData } = updateUserDto;

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid)
      throw new ConflictException('Current password is incorrect');

    let hashedPassword = user.password;
    if (newPassword) {
      const salt = await genSalt(10);
      hashedPassword = await hash(newPassword, salt);
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        ...otherData,
        password: hashedPassword,
        email: email?.trim(),
        firstName: otherData.firstName?.trim(),
        lastName: otherData.lastName?.trim(),
        bio: otherData.bio,
        location: otherData.location,
        dateOfBirth: otherData.dateOfBirth
          ? new Date(otherData.dateOfBirth)
          : undefined,
      },
    });

    return updatedUser;
  }

  public async uploadAvatar(file: Express.Multer.File, userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    if (!file) throw new BadRequestException('File is required');

    const uploadResult = await this.cloudinaryService.uploadFile(file);
    const avatarUrl = uploadResult.secure_url;

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return updatedUser;
  }

  public async deleteAvatar(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    return updatedUser;
  }
}
