import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Token, TokenSchema } from './tokens.schema.js';
import { TokensService } from './tokens.service.js';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }])],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
