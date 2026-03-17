import { forwardRef, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './users.schema.js';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { UsersHandler } from './users.handler.js';
import { AnalyticsModule } from '../analytics/analytics.module.js';
import { SocketModule } from '../socket/socket.module.js';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AnalyticsModule),
    forwardRef(() => SocketModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersHandler],
  exports: [UsersService],
})
export class UsersModule {}
