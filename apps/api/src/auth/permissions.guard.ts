import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { REQUIRE_PERMISSIONS_KEY } from './permissions.decorator';

type AuthenticatedRequest = Request & { user?: { sub: string } };

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user?.sub) {
      throw new UnauthorizedException();
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { user_id: user.sub },
      include: {
        role: {
          include: {
            role_permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const permissionKeys = new Set<string>();
    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.role_permissions) {
        permissionKeys.add(rolePermission.permission.key);
      }
    }

    const hasPermission = requiredPermissions.some((permission) =>
      permissionKeys.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException();
    }

    return true;
  }
}
