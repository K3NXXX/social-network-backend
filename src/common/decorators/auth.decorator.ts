import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../guards/jwt.guard';

export const Authorization = () => {
  return applyDecorators(UseGuards(JwtGuard));
};
