import { applyDecorators, UseGuards } from '@nestjs/common';
import { CheckBlockedGuard } from '../guards/block.guard';

export function CheckBlocked() {
  return applyDecorators(UseGuards(CheckBlockedGuard));
}
