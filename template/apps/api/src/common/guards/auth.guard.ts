import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { AuthService } from '../../auth/auth.service.js';
import { UsersService } from '../../users/users.service.js';

const COOKIE_ACCESS_TOKEN = 'access_token';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();

    const accessToken = this.extractToken(request);

    if (isPublic) {
      if (accessToken) {
        await this.tryAttachUser(request, accessToken);
      }
      return true;
    }

    if (!accessToken) {
      throw new UnauthorizedException();
    }

    const attached = await this.tryAttachUser(request, accessToken);
    if (!attached) {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const cookieToken = request.cookies?.[COOKIE_ACCESS_TOKEN];
    if (cookieToken) return cookieToken;

    const authorization = request.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      return authorization.slice(7).trim();
    }

    return undefined;
  }

  private async tryAttachUser(request: Request, accessToken: string): Promise<boolean> {
    const token = await this.authService.validateAccessToken(accessToken);
    if (!token) return false;

    const user = await this.usersService.findById(token.userId);
    if (!user) return false;

    this.usersService.updateLastRequest(user._id.toString());
    (request as any).user = user;
    (request as any).accessToken = accessToken;

    return true;
  }
}
