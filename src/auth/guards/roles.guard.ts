// src/auth/guards/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { Request } from 'express';
import { Role } from 'src/user/enums/role.enum';

// Bu request, JwtStrategy.validate'in döndürdüğü user şekline göre tiplenir.
//type AuthUser = { userId: number; email: string; role: Role };
type AuthUser = { userId: number; name: string; role: Role };

type AuthenticatedRequest = Request & { user?: AuthUser };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // @Roles eklenmemişse (rol gerekmiyorsa), sadece JWT yeterlidir → izin ver.
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // 🔧 Burada getRequest'e tip veriyoruz → any değil
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user; // user tipi artık net: AuthUser | undefined

    // Kullanıcı yoksa veya rol eşleşmiyorsa engelle
    return !!user && requiredRoles.includes(user.role);
  }
}
