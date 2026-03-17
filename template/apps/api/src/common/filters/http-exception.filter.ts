import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

import { AppConfigService } from '../../config/config.service.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private configService: AppConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errors: Record<string, unknown> = { global: 'Something went wrong' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null && 'errors' in body) {
        errors = (body as any).errors;
      } else if (typeof body === 'object' && body !== null && 'message' in body) {
        const message = (body as any).message;
        errors = { global: Array.isArray(message) ? message[0] : message };
      } else if (typeof body === 'string') {
        errors = { global: body };
      }
    } else if (exception instanceof Error) {
      console.error(exception.stack);

      if (this.configService.config.APP_ENV !== 'production') {
        errors = { global: exception.message };
      }
    }

    response.status(status).json({ errors });
  }
}
