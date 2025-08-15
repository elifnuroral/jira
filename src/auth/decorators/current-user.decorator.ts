// src/auth/decorators/current-user.decorator.ts
import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role } from 'src/user/enums/role.enum';

export type AuthUser = { id: number; role: Role; name?: string };
type JwtUser = { userId: number; role: Role; name?: string };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: JwtUser }>();
    if (!req.user) throw new UnauthorizedException();
    return { id: req.user.userId, role: req.user.role, name: req.user.name };
  },
);
