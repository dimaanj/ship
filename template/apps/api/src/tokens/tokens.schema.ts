import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum TokenType {
  ACCESS = 'access',
  EMAIL_VERIFICATION = 'email-verification',
  RESET_PASSWORD = 'reset-password',
}

@Schema({ collection: 'tokens', timestamps: false })
export class Token {
  _id: string;

  @Prop({ required: true })
  value: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: TokenType })
  type: TokenType;

  @Prop({ required: true, index: { expireAfterSeconds: 0 } })
  expiresOn: Date;
}

export type TokenDocument = HydratedDocument<Token>;

export const TokenSchema = SchemaFactory.createForClass(Token);

TokenSchema.index({ userId: 1, type: 1 });
