import { Injectable, Logger } from '@nestjs/common';
import {
  ArcticFetchError,
  decodeIdToken,
  generateCodeVerifier,
  generateState,
  Google,
  OAuth2RequestError,
  OAuth2Tokens,
} from 'arctic';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { User } from 'shared';
import { z } from 'zod';

import { ConfigService } from '../config/config.service';

const googleUserInfoSchema = z.object({
  sub: z.string().describe('Unique Google user ID'),
  email: z.email().describe('User email'),
  email_verified: z.boolean().describe('Email verification status'),
  name: z.string().describe('User full name'),
  picture: z.url().describe('Profile picture URL').optional(),
  given_name: z.string().describe('First name'),
  family_name: z.string().describe('Last name'),
});

const googleCallbackParamsSchema = z
  .object({
    code: z.string(),
    state: z.string(),
    storedState: z.string(),
    codeVerifier: z.string(),
  })
  .refine((data) => data.state === data.storedState, { error: 'OAuth state mismatch' });

interface GoogleUserData {
  googleUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  isEmailVerified: boolean;
  avatarUrl?: string;
}

@Injectable()
export class GoogleService {
  private readonly logger = new Logger(GoogleService.name);
  private googleClient?: Google;

  constructor(
    private readonly config: ConfigService,
    @InjectModel('User') private readonly userModel: Model<User>,
  ) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET');

    if (clientId && clientSecret) {
      this.googleClient = new Google(
        clientId,
        clientSecret,
        `${this.config.get('API_URL')}/account/sign-in/google/callback`,
      );
    }
  }

  createAuthUrl() {
    if (!this.googleClient) {
      throw new Error('Google OAuth credentials are not setup');
    }

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const authorizationUrl = this.googleClient.createAuthorizationURL(state, codeVerifier, [
      'openid',
      'profile',
      'email',
    ]);

    return {
      state,
      codeVerifier,
      authorizationUrl: authorizationUrl.toString(),
    };
  }

  async validateCallback(params: {
    code: string | undefined;
    state: string | undefined;
    storedState: string | undefined;
    codeVerifier: string | undefined;
  }): Promise<User | null> {
    if (!this.googleClient) {
      throw new Error('Google OAuth credentials are not setup');
    }

    const parsedParams = googleCallbackParamsSchema.safeParse(params);

    if (!parsedParams.success) {
      const errorMessage = 'Failed to validate Google authentication data.';
      this.logger.error(`[Google OAuth] ${errorMessage}`);
      this.logger.error(z.treeifyError(parsedParams.error).errors);
      throw new Error(errorMessage);
    }

    const { code, codeVerifier } = parsedParams.data;

    let tokens: OAuth2Tokens;

    try {
      tokens = await this.googleClient.validateAuthorizationCode(code, codeVerifier);
    } catch (e) {
      let errorMessage = 'An error occurred during Google authentication';

      if (e instanceof OAuth2RequestError) {
        const { code: errorCode, description } = e;
        errorMessage = `Google authentication failed: ${description || errorCode}`;
      } else if (e instanceof ArcticFetchError) {
        errorMessage = 'Failed to connect to Google authentication service';
      }

      this.logger.error(`[Google OAuth] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const claims = decodeIdToken(tokens.idToken());
    return this.processGoogleClaims(claims, 'Google OAuth');
  }

  async validateIdToken(idToken: string): Promise<User | null> {
    try {
      const claims = decodeIdToken(idToken);
      return this.processGoogleClaims(claims, 'Google OAuth Mobile');
    } catch (error) {
      this.logger.error(`[Google OAuth Mobile] ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async processGoogleClaims(claims: object, context: string): Promise<User | null> {
    const parsedUserInfo = googleUserInfoSchema.safeParse(claims);

    if (!parsedUserInfo.success) {
      const errorMessage = 'Failed to validate Google user info';
      this.logger.error(`[${context}] ${errorMessage}`);
      this.logger.error(z.treeifyError(parsedUserInfo.error).errors);
      throw new Error(errorMessage);
    }

    const {
      sub: googleUserId,
      email,
      email_verified: isEmailVerified,
      picture: avatarUrl,
      given_name: firstName,
      family_name: lastName,
    } = parsedUserInfo.data;

    if (!isEmailVerified) {
      throw new Error('Google account is not verified');
    }

    const existingUser = await this.findByGoogleUserId(googleUserId);
    if (existingUser) return existingUser;

    const existingUserByEmail = await this.findByEmailAndLinkGoogle(email, googleUserId);
    if (existingUserByEmail) return existingUserByEmail;

    return this.createNewUser({ firstName, lastName, email, isEmailVerified, avatarUrl, googleUserId });
  }

  private async findByGoogleUserId(userId: string): Promise<User | null> {
    const user = await this.userModel.findOne({ 'oauth.google.userId': userId }).lean().exec();

    if (user) {
      await this.userModel.updateOne({ _id: user._id }, { $set: { lastRequest: new Date() } });
    }

    return user as User | null;
  }

  private async findByEmailAndLinkGoogle(email: string, googleUserId: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email }).lean().exec();

    if (user) {
      await this.userModel.updateOne(
        { _id: user._id },
        {
          $set: {
            'oauth.google': { userId: googleUserId, connectedOn: new Date() },
            lastRequest: new Date(),
          },
        },
      );
    }

    return user as User | null;
  }

  private async createNewUser(userData: GoogleUserData): Promise<User | null> {
    const { firstName, lastName, email, isEmailVerified, avatarUrl, googleUserId } = userData;

    const doc = await this.userModel.create({
      firstName,
      lastName,
      email,
      isEmailVerified,
      avatarUrl,
      oauth: { google: { userId: googleUserId, connectedOn: new Date() } },
    });

    return doc.toObject() as User;
  }
}
