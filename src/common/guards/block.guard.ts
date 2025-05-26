import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { BlockUserService } from '../../modules/block-user/block-user.service';
import { User } from '@prisma/client';

@Injectable()
export class BlockedUsersGuard implements CanActivate {
  constructor(private readonly blockedUserService: BlockUserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currentUser: User = request.user;
    const targetUserId = request.params.id || request.body.userId;

    if (!currentUser || !targetUserId || currentUser.id === targetUserId)
      return true;

    const isBlocked = await this.blockedUserService.isBlocked(
      currentUser.id,
      targetUserId,
    );
    if (isBlocked) throw new ForbiddenException('Blocked user interaction');

    return true;
  }
}
