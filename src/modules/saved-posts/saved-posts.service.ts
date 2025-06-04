import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { PostService } from '../post/post.service';

@Injectable()
export class SavedPostsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly postService: PostService,
	) {}

	async findOne(userId: string, postId: string) {
		await this.postService.findOne(postId);

		const post = await this.prisma.savedPost.findUnique({
			where: { userId_postId: { userId, postId } },
		});

		if (!post) throw new NotFoundException('');

		return post;
	}

	async savePost(userId: string, postId: string) {
		await this.findOne(userId, postId);

		return this.prisma.savedPost.create({
			data: { userId, postId },
		});
	}

	async unsavePost(userId: string, postId: string) {
		await this.findOne(userId, postId);

		return this.prisma.savedPost.delete({
			where: { userId_postId: { userId, postId } },
		});
	}

	async getSavedPosts(userId: string) {
		return this.prisma.savedPost.findMany({
			where: { userId },
			select: {
				id: true,
				post: {
					select: {
						id: true,
						content: true,
						photo: true,
						privacy: true,
						createdAt: true,
						_count: {
							select: {
								likes: true,
								comments: true,
							},
						},
					},
				},
				user: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						username: true,
						avatarUrl: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});
	}

	async isPostSaved(userId: string, postId: string) {
		const saved = await this.prisma.savedPost.findUnique({
			where: { userId_postId: { userId, postId } },
		});
		return !!saved;
	}
}
