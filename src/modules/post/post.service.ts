import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { FollowService } from '../follow/follow.service';

@Injectable()
export class PostService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly cloudinaryService: CloudinaryService,
		private readonly followService: FollowService,
	) {}

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
				content: hasContent || null,
				photo,
				photoPublicId,
				userId,
				privacy: dto.privacy ?? 'PUBLIC',
			},
			select: this.defaultPost,
		});

		return post;
	}

	async update(
		id: string,
		userId: string,
		dto: UpdatePostDto,
		file?: Express.Multer.File,
	) {
		const post = await this.prisma.post.findUnique({ where: { id } });

		if (!post) throw new NotFoundException('Post not found');
		if (post.userId !== userId)
			throw new ForbiddenException('You cannot update this post');

		const content = dto.content?.trim() ?? post.content;

		let photo = post.photo;
		let photoPublicId = post.photoPublicId;

		if (file) {
			try {
				const uploadResult = await this.cloudinaryService.uploadFile(file);

				if (post.photoPublicId)
					this.cloudinaryService.deleteFile(post.photoPublicId).catch(() => {
						console.warn('Could not delete old image after upload');
					});

				photo = uploadResult.secure_url;
				photoPublicId = uploadResult.public_id;
			} catch (error) {
				throw new BadRequestException('Failed to upload image');
			}
		}

		if (!content && !photo)
			throw new BadRequestException(
				'Post must contain at least content or image',
			);

		const updated = await this.prisma.post.update({
			where: { id },
			data: {
				content,
				photo,
				photoPublicId,
				privacy: dto.privacy ?? post.privacy,
			},
			select: this.select(userId),
		});

		const { likes, savedBy, ...rest } = updated;

		return {
			...rest,
			liked: !!likes,
			saved: !!savedBy,
		};
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

	async getAll(userId: string, page: number, take: number) {
		const skip = (page - 1) * take;

		const [data, total] = await Promise.all([
			this.prisma.post.findMany({
				where: { privacy: 'PUBLIC' },
				skip,
				take,
				orderBy: [{ createdAt: 'desc' }],
				select: this.select(userId),
			}),
			this.prisma.post.count({
				where: { privacy: 'PUBLIC' },
			}),
		]);

		return {
			data: this.formatPosts(data),
			total,
			page,
			totalPages: Math.ceil(total / take),
		};
	}

	async getOne(id: string, userId?: string) {
		const post = await this.prisma.post.findUnique({
			where: { id },
			select: this.select(userId),
		});

		if (!post) throw new NotFoundException('Post not found');

		const isOwner = post.user.id === userId;
		const isPublic = post.privacy === 'PUBLIC';

		if (!isPublic && !isOwner)
			throw new ForbiddenException('You are not allowed to view this post');

		const { likes, savedBy, ...rest } = post;

		return {
			...rest,
			liked: !!likes,
			saved: !!savedBy,
		};
	}

	async getFeed(userId: string, page: number, take: number) {
		const skip = (page - 1) * take;

		const followingIds = await this.followService.getFollowingIds(userId);

		const [data, total] = await Promise.all([
			this.prisma.post.findMany({
				where: {
					userId: { in: [...followingIds, userId] },
					privacy: 'PUBLIC',
				},
				skip,
				take,
				orderBy: { createdAt: 'desc' },
				select: this.select(userId),
			}),
			this.prisma.post.count({
				where: {
					userId: { in: [...followingIds, userId] },
					privacy: 'PUBLIC',
				},
			}),
		]);

		return {
			data: this.formatPosts(data),
			total,
			page,
			totalPages: Math.ceil(total / take),
		};
	}

	async getDiscover(userId: string, page: number, take: number) {
		const skip = (page - 1) * take;

		const excludedIds = await this.followService.getFollowingIds(userId);
		excludedIds.push(userId);

		const [data, total] = await Promise.all([
			this.prisma.post.findMany({
				where: {
					userId: { notIn: excludedIds },
					privacy: 'PUBLIC',
				},
				skip,
				take,
				orderBy: [
					{ likes: { _count: 'desc' } },
					{ comments: { _count: 'desc' } },
					{ createdAt: 'desc' },
				],
				select: this.select(userId),
			}),
			this.prisma.post.count({
				where: {
					userId: { notIn: excludedIds },
					privacy: 'PUBLIC',
				},
			}),
		]);

		return {
			data: this.formatPosts(data),
			total,
			page,
			totalPages: Math.ceil(total / take),
		};
	}

	async getUserPosts(userId: string, page: number, take: number) {
		const skip = (page - 1) * take;

		const [data, total] = await Promise.all([
			this.prisma.post.findMany({
				where: {
					userId,
					privacy: 'PUBLIC',
				},
				skip,
				take,
				orderBy: { createdAt: 'desc' },
				select: this.select(userId),
			}),
			this.prisma.post.count({
				where: {
					userId,
					privacy: 'PUBLIC',
				},
			}),
		]);

		return {
			data: this.formatPosts(data),
			total,
			page,
			take,
			totalPages: Math.ceil(total / take),
		};
	}

	private select = (userId?: string) => ({
		...this.defaultPost,
		likes: {
			where: { userId },
			select: { id: true },
		},
		savedBy: {
			where: { userId },
			select: { id: true },
		},
	});

	private readonly defaultPost = {
		id: true,
		content: true,
		photo: true,
		privacy: true,
		createdAt: true,
		updatedAt: true,
		user: {
			select: {
				id: true,
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

	private formatPosts(posts: any[]) {
		return posts.map(({ likes, savedBy, ...rest }) => ({
			...rest,
			liked: !!likes.length,
			saved: !!savedBy.length,
		}));
	}
}
