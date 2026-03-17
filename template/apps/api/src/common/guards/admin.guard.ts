import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import { AppConfigService } from '../../config/config.service.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private configService: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const adminKey = request.headers['x-admin-key'] as string | undefined;

    if (!this.configService.config.ADMIN_KEY || adminKey !== this.configService.config.ADMIN_KEY) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
