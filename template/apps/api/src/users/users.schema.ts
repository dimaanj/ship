import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'users', timestamps: { createdAt: 'createdOn', updatedAt: 'updatedOn' } })
export class User {
  _id: string;

  @Prop({ required: true, minlength: 1, maxlength: 128 })
  firstName: string;

  @Prop({ required: true, minlength: 1, maxlength: 128 })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, maxlength: 255 })
  email: string;

  @Prop()
  passwordHash?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: null })
  avatarUrl?: string | null;

  @Prop(
    raw({
      google: {
        type: {
          userId: { type: String },
          connectedOn: { type: Date },
        },
        required: false,
      },
    }),
  )
  oauth?: {
    google?: {
      userId: string;
      connectedOn: Date;
    };
  };

  @Prop()
  lastRequest?: Date;

  createdOn?: Date;
  updatedOn?: Date;

  @Prop({ default: null })
  deletedOn?: Date | null;
}

export type UserDocument = HydratedDocument<User>;

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 }, { unique: true });

export type PublicUser = Omit<User, 'passwordHash'>;
