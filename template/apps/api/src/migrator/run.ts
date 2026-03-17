import { NestFactory } from '@nestjs/core';
import { Logger, Module } from '@nestjs/common';
import process from 'node:process';

import { ConfigModule } from '../config/config.module';

import { MigratorModule } from './migrator.module';
import { MigratorService } from './migrator.service';

@Module({
  imports: [ConfigModule, MigratorModule],
})
class MigratorAppModule {}

const logger = new Logger('MigratorRunner');

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(MigratorAppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const migrator = app.get(MigratorService);
    await migrator.exec();
    logger.log('Migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed', error);
    process.exit(1);
  } finally {
    await app.close();
  }

  process.exit(0);
}

bootstrap();
