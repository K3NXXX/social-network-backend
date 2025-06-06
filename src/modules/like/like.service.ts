import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';
import { CommentService } from '../comment/comment.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationsGateway } from '../notification/notifications.gateway';
import { PostService } from '../post/post.service';

@Injectable()
export class LikeService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly post: PostService,
		@Inject(forwardRef(() => CommentService))
		private readonly comment: CommentService,
		private readonly notification: NotificationService,
		private readonly notificationsGateway: NotificationsGateway,
	) {}

	async togglePostLike(postId: string, userId: string) {
		const post = await this.post.findOne(postId);
		if (!post) throw new Error('Post not found');

		const liked = await this.hasLikedPost(userId, postId);

		if (liked) {
			await this.prisma.like.delete({
				where: { userId_postId: { userId, postId } },
			});
			return { liked: false };
		}

		const like = await this.prisma.like.create({
			data: {
				postId,
				userId,
			},
		});

		if (post.user.id !== userId) {
			const sender = await this.prisma.user.findUnique({
				where: { id: userId },
				select: { username: true, firstName: true, lastName: true },
			});

			const username = sender?.username
				? sender.username
				: ((sender?.firstName ?? '') + ' ' + (sender?.lastName ?? '')).trim() ||
					'Someone';

			await this.notification.create({
				type: NotificationType.LIKE,
				message: `${username} liked your post`,
				userId: post.user.id,
				senderId: userId,
				postId,
				likeId: like.id,
			});

			this.notificationsGateway.sendNotification(post.user.id, {
				type: NotificationType.LIKE,
				message: `${username} liked your post`,
				postId,
				senderId: userId,
			});
		}

		return { liked: true };
	}

	async toggleCommentLike(commentId: string, userId: string) {
		const comment = await this.comment.findOne(commentId, userId);
		if (!comment) throw new Error('Comment not found');

		const liked = await this.hasLikedComment(userId, commentId);

		if (liked) {
			await this.prisma.like.delete({
				where: { userId_commentId: { userId, commentId } },
			});
			return { liked: false };
		}

		await this.prisma.like.create({
			data: {
				commentId,
				userId,
			},
		});

		return { liked: true };
	}

	async hasLikedPost(userId: string, postId: string): Promise<boolean> {
		const existing = await this.prisma.like.findUnique({
			where: {
				userId_postId: { userId, postId },
			},
			select: { id: true },
		});
		return !!existing;
	}

	async hasLikedComment(userId: string, commentId: string): Promise<boolean> {
		const existing = await this.prisma.like.findUnique({
			where: {
				userId_commentId: { userId, commentId },
			},
			select: { id: true },
		});
		return !!existing;
	}
}
