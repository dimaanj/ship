import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Token, TokenDocument, TokenType } from './tokens.schema.js';
import { SecurityUtil } from '../common/utils/security.util.js';

interface CreateTokenOptions {
  userId: string;
  type: TokenType;
  expiresIn: number;
}

@Injectable()
export class TokensService {
  constructor(@InjectModel(Token.name) private tokenModel: Model<TokenDocument>) {}

  async createToken({ userId, type, expiresIn }: CreateTokenOptions): Promise<string> {
    const secureToken = SecurityUtil.generateSecureToken();
    const value = SecurityUtil.hashToken(secureToken);

    const now = new Date();
    const expiresOn = new Date(now.getTime() + expiresIn * 1000);

    const token = await this.tokenModel.create({ type, value, userId, expiresOn });

    return `${token._id}.${secureToken}`;
  }

  async validateToken(value: string | undefined | null, type: TokenType): Promise<TokenDocument | null> {
    if (!value) return null;

    const parts = value.split('.');
    if (parts.length !== 2) return null;

    const [tokenId, secret] = parts;

    const token = await this.getToken(tokenId, type);
    if (!token) return null;

    const isValid = SecurityUtil.verifyTokenHash(token.value, secret);
    if (!isValid) return null;

    const now = new Date();
    if (token.expiresOn.getTime() <= now.getTime()) {
      await this.tokenModel.deleteOne({ _id: tokenId, type });
      return null;
    }

    return token;
  }

  async invalidateToken(value?: string | null): Promise<void> {
    if (!value) return;

    const parts = value.split('.');
    if (parts.length !== 2) return;

    const [tokenId] = parts;
    await this.tokenModel.deleteOne({ _id: tokenId, type: TokenType.ACCESS });
  }

  async invalidateUserTokens(userId: string, type: TokenType): Promise<void> {
    await this.tokenModel.deleteMany({ userId, type });
  }

  async getUserActiveToken(userId: string, type: TokenType): Promise<TokenDocument | null> {
    const token = await this.tokenModel.findOne({ userId, type });
    if (!token) return null;

    const now = new Date();
    if (token.expiresOn.getTime() <= now.getTime()) {
      await this.tokenModel.deleteOne({ _id: token._id });
      return null;
    }

    return token;
  }

  async updateTokenExpiry(tokenId: string, type: TokenType, newExpiresOn: Date): Promise<void> {
    await this.tokenModel.updateOne({ _id: tokenId, type }, { $set: { expiresOn: newExpiresOn } });
  }

  private async getToken(tokenId: string | undefined | null, type: TokenType): Promise<TokenDocument | null> {
    if (!tokenId) return null;

    const token = await this.tokenModel.findOne({ _id: tokenId, type });
    if (!token || token.type !== type) return null;

    const now = new Date();
    if (token.expiresOn.getTime() <= now.getTime()) {
      await this.tokenModel.deleteOne({ _id: tokenId, type });
      return null;
    }

    return token;
  }
}
