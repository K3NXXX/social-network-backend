import {
	BadRequestException,
	ForbiddenException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { LikeService } from '../like/like.service';

@Injectable()
export class PostService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly cloudinaryService: CloudinaryService,
		@Inject(forwardRef(() => LikeService))
		private readonly likeService: LikeService,
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
		removePhoto?: boolean,
	) {
		const post = await this.prisma.post.findUnique({ where: { id } });

		if (!post) throw new NotFoundException('Post not found');
		if (post.userId !== userId)
			throw new ForbiddenException('You cannot update this post');

		const wantsToRemovePhoto = !!removePhoto;
		const newContent = dto.content?.trim();
		const content =
			dto.content !== undefined ? newContent || null : post.content;

		let photo = post.photo;
		let photoPublicId = post.photoPublicId;

		if (wantsToRemovePhoto && post.photoPublicId) {
			try {
				await this.cloudinaryService.deleteFile(post.photoPublicId);
				photo = null;
				photoPublicId = null;
			} catch (error) {
				console.error('Failed to delete old image:', error);
				throw new BadRequestException('Failed to delete image');
			}
		}

		if (file) {
			if (post.photoPublicId) {
				try {
					await this.cloudinaryService.deleteFile(post.photoPublicId);
				} catch (error) {
					console.warn('Could not delete old image before upload');
				}
			}

			try {
				const uploadResult = await this.cloudinaryService.uploadFile(file);
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
			select: this.defaultPost,
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

	async getAll(userId: string, page: number, take: number) {
		const skip = (page - 1) * take;

		const [posts, total] = await Promise.all([
			this.prisma.post.findMany({
				where: {
					privacy: 'PUBLIC',
				},
				skip,
				take,
				orderBy: [{ createdAt: 'desc' }],
				select: this.defaultPost,
			}),
			this.prisma.post.count({
				where: {
					privacy: 'PUBLIC',
				},
			}),
		]);

		if (userId) {
			const postsWithLike = await Promise.all(
				posts.map(async post => {
					const likedByUser = await this.likeService.hasLikedPost(
						userId,
						post.id,
					);
					return { ...post, liked: likedByUser };
				}),
			);

			return {
				data: postsWithLike,
				total,
				page,
				take,
				totalPages: Math.ceil(total / take),
			};
		}

		return {
			data: posts,
			total,
			page,
			lastPage: Math.ceil(total / take),
		};
	}

	async getFeed(userId: string, page: number, take: number) {
		const skip = (page - 1) * take;

		const following = await this.prisma.follow.findMany({
			where: { followerId: userId },
			select: { followingId: true },
		});
		const followingIds = [
			...new Set([...following.map(f => f.followingId), userId]),
		];

		const [posts, total] = await Promise.all([
			this.prisma.post.findMany({
				where: {
					userId: { in: followingIds },
					privacy: 'PUBLIC',
				},
				skip,
				take,
				orderBy: { createdAt: 'desc' },
				select: this.defaultPost,
			}),
			this.prisma.post.count({
				where: {
					userId: { in: followingIds },
					privacy: 'PUBLIC',
				},
			}),
		]);

		if (userId) {
			const postsWithLike = await Promise.all(
				posts.map(async post => {
					const likedByUser = await this.likeService.hasLikedPost(
						userId,
						post.id,
					);
					return { ...post, liked: likedByUser };
				}),
			);

			return {
				data: postsWithLike,
				total,
				page,
				take,
				totalPages: Math.ceil(total / take),
			};
		}

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
		const excludedIds = [
			...new Set([...following.map(f => f.followingId), userId]),
		];

		const [posts, total] = await Promise.all([
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
				select: this.defaultPost,
			}),
			this.prisma.post.count({
				where: {
					userId: { notIn: excludedIds },
					privacy: 'PUBLIC',
				},
			}),
		]);

		if (userId) {
			const postsWithLike = await Promise.all(
				posts.map(async post => {
					const likedByUser = await this.likeService.hasLikedPost(
						userId,
						post.id,
					);
					return { ...post, liked: likedByUser };
				}),
			);

			return {
				data: postsWithLike,
				total,
				page,
				take,
				totalPages: Math.ceil(total / take),
			};
		}

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
				select: this.defaultPost,
			}),
			this.prisma.post.count({ where: { userId } }),
		]);

		if (userId) {
			const postsWithLike = await Promise.all(
				posts.map(async post => {
					const likedByUser = await this.likeService.hasLikedPost(
						userId,
						post.id,
					);
					return { ...post, liked: likedByUser };
				}),
			);

			return {
				data: postsWithLike,
				total,
				page,
				take,
				totalPages: Math.ceil(total / take),
			};
		}

		return {
			data: posts,
			total,
			page,
			lastPage: Math.ceil(total / take),
		};
	}

	async findOne(id: string, userId?: string) {
		const post = await this.prisma.post.findUnique({
			where: { id },
			select: {
				...this.defaultPost,
				likes: {
					where: { userId },
					select: { id: true },
				},
			},
		});

		if (!post) throw new NotFoundException('Post not found');

		const isOwner = post.user.id === userId;
		const isPublic = post.privacy === 'PUBLIC';

		if (!isPublic && !isOwner)
			throw new ForbiddenException('You are not allowed to view this post');

		if (userId) {
			const likedByUser = await this.likeService.hasLikedPost(userId, id);
			return { ...post, liked: likedByUser };
		}

		return post;
	}

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
}
