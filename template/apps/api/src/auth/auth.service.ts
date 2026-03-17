import { Injectable } from '@nestjs/common';
import { URL } from 'node:url';
import _ from 'lodash';
import { parse, getPublicSuffix } from 'tldts';
import type { Request, Response } from 'express';

import { AppConfigService } from '../config/config.service.js';
import { TokensService } from '../tokens/tokens.service.js';
import { TokenType, TokenDocument } from '../tokens/tokens.schema.js';
import { UsersService } from '../users/users.service.js';

const COOKIE_ACCESS_TOKEN = 'access_token';

const ACCESS_TOKEN = {
  ABSOLUTE_EXPIRATION_SECONDS: 60 * 60 * 24 * 30,
  INACTIVITY_TIMEOUT_SECONDS: 60 * 60 * 24 * 10,
  ACTIVITY_CHECK_INTERVAL_SECONDS: 60 * 60 * 24,
};

export enum ClientType {
  WEB = 'web',
  MOBILE = 'mobile',
}

@Injectable()
export class AuthService {
  private cookieDomain: string | undefined;

  constructor(
    private configService: AppConfigService,
    private tokensService: TokensService,
    private usersService: UsersService,
  ) {
    const webUrl = new URL(this.configService.config.WEB_URL);
    this.cookieDomain = this.getCookieDomain(webUrl.hostname);
  }

  detectClientType(req: Request): ClientType {
    const hasCookieToken = !!req.cookies?.[COOKIE_ACCESS_TOKEN];
    const hasBearerToken = !!req.headers.authorization?.startsWith('Bearer ');
    const clientTypeHeader = (req.headers['x-client-type'] as string)?.toLowerCase();
    const userAgent = (req.headers['user-agent'] || '').toLowerCase();

    if (hasCookieToken) return ClientType.WEB;
    if (hasBearerToken && !hasCookieToken) return ClientType.MOBILE;
    if (clientTypeHeader === 'mobile') return ClientType.MOBILE;

    const isMobileUserAgent =
      userAgent.includes('flutter') || userAgent.includes('dart') || userAgent.includes('mobile');
    if (isMobileUserAgent && !hasCookieToken) return ClientType.MOBILE;

    return ClientType.WEB;
  }

  async setAccessToken(req: Request, res: Response, userId: string): Promise<string> {
    const clientType = this.detectClientType(req);

    const accessToken = await this.tokensService.createToken({
      userId,
      type: TokenType.ACCESS,
      expiresIn: ACCESS_TOKEN.INACTIVITY_TIMEOUT_SECONDS,
    });

    if (clientType === ClientType.MOBILE) {
      this.usersService.updateLastRequest(userId);
      return accessToken;
    }

    this.setTokenCookie(res, accessToken, ACCESS_TOKEN.ABSOLUTE_EXPIRATION_SECONDS, req.secure);
    this.usersService.updateLastRequest(userId);

    return accessToken;
  }

  async unsetUserAccessToken(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;

    if (user) {
      await this.tokensService.invalidateUserTokens(user._id.toString(), TokenType.ACCESS);
    }

    this.clearTokenCookie(res, req.secure);
  }

  async validateAccessToken(value?: string | null): Promise<TokenDocument | null> {
    const token = await this.tokensService.validateToken(value, TokenType.ACCESS);
    if (!token || token.type !== TokenType.ACCESS) return null;

    const now = new Date();
    const threshold =
      ACCESS_TOKEN.INACTIVITY_TIMEOUT_SECONDS * 1000 - ACCESS_TOKEN.ACTIVITY_CHECK_INTERVAL_SECONDS * 1000;

    if (token.expiresOn.getTime() - now.getTime() <= threshold) {
      const newExpiresOn = new Date(now.getTime() + ACCESS_TOKEN.INACTIVITY_TIMEOUT_SECONDS * 1000);
      await this.tokensService.updateTokenExpiry(token._id.toString(), TokenType.ACCESS, newExpiresOn);
      token.expiresOn = newExpiresOn;
    }

    return token;
  }

  setTokenCookie(res: Response, accessToken: string, expiresIn: number, secure: boolean): void {
    res.cookie(COOKIE_ACCESS_TOKEN, accessToken, {
      domain: this.cookieDomain,
      httpOnly: true,
      sameSite: 'lax',
      expires: new Date(Date.now() + expiresIn * 1000),
      secure,
    });
  }

  clearTokenCookie(res: Response, secure: boolean): void {
    res.clearCookie(COOKIE_ACCESS_TOKEN, {
      domain: this.cookieDomain,
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });
  }

  private getCookieDomain(hostname: string): string | undefined {
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      return undefined;
    }

    const { domain, subdomain } = parse(hostname);
    if (!domain) return undefined;

    const cookieSubdomain = _.tail(subdomain?.split('.')).join('.');
    const cookieDomain = cookieSubdomain ? `${cookieSubdomain}.${domain}` : domain;

    const publicSuffix = getPublicSuffix(cookieDomain, { allowPrivateDomains: true });
    if (!publicSuffix || cookieDomain === publicSuffix) return undefined;

    return cookieDomain;
  }
}
