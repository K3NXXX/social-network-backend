import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { BlockUserService } from '../../modules/block-user/block-user.service';

@Injectable()
export class CheckBlockedGuard implements CanActivate {
  constructor(private readonly blockedUserService: BlockUserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currentUser = request.user;
    const blockedId = request.params.id;

    if (!currentUser) return true;

    const isBlocked = await this.blockedUserService.isBlocked(
      blockedId,
      currentUser.id,
    );

    if (isBlocked)
      throw new ForbiddenException('You have been blocked by this user');

    return true;
  }
}
