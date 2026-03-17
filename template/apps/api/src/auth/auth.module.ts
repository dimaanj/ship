import { forwardRef, Global, Module } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { TokensModule } from '../tokens/tokens.module.js';
import { UsersModule } from '../users/users.module.js';
import { EmailModule } from '../email/email.module.js';
import { GoogleModule } from '../google/google.module.js';

@Global()
@Module({
  imports: [
    forwardRef(() => TokensModule),
    forwardRef(() => UsersModule),
    forwardRef(() => EmailModule),
    forwardRef(() => GoogleModule),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
