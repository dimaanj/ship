import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import _ from 'lodash';
import { z } from 'zod';

import { Public } from '../common/decorators/public.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { SecurityUtil } from '../common/utils/security.util.js';
import { AppConfigService } from '../config/config.service.js';
import { TokensService } from '../tokens/tokens.service.js';
import { TokenType } from '../tokens/tokens.schema.js';
import { UsersService } from '../users/users.service.js';
import { EmailService } from '../email/email.service.js';
import { GoogleService } from '../google/google.service.js';
import { AuthService, ClientType } from './auth.service.js';
import type { UserDocument } from '../users/users.schema.js';

const EMAIL_VERIFICATION_TOKEN_EXPIRATION = 60 * 60 * 24;
const RESET_PASSWORD_TOKEN_EXPIRATION = 60 * 60 * 3;

const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REGEX: /^(?=.*[a-z])(?=.*\d).+$/i,
};

const emailSchema = z.email().min(1, 'Email is required').toLowerCase().trim().max(255);

const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(PASSWORD_RULES.MIN_LENGTH, `Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters.`)
  .max(PASSWORD_RULES.MAX_LENGTH, `Password must be less than ${PASSWORD_RULES.MAX_LENGTH} characters.`)
  .regex(PASSWORD_RULES.REGEX, `Password must contain at least one letter and one number.`);

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128),
});

const signUpSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(128),
  lastName: z.string().min(1, 'Last name is required').max(128),
  email: emailSchema,
  password: passwordSchema,
});

const forgotPasswordSchema = z.object({ email: emailSchema });

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

const tokenSchema = z.object({ token: z.string().min(1, 'Token is required') });
const resendEmailSchema = z.object({ email: emailSchema });
const googleMobileSchema = z.object({ idToken: z.string().min(1, 'ID token is required') });

const updateProfileSchema = z
  .object({
    firstName: z.string().min(1).max(128),
    lastName: z.string().min(1).max(128),
    password: z.union([passwordSchema, z.literal('')]),
  })
  .partial();

function throwClientError(errors: Record<string, string | boolean>, status = 400): never {
  throw new BadRequestException({ errors });
}

@Controller('account')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private tokensService: TokensService,
    private emailService: EmailService,
    private googleService: GoogleService,
    private configService: AppConfigService,
  ) {}

  @Post('sign-in')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(200)
  async signIn(@Body() rawBody: unknown, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const body = signInSchema.parse(rawBody);
    const { email, password } = body;

    const user = await this.usersService.findOne({ email });

    if (!user || !user.passwordHash) {
      throwClientError({ credentials: 'The email or password you have entered is invalid' });
    }

    const isPasswordMatch = await SecurityUtil.verifyPasswordHash(user.passwordHash!, password);

    if (!isPasswordMatch) {
      throwClientError({ credentials: 'The email or password you have entered is invalid' });
    }

    if (!user.isEmailVerified) {
      const existingToken = await this.tokensService.getUserActiveToken(
        user._id.toString(),
        TokenType.EMAIL_VERIFICATION,
      );

      if (!existingToken) {
        throwClientError({ emailVerificationTokenExpired: true });
      }

      throwClientError({ email: 'Please verify your email to sign in' });
    }

    const accessToken = await this.authService.setAccessToken(req, res, user._id.toString());
    const clientType = this.authService.detectClientType(req);

    if (clientType === ClientType.MOBILE) {
      return { accessToken, user: this.usersService.getPublic(user) };
    }

    return this.usersService.getPublic(user);
  }

  @Post('sign-up')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(200)
  async signUp(@Body() rawBody: unknown, @Req() req: Request) {
    const body = signUpSchema.parse(rawBody);
    const { firstName, lastName, email, password } = body;

    const isUserExists = await this.usersService.exists({ email });
    if (isUserExists) {
      throwClientError({ email: 'User with this email is already registered' });
    }

    const user = await this.usersService.create({
      email,
      firstName,
      lastName,
      passwordHash: await SecurityUtil.hashPassword(password),
      isEmailVerified: false,
    });

    const emailVerificationToken = await this.tokensService.createToken({
      userId: user._id.toString(),
      type: TokenType.EMAIL_VERIFICATION,
      expiresIn: EMAIL_VERIFICATION_TOKEN_EXPIRATION,
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      `${this.configService.config.API_URL}/account/verify-email?token=${emailVerificationToken}`,
    );

    const clientType = this.authService.detectClientType(req);

    if (clientType === ClientType.MOBILE) {
      return {
        emailVerificationToken: this.configService.config.IS_DEV ? emailVerificationToken : undefined,
        user: this.usersService.getPublic(user),
      };
    }

    if (this.configService.config.IS_DEV) {
      return { emailVerificationToken };
    }

    return {};
  }

  @Post('sign-out')
  @Public()
  @HttpCode(204)
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.unsetUserAccessToken(req, res);
  }

  @Get()
  async getCurrent(@CurrentUser() user: UserDocument) {
    return this.usersService.getPublic(user);
  }

  @Put()
  async updateProfile(
    @Body() rawBody: unknown,
    @CurrentUser() user: UserDocument,
  ) {
    const body = updateProfileSchema.parse(rawBody);

    if (_.isEmpty(body)) {
      return this.usersService.getPublic(user);
    }

    const { password, ...rest } = body;
    const updateData: Record<string, unknown> = _.pickBy(rest, (v) => !_.isUndefined(v));

    if (password) {
      updateData.passwordHash = await SecurityUtil.hashPassword(password);
    }

    const updatedUser = await this.usersService.updateOne({ _id: user._id }, updateData);
    return this.usersService.getPublic(updatedUser);
  }

  @Post('forgot-password')
  @Public()
  @Throttle({ default: { ttl: 3_600_000, limit: 10 } })
  @HttpCode(204)
  async forgotPassword(@Body() rawBody: unknown) {
    const { email } = forgotPasswordSchema.parse(rawBody);

    const user = await this.usersService.findOne({ email });
    if (!user) return;

    await Promise.all([
      this.tokensService.invalidateUserTokens(user._id.toString(), TokenType.ACCESS),
      this.tokensService.invalidateUserTokens(user._id.toString(), TokenType.RESET_PASSWORD),
    ]);

    const resetPasswordToken = await this.tokensService.createToken({
      userId: user._id.toString(),
      type: TokenType.RESET_PASSWORD,
      expiresIn: RESET_PASSWORD_TOKEN_EXPIRATION,
    });

    const resetPasswordUrl = new URL(`${this.configService.config.API_URL}/account/verify-reset-token`);
    resetPasswordUrl.searchParams.set('token', resetPasswordToken);

    await this.emailService.sendResetPasswordEmail(user.email, user.firstName, resetPasswordUrl.toString());
  }

  @Put('reset-password')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(204)
  async resetPassword(@Body() rawBody: unknown) {
    const { token, password } = resetPasswordSchema.parse(rawBody);

    const resetPasswordToken = await this.tokensService.validateToken(token, TokenType.RESET_PASSWORD);
    if (!resetPasswordToken) return;

    const user = await this.usersService.findById(resetPasswordToken.userId);
    if (!user) return;

    const passwordHash = await SecurityUtil.hashPassword(password);

    await this.tokensService.invalidateUserTokens(user._id.toString(), TokenType.RESET_PASSWORD);
    await this.usersService.updateOne({ _id: user._id }, { passwordHash });
  }

  @Get('verify-email')
  @Public()
  @Throttle({ default: { ttl: 3_600_000, limit: 10 } })
  async verifyEmail(
    @Query('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const emailVerificationToken = await this.tokensService.validateToken(token, TokenType.EMAIL_VERIFICATION);
      if (!emailVerificationToken) {
        return this.redirectWithError(res, 'Token is invalid or expired.');
      }

      const user = await this.usersService.findById(emailVerificationToken.userId);
      if (!user) {
        return this.redirectWithError(res, 'Token is invalid or expired.');
      }

      await this.tokensService.invalidateUserTokens(user._id.toString(), TokenType.EMAIL_VERIFICATION);
      await this.usersService.updateOne({ _id: user._id }, { isEmailVerified: true });
      await this.authService.setAccessToken(req, res, user._id.toString());

      await this.emailService.sendWelcomeEmail(
        user.email,
        user.firstName,
        `${this.configService.config.WEB_URL}/sign-in`,
      );

      res.redirect(this.configService.config.WEB_URL);
    } catch {
      this.redirectWithError(res, 'Failed to verify email. Please try again.');
    }
  }

  @Post('verify-email/token')
  @Public()
  @Throttle({ default: { ttl: 3_600_000, limit: 10 } })
  @HttpCode(200)
  async verifyEmailToken(
    @Body() rawBody: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token } = tokenSchema.parse(rawBody);

    const emailVerificationToken = await this.tokensService.validateToken(token, TokenType.EMAIL_VERIFICATION);
    if (!emailVerificationToken) {
      throwClientError({ token: 'Token is invalid or expired' });
    }

    const user = await this.usersService.findById(emailVerificationToken.userId);
    if (!user) {
      throwClientError({ token: 'Token is invalid or expired' });
    }

    await this.tokensService.invalidateUserTokens(user._id.toString(), TokenType.EMAIL_VERIFICATION);
    await this.usersService.updateOne({ _id: user._id }, { isEmailVerified: true });

    const accessToken = await this.authService.setAccessToken(req, res, user._id.toString());

    await this.emailService.sendWelcomeEmail(
      user.email,
      user.firstName,
      `${this.configService.config.WEB_URL}/sign-in`,
    );

    return { accessToken, user: this.usersService.getPublic(user) };
  }

  @Get('verify-reset-token')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  async verifyResetToken(@Query('token') token: string, @Res() res: Response) {
    try {
      const resetPasswordToken = await this.tokensService.validateToken(token, TokenType.RESET_PASSWORD);
      if (!resetPasswordToken) {
        return this.redirectWithError(res, 'Token is invalid or expired.');
      }

      const user = await this.usersService.findById(resetPasswordToken.userId);
      if (!user) {
        return this.redirectWithError(res, 'Token is invalid or expired.');
      }

      const redirectUrl = new URL(`${this.configService.config.WEB_URL}/reset-password`);
      redirectUrl.searchParams.set('token', token);

      res.redirect(redirectUrl.toString());
    } catch {
      this.redirectWithError(res, 'Failed to verify reset password token. Please try again.');
    }
  }

  @Post('resend-email')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(204)
  async resendEmail(@Body() rawBody: unknown) {
    const { email } = resendEmailSchema.parse(rawBody);

    const user = await this.usersService.findOne({ email });
    if (!user) return;

    await this.tokensService.invalidateUserTokens(user._id.toString(), TokenType.EMAIL_VERIFICATION);

    const emailVerificationToken = await this.tokensService.createToken({
      userId: user._id.toString(),
      type: TokenType.EMAIL_VERIFICATION,
      expiresIn: EMAIL_VERIFICATION_TOKEN_EXPIRATION,
    });

    const emailVerificationUrl = new URL(`${this.configService.config.API_URL}/account/verify-email`);
    emailVerificationUrl.searchParams.set('token', emailVerificationToken);

    await this.emailService.sendVerificationEmail(user.email, user.firstName, emailVerificationUrl.toString());
  }

  @Get('sign-in/google')
  @Public()
  async googleRedirect(@Req() req: Request, @Res() res: Response) {
    try {
      const { state, codeVerifier, authorizationUrl } = this.googleService.createAuthUrl();

      const cookieOptions = {
        path: '/',
        httpOnly: true,
        secure: req.secure,
        maxAge: 60 * 10 * 1000,
        sameSite: 'lax' as const,
      };

      res.cookie('google-oauth-state', state, cookieOptions);
      res.cookie('google-code-verifier', codeVerifier, cookieOptions);

      res.redirect(authorizationUrl);
    } catch (error) {
      this.redirectWithError(res, error instanceof Error ? error.message : 'Failed to create Google OAuth URL');
    }
  }

  @Get('sign-in/google/callback')
  @Public()
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = await this.googleService.validateCallback({
        code: req.query.code?.toString(),
        state: req.query.state?.toString(),
        storedState: req.cookies?.['google-oauth-state'],
        codeVerifier: req.cookies?.['google-code-verifier'],
      });

      if (!user) {
        throw new Error('Failed to authenticate with Google');
      }

      await this.authService.setAccessToken(req, res, user._id.toString());

      res.redirect(this.configService.config.WEB_URL);
    } catch (error) {
      this.redirectWithError(res, error instanceof Error ? error.message : 'Google authentication failed');
    }
  }

  @Post('sign-in/google/token')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @HttpCode(200)
  async googleMobile(
    @Body() rawBody: unknown,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { idToken } = googleMobileSchema.parse(rawBody);

    const user = await this.googleService.validateIdToken(idToken);

    if (!user) {
      throwClientError({ credentials: 'Failed to authenticate with Google' });
    }

    const accessToken = await this.authService.setAccessToken(req, res, user._id.toString());

    return { accessToken, user: this.usersService.getPublic(user) };
  }

  private redirectWithError(res: Response, message: string): void {
    const url = new URL(this.configService.config.WEB_URL);
    url.searchParams.set('error', encodeURIComponent(message));
    res.redirect(url.toString());
  }
}
