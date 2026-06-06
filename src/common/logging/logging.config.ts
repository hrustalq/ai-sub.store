import { IncomingMessage, ServerResponse } from 'node:http';
import { Params } from 'nestjs-pino';
import { Request, Response } from 'express';

const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers["x-admin-api-key"]',
  'req.headers.cookie',
];

export function buildLoggingParams(
  logLevel: string,
  logFormat: string = 'json',
): Params {
  return {
    pinoHttp: {
      level: logLevel,
      autoLogging: false,
      transport:
        logFormat === 'pretty'
          ? {
              target: 'pino-pretty',
              options: {
                singleLine: true,
                colorize: true,
                translateTime: 'SYS:standard',
              },
            }
          : undefined,
      redact: REDACT_PATHS,
      customProps: (req: IncomingMessage) => ({
        context: 'HTTP',
        requestId: (req as Request).id,
      }),
      serializers: {
        req: (req: IncomingMessage) => {
          const request = req as Request;
          return {
            id: request.id,
            method: request.method,
            url: request.url,
            remoteAddress: request.ip,
          };
        },
        res: (res: ServerResponse) => {
          const response = res as Response;
          return {
            statusCode: response.statusCode,
          };
        },
      },
      customLogLevel: (
        _req: IncomingMessage,
        res: ServerResponse,
        error?: Error,
      ) => {
        if (error || res.statusCode >= 500) {
          return 'error';
        }
        if (res.statusCode >= 400) {
          return 'warn';
        }
        return 'info';
      },
    },
  };
}
