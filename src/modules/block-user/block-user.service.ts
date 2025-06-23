import {
	ConflictException,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class BlockUserService {
	constructor(private prisma: PrismaService) {}

	async block(blockerId: string, blockedId: string) {
		if (blockerId === blockedId)
			throw new ForbiddenException("You can't block yourself");

		if (await this.isBlocked(blockerId, blockedId))
			throw new ConflictException('User is already blocked');

		return this.prisma.blockedUser.create({
			data: {
				blockerId,
				blockedId,
			},
		});
	}

	async unblock(blockerId: string, blockedId: string) {
		if (!(await this.isBlocked(blockerId, blockedId)))
			throw new ConflictException('User is not blocked');

		return this.prisma.blockedUser.delete({
			where: {
				blockerId_blockedId: {
					blockerId,
					blockedId,
				},
			},
		});
	}

	async isBlocked(viewerId: string, targetUserId: string): Promise<boolean> {
		const block = await this.prisma.blockedUser.findUnique({
			where: {
				blockerId_blockedId: {
					blockerId: viewerId,
					blockedId: targetUserId,
				},
			},
		});

		return !!block;
	}

	async getBlockedUsers(userId: string) {
		return this.prisma.blockedUser.findMany({
			where: { blockerId: userId },
			select: {
				blocked: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						username: true,
						avatarUrl: true,
					},
				},
			},
		});
	}

	async getVisibleUserIds(viewerId: string): Promise<string[]> {
		const users = await this.prisma.$queryRaw<{ id: string }[]>`
		SELECT id FROM "users"
		WHERE id NOT IN (SELECT "blockedId" FROM "blocked_users" WHERE "blockerId" = ${Prisma.sql`${viewerId}`})
		AND id NOT IN (SELECT "blockerId" FROM "blocked_users" WHERE "blockedId" = ${Prisma.sql`${viewerId}`})
	`;
		return users.map(u => u.id);
	}
}
