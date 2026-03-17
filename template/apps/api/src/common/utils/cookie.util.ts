import _ from 'lodash';
import { getPublicSuffix, parse } from 'tldts';
import { COOKIES } from 'app-constants';
import { Response } from 'express';

/**
 * Determines a valid cookie domain.
 * Returns undefined for localhost or invalid domains.
 */
export const getCookieDomain = (hostname: string): string | undefined => {
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return undefined;
  }

  const { domain, subdomain } = parse(hostname);

  if (!domain) {
    console.warn(`Cannot determine cookie domain from "${hostname}".`);
    return undefined;
  }

  const cookieSubdomain = _.tail(subdomain?.split('.')).join('.');
  const cookieDomain = cookieSubdomain ? `${cookieSubdomain}.${domain}` : domain;

  const publicSuffix = getPublicSuffix(cookieDomain, { allowPrivateDomains: true });

  if (!publicSuffix || cookieDomain === publicSuffix) {
    console.warn(`"${cookieDomain}" is a public suffix. Cookie won't be set.`);
    return undefined;
  }

  return cookieDomain;
};

interface SetTokensOptions {
  res: Response;
  accessToken: string;
  expiresIn: number;
  webUrl: string;
  secure?: boolean;
}

export const setTokens = ({ res, accessToken, expiresIn, webUrl, secure = true }: SetTokensOptions) => {
  const hostname = new URL(webUrl).hostname;
  const domain = getCookieDomain(hostname);

  res.cookie(COOKIES.ACCESS_TOKEN, accessToken, {
    domain,
    httpOnly: true,
    sameSite: 'lax',
    secure,
    expires: new Date(Date.now() + expiresIn * 1000),
  });
};

interface UnsetTokensOptions {
  res: Response;
  webUrl: string;
  secure?: boolean;
}

export const unsetTokens = ({ res, webUrl, secure = true }: UnsetTokensOptions) => {
  const hostname = new URL(webUrl).hostname;
  const domain = getCookieDomain(hostname);

  res.clearCookie(COOKIES.ACCESS_TOKEN, {
    domain,
    httpOnly: true,
    sameSite: 'lax',
    secure,
  });
};
