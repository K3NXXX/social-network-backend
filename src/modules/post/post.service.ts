import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';

@Injectable()
export class PostService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly cloudinaryService: CloudinaryService,
	) {}

	private readonly defaultPostInclude = {
		user: {
			select: {
				firstName: true,
				lastName: true,
				username: true,
				avatarUrl: true,
			},
		},
		_count: {
			select: {
				likes: true,
				comments: true,
			},
		},
	} as const;

	async create(dto: CreatePostDto, userId: string, file?: Express.Multer.File) {
		const hasContent = dto.content?.trim();
		const hasFile = !!file;

		if (!hasContent && !hasFile)
			throw new BadRequestException('Post must contain content or image');

		let photo: string | undefined;
		let photoPublicId: string | undefined;

		if (file) {
			try {
				const uploadResult = await this.cloudinaryService.uploadFile(file);
				photo = uploadResult.secure_url;
				photoPublicId = uploadResult.public_id;
			} catch (error) {
				throw new BadRequestException('Failed to upload image');
			}
		}

		const post = await this.prisma.post.create({
			data: {
				content: hasContent ? dto.content?.trim() : null,
				photo,
				photoPublicId,
				userId,
			},
			include: this.defaultPostInclude,
		});

		return post;
	}

	async update(id: string, dto: UpdatePostDto, userId: string) {
		const post = await this.prisma.post.findUnique({ where: { id } });

		if (!post) throw new NotFoundException('Post not found');
		if (post.userId !== userId)
			throw new ForbiddenException('You cannot update this post');

		const updated = await this.prisma.post.update({
			where: { id },
			data: {
				content: dto.content?.trim() ?? post.content,
			},
			include: this.defaultPostInclude,
		});

		return updated;
	}

	async remove(id: string, userId: string) {
		const post = await this.prisma.post.findUnique({ where: { id } });

		if (!post) throw new NotFoundException('Post not found');
		if (post.userId !== userId)
			throw new ForbiddenException('You are not allowed to delete this post');

		if (post.photoPublicId) {
			try {
				await this.cloudinaryService.deleteFile(post.photoPublicId);
			} catch (error) {
				console.error('Cloudinary delete error:', error);
			}
		}

		await this.prisma.post.delete({ where: { id } });
		return { message: 'Post deleted successfully' };
	}

	async getAll(page: number, take: number) {
		const skip = (page - 1) * take;

		const [posts, total] = await Promise.all([
			this.prisma.post.findMany({
				skip,
				take,
				orderBy: [{ createdAt: 'desc' }],
				include: this.defaultPostInclude,
			}),
			this.prisma.post.count(),
		]);

		return {
			data: posts,
			total,
			page,
			lastPage: Math.ceil(total / take),
		};
	}

	async getDiscover(userId: string, page: number, take: number) {
		const skip = (page - 1) * take;

		const following = await this.prisma.follow.findMany({
			where: { followerId: userId },
			select: { followingId: true },
		});
		const followingIds = following.map(f => f.followingId);

		const excludedIds = [...followingIds, userId];

		const [posts, total] = await Promise.all([
			this.prisma.post.findMany({
				where: {
					userId: { notIn: excludedIds },
				},
				skip,
				take,
				orderBy: [
					{ likes: { _count: 'desc' } },
					{ comments: { _count: 'desc' } },
					{ createdAt: 'desc' },
				],
				include: this.defaultPostInclude,
			}),
			this.prisma.post.count({
				where: { userId: { notIn: excludedIds } },
			}),
		]);

		return {
			data: posts,
			total,
			page,
			lastPage: Math.ceil(total / take),
		};
	}

	async findUserPosts(userId: string, page: number, take: number) {
		const skip = (page - 1) * take;

		const [posts, total] = await Promise.all([
			this.prisma.post.findMany({
				where: { userId },
				skip,
				take,
				orderBy: { createdAt: 'desc' },
				include: this.defaultPostInclude,
			}),
			this.prisma.post.count({ where: { userId } }),
		]);

		return {
			data: posts,
			total,
			page,
			lastPage: Math.ceil(total / take),
		};
	}

	async findOne(id: string) {
		const post = await this.prisma.post.findUnique({
			where: { id },
			include: {
				...this.defaultPostInclude,
			},
		});

		if (!post) throw new NotFoundException('Post not found');
		return post;
	}

	async getFeed(userId: string, page: number, take: number) {
		const skip = (page - 1) * take;

		const following = await this.prisma.follow.findMany({
			where: { followerId: userId },
			select: { followingId: true },
		});
		const followingIds = following.map(f => f.followingId);

		const allIds = [...followingIds, userId];

		const [posts, total] = await Promise.all([
			this.prisma.post.findMany({
				where: {
					userId: { in: allIds },
				},
				skip,
				take,
				orderBy: { createdAt: 'desc' },
				include: this.defaultPostInclude,
			}),
			this.prisma.post.count({
				where: { userId: { in: allIds } },
			}),
		]);

		return {
			data: posts,
			total,
			page,
			lastPage: Math.ceil(total / take),
		};
	}
}
