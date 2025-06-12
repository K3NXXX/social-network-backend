import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { BlockUserService } from '../../modules/block-user/block-user.service';
import { Reflector } from '@nestjs/core';
import { IS_BLOCKED_META_KEY } from '../decorators/check-blocked.decorator';

@Injectable()
export class CheckBlockedGuard implements CanActivate {
	constructor(
		private readonly blockUserService: BlockUserService,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const target = this.reflector.get<string>(
			IS_BLOCKED_META_KEY,
			context.getHandler(),
		);

		if (!target) return true;

		const request = context.switchToHttp().getRequest();
		const viewerId = request.user?.id;
		const targetUserId = request.params[target];

		if (!viewerId || !targetUserId) return true;

		const isBlocked = await this.blockUserService.isBlocked(
			targetUserId,
			viewerId,
		);
		if (isBlocked)
			throw new ForbiddenException('You are blocked by this user.');

		return true;
	}
}
