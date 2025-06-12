import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { CheckBlockedGuard } from '../guards/block.guard';
import { JwtGuard } from '../guards/jwt.guard';

export const IS_BLOCKED_META_KEY = 'isBlocked';

export const CheckBlocked = (id: string) =>
	applyDecorators(
		SetMetadata(IS_BLOCKED_META_KEY, id),
		UseGuards(JwtGuard, CheckBlockedGuard),
	);
