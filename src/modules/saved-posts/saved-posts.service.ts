import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PostService } from '../post/post.service';

@Injectable()
export class SavedPostsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly postService: PostService,
	) {}

	async save(userId: string, postId: string) {
		await this.postService.getOne(postId);

		const alreadySaved = await this.prisma.savedPost.findUnique({
			where: { userId_postId: { userId, postId } },
		});

		if (alreadySaved) throw new ConflictException('Post is already saved');

		return this.prisma.savedPost.create({
			data: { userId, postId },
		});
	}

	async unsave(userId: string, postId: string) {
		const post = await this.prisma.savedPost.findUnique({
			where: { userId_postId: { userId, postId } },
		});

		if (!post) throw new NotFoundException('Post is not saved');

		return this.prisma.savedPost.delete({
			where: { userId_postId: { userId, postId } },
		});
	}

	async getOne(userId: string, postId: string) {
		await this.postService.getOne(postId);

		const post = await this.prisma.savedPost.findUnique({
			where: { userId_postId: { userId, postId } },
		});

		if (!post) throw new NotFoundException('Post is not saved');

		return post;
	}

	async getSavedPosts(userId: string, page: number, take: number) {
		const skip = (page - 1) * take;

		const [data, total] = await Promise.all([
			this.prisma.post.findMany({
				where: { userId },
				skip,
				take,
				orderBy: { createdAt: 'desc' },
				select: {
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
					likes: {
						where: { userId },
						select: { id: true },
					},
					savedBy: {
						where: { userId },
						select: { id: true },
					},
				},
			}),
			this.prisma.post.count({ where: { userId } }),
		]);

		const posts = data.map(({ likes, savedBy, ...rest }) => ({
			...rest,
			liked: !!likes.length,
			saved: !!savedBy.length,
		}));

		return {
			data: posts,
			total,
			page,
			take,
			totalPages: Math.ceil(total / take),
		};
	}

	async isPostSaved(userId: string, postId: string): Promise<boolean> {
		const saved = await this.prisma.savedPost.findUnique({
			where: { userId_postId: { userId, postId } },
			select: { id: true },
		});
		return !!saved;
	}
}
