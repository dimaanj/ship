import { COOKIES } from 'app-constants';
import { Request } from 'express';

export enum ClientType {
  WEB = 'web',
  MOBILE = 'mobile',
}

export const detectClientType = (req: Request): ClientType => {
  const hasCookieToken = !!req.cookies?.[COOKIES.ACCESS_TOKEN];
  const hasBearerToken = !!req.headers.authorization?.startsWith('Bearer ');
  const clientTypeHeader = req.headers['x-client-type']?.toString().toLowerCase();
  const userAgent = req.headers['user-agent']?.toString().toLowerCase() || '';

  if (hasCookieToken) {
    return ClientType.WEB;
  }

  if (hasBearerToken && !hasCookieToken) {
    return ClientType.MOBILE;
  }

  if (clientTypeHeader === 'mobile') {
    return ClientType.MOBILE;
  }

  const isMobileUserAgent = userAgent.includes('flutter') || userAgent.includes('dart') || userAgent.includes('mobile');

  if (isMobileUserAgent && !hasCookieToken) {
    return ClientType.MOBILE;
  }

  return ClientType.WEB;
};
