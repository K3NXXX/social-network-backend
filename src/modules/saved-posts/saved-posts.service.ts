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

	async getSavedPosts(userId: string, page: number, take: number) {
		const skip = (page - 1) * take;

		const savedPosts = await this.prisma.savedPost.findMany({
			where: { userId },
			skip,
			take,
			orderBy: { createdAt: 'desc' },
			select: {
				post: {
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
				},
			},
		});

		const posts = savedPosts.map(({ post }) => ({
			...post,
			liked: !!post.likes.length,
			saved: !!post.savedBy.length,
		}));

		return {
			data: posts,
			page,
			take,
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
