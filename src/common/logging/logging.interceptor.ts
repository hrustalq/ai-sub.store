import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { Observable, tap } from 'rxjs';

const HEALTH_PATH_PREFIX = '/health';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const { method, url, ip } = request;

    if (url.startsWith(HEALTH_PATH_PREFIX)) {
      return next.handle();
    }
    const userAgent = request.get('user-agent') ?? '';
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const start = Date.now();

    this.logger.info(
      {
        method,
        url,
        ip,
        userAgent,
        controller,
        handler,
        requestId: request.id,
      },
      'Incoming request',
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const response = http.getResponse<Response>();
          this.logger.info(
            {
              method,
              url,
              statusCode: response.statusCode,
              duration: Date.now() - start,
              controller,
              handler,
              requestId: request.id,
            },
            'Request completed',
          );
        },
        error: (error: Error) => {
          this.logger.error(
            {
              method,
              url,
              duration: Date.now() - start,
              controller,
              handler,
              requestId: request.id,
              error: error.message,
            },
            'Request failed',
          );
        },
      }),
    );
  }
}
