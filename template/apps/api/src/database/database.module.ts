import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppConfigService } from '../config/config.service.js';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (configService: AppConfigService) => ({
        uri: configService.config.MONGO_URI,
        dbName: configService.config.MONGO_DB_NAME,
      }),
      inject: [AppConfigService],
    }),
  ],
})
export class DatabaseModule {}
