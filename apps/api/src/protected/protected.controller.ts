import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('api/protected')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProtectedController {
  @Get('example')
  @RequirePermissions('user.read')
  getExample() {
    return { ok: true };
  }
}
