import { UseGuards } from '@nestjs/common';
import { BlockedUsersGuard } from '../guards/block.guard';

export const CheckBlocked = () => {
  return UseGuards(BlockedUsersGuard);
};
