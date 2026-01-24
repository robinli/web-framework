import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.is_active) {
      throw new UnauthorizedException();
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException();
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return { accessToken };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: {
            role: {
              include: {
                role_permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException();
    }

    const roleCodes = new Set<string>();
    const permissionKeys = new Set<string>();

    for (const userRole of user.user_roles) {
      roleCodes.add(userRole.role.code);
      for (const rolePermission of userRole.role.role_permissions) {
        permissionKeys.add(rolePermission.permission.key);
      }
    }

    return {
      id: user.id,
      email: user.email,
      roles: Array.from(roleCodes),
      permissions: Array.from(permissionKeys),
    };
  }
}
