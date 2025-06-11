import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { compare, genSalt, hash } from 'bcrypt';
import { PrismaService } from '../../common/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { UserDto } from './dto/user.dto';
import Redis from 'ioredis';
import { AccountDto } from './dto/account.dto';
import { EmailService } from '../auth/email/email.service';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);
	private readonly ONLINE_USERS_SET = 'user:online';
	private readonly DEFAULT_USER_SELECT = {
		id: true,
		firstName: true,
		lastName: true,
		username: true,
		avatarUrl: true,
	};

	constructor(
		private readonly prisma: PrismaService,
		private emailService: EmailService,
		private readonly cloudinaryService: CloudinaryService,
		@Inject('REDIS_CLIENT') private readonly redis: Redis,
	) {}

	async findById(id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
		});

		if (!user) throw new NotFoundException('User not found');

		return user;
	}

	async findByEmail(email: string) {
		return this.prisma.user.findUnique({ where: { email } });
	}

	async getProfile(id: string) {
		const profile = await this.findById(id);
		if (!profile) throw new NotFoundException('User not found');

		const [followers, following, posts] = await Promise.all([
			this.prisma.follow.count({ where: { followingId: id } }),
			this.prisma.follow.count({ where: { followerId: id } }),
			this.prisma.post.count({ where: { userId: id } }),
		]);

		return { ...profile, followers, following, posts };
	}

	async getOnlineFollows(userId: string) {
		const [following, followers] = await Promise.all([
			this.prisma.follow.findMany({
				where: { followerId: userId },
				select: { followingId: true },
			}),
			this.prisma.follow.findMany({
				where: { followingId: userId },
				select: { followerId: true },
			}),
		]);

		const userIdsSet = new Set<string>();
		following.forEach(f => userIdsSet.add(f.followingId));
		followers.forEach(f => userIdsSet.add(f.followerId));

		const allUserIds = Array.from(userIdsSet);
		if (!allUserIds.length) return [];

		const onlineUsers = await this.redis.smembers(this.ONLINE_USERS_SET);
		const onlineFollowedIds = allUserIds.filter(id => onlineUsers.includes(id));
		if (!onlineFollowedIds.length) return [];

		return this.prisma.user.findMany({
			where: { id: { in: onlineFollowedIds } },
			select: this.DEFAULT_USER_SELECT,
		});
	}

	async updateLastLogin(userId: string) {
		await this.prisma.user.update({
			where: { id: userId },
			data: { lastLogin: new Date() },
		});
	}

	async create(
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
		const hashedPassword = await hash(password, salt);

		return this.prisma.user.create({
			data: {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email,
				password: hashedPassword,
			},
		});
	}

	async updateProfile(userId: string, dto: UserDto) {
		const { dateOfBirth, ...other } = dto;

		const user = await this.findById(userId);

		const data: Record<string, any> = { ...other };

		if (dateOfBirth !== undefined)
			data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

		await this.prisma.user.update({
			where: { id: user.id },
			data: data,
		});

		return true;
	}

	async updateAccount(userId: string, dto: AccountDto) {
		const user = await this.findById(userId);

		const updateData: Record<string, any> = {};

		if (dto.newPassword) {
			if (!dto.currentPassword)
				throw new BadRequestException('Current password is required');

			const isValid = await compare(dto.currentPassword, user.password);
			if (!isValid)
				throw new ConflictException('Current password is incorrect');

			const isSame = await compare(dto.newPassword, user.password);
			if (isSame)
				throw new ConflictException(
					'New password cannot be the same as the current one',
				);

			const salt = await genSalt(10);
			updateData.password = await hash(dto.newPassword, salt);
		}

		if (dto.newEmail) {
			try {
				await this.emailService.sendEmailChangeCode(userId, dto.newEmail);
			} catch (error) {
				this.logger.error('Failed to send email change code', error);
				throw error;
			}

			return {
				message: 'Verification code sent to your email',
			};
		}

		if (dto.newUsername) {
			const isSame = dto.newUsername === user.username;
			if (isSame)
				throw new BadRequestException(
					'New username cannot be the same as the current one',
				);

			const existing = await this.prisma.user.findUnique({
				where: { username: dto.newUsername },
			});

			if (existing) throw new BadRequestException('Username is already taken');

			updateData.username = dto.newUsername;
		}

		if (Object.keys(updateData).length > 0) {
			await this.prisma.user.update({
				where: { id: user.id },
				data: updateData,
			});
		}

		return { message: 'Account update initiated' };
	}

	async uploadAvatar(userId: string, file: Express.Multer.File) {
		if (!file) throw new BadRequestException('File is required');

		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw new NotFoundException('User not found');

		if (user.avatarPublicId) {
			try {
				await this.cloudinaryService.deleteFile(user.avatarPublicId);
			} catch (error) {
				this.logger.warn('Could not delete old avatar', error);
			}
		}

		let uploadResult;
		try {
			uploadResult = await this.cloudinaryService.uploadFile(file);
		} catch (error) {
			throw new BadRequestException('Failed to upload avatar');
		}

		await this.prisma.user.update({
			where: { id: userId },
			data: {
				avatarUrl: uploadResult.secure_url,
				avatarPublicId: uploadResult.public_id,
			},
		});

		return { photo: user.avatarUrl };
	}

	async deleteAvatar(userId: string) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw new NotFoundException('User not found');

		if (user.avatarPublicId) {
			try {
				await this.cloudinaryService.deleteFile(user.avatarPublicId);
			} catch (error) {
				this.logger.error('Cloudinary delete error', error);
			}
		}

		await this.prisma.user.update({
			where: { id: userId },
			data: {
				avatarUrl: null,
				avatarPublicId: null,
			},
		});

		return true;
	}

	async search(query: string) {
		if (!query?.trim()) return [];

		const normalizedQuery = query.trim().toLowerCase();

		return this.prisma.user.findMany({
			where: {
				OR: [
					{ firstName: { contains: normalizedQuery, mode: 'insensitive' } },
					{ lastName: { contains: normalizedQuery, mode: 'insensitive' } },
					{ username: { contains: normalizedQuery, mode: 'insensitive' } },
				],
			},
			select: this.DEFAULT_USER_SELECT,
			orderBy: { firstName: 'asc' },
		});
	}

	// Redis methods
	async setUserOnline(userId: string): Promise<void> {
		await this.redis.sadd(this.ONLINE_USERS_SET, userId);
	}

	async setUserOffline(userId: string): Promise<void> {
		await this.redis.srem(this.ONLINE_USERS_SET, userId);
	}

	async isUserOnline(userId: string): Promise<boolean> {
		return (await this.redis.sismember(this.ONLINE_USERS_SET, userId)) === 1;
	}

	async getOnlineUsers(): Promise<string[]> {
		return this.redis.smembers(this.ONLINE_USERS_SET);
	}
}
