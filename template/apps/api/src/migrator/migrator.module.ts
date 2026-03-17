import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ConfigService } from '../config/config.service';

import { MigratorService } from './migrator.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URI'),
        dbName: config.get('MONGO_DB_NAME'),
      }),
    }),
  ],
  providers: [MigratorService],
  exports: [MigratorService],
})
export class MigratorModule {}
