import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { AppModule } from './app.module.js';
import { AppConfigService } from './config/config.service.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(AppConfigService);

  app.use(helmet());
  app.enableCors({ origin: true, credentials: true });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter(configService));

  const port = configService.config.PORT;
  await app.listen(port);

  console.log(`API server is listening on ${port} in ${configService.config.APP_ENV} environment`);
}

bootstrap();
