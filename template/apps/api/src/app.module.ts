import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppConfigModule } from './config/config.module.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { TokensModule } from './tokens/tokens.module.js';
import { EmailModule } from './email/email.module.js';
import { GoogleModule } from './google/google.module.js';
import { CloudStorageModule } from './cloud-storage/cloud-storage.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { SocketModule } from './socket/socket.module.js';
import { SchedulerModule } from './scheduler/scheduler.module.js';
import { AuthGuard } from './common/guards/auth.guard.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    AuthModule,
    UsersModule,
    TokensModule,
    EmailModule,
    GoogleModule,
    CloudStorageModule,
    AnalyticsModule,
    SocketModule,
    SchedulerModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
