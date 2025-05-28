import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare, genSalt, hash } from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UpdateUserDto } from './dto/user.dto';
import Redis from 'ioredis';

@Injectable()
export class UserService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  private ONLINE_USERS_SET = 'online_users';

  public async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  public async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user;
  }

  public async getProfile(id: string) {
    const profile = await this.prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          select: {
            id: true,
            content: true,
            photo: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('User not found');

    const [followers, following] = await Promise.all([
      this.prisma.follow.count({
        where: { followingId: id },
      }),
      this.prisma.follow.count({
        where: { followerId: id },
      }),
    ]);

    return { ...profile, followers, following };
  }

  public async getOnlineFollows(userId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    });

    const userIdsSet = new Set<string>();
    following.forEach((f) => userIdsSet.add(f.followingId));
    followers.forEach((f) => userIdsSet.add(f.followerId));

    const allUserIds = Array.from(userIdsSet);

    if (allUserIds.length === 0) return [];

    const onlineUsers = await this.redis.smembers(this.ONLINE_USERS_SET);
    const onlineFollowedIds = allUserIds.filter((id) =>
      onlineUsers.includes(id),
    );

    if (onlineFollowedIds.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: { id: { in: onlineFollowedIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatarUrl: true,
      },
    });

    return users;
  }

  async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }

  public async create(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser)
      throw new ConflictException(`User with email ${email} already exists`);

    const salt = await genSalt(10);
    password = await hash(password, salt);

    const user = await this.prisma.user.create({
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

    const user = await this.findById(userId);

    const isPasswordValid = await compare(currentPassword, user.password);
    if (!isPasswordValid)
      throw new ConflictException('Current password is incorrect');

    let hashedPassword = user.password;
    if (newPassword) {
      const salt = await genSalt(10);
      hashedPassword = await hash(newPassword, salt);
    }

    const updatedUser = await this.prisma.user.update({
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
    await this.findById(userId);

    if (!file) throw new BadRequestException('File is required');

    const uploadResult = await this.cloudinaryService.uploadFile(file);
    const avatarUrl = uploadResult.secure_url;
    const avatarPublicId = uploadResult.public_id;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl, avatarPublicId: avatarPublicId },
    });

    return updatedUser;
  }

  public async deleteAvatar(userId: string) {
    const user = await this.findById(userId);

    if (user.avatarPublicId) {
      try {
        await this.cloudinaryService.deleteFile(user.avatarPublicId);
      } catch (error) {
        console.error('Cloudinary delete error:', error);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null, avatarPublicId: null },
    });

    return updatedUser;
  }

  public async search(query: string) {
    if (!query?.trim()) return false;

    const normalizedQuery = query.trim().toLowerCase();

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { firstName: { contains: normalizedQuery, mode: 'insensitive' } },
          { lastName: { contains: normalizedQuery, mode: 'insensitive' } },
          { username: { contains: normalizedQuery, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatarUrl: true,
      },
      orderBy: { firstName: 'asc' },
    });

    return users;
  }

  /// REDIS
  async setUserOnline(userId: string): Promise<void> {
    await this.redis.sadd(this.ONLINE_USERS_SET, userId);
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.redis.srem(this.ONLINE_USERS_SET, userId);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const isMember = await this.redis.sismember(this.ONLINE_USERS_SET, userId);
    return isMember === 1;
  }

  async getOnlineUsers(): Promise<string[]> {
    return this.redis.smembers(this.ONLINE_USERS_SET);
  }
}
