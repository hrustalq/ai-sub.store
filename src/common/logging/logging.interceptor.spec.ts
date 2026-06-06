import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

type LogPayload = Record<string, unknown>;

describe('LoggingInterceptor', () => {
  const infoMock = jest.fn<void, [LogPayload, string]>();
  const errorMock = jest.fn<void, [LogPayload, string]>();
  const logger = {
    setContext: jest.fn(),
    info: infoMock,
    error: errorMock,
  };

  const interceptor = new LoggingInterceptor(logger as never);

  const createHttpContext = (overrides?: {
    statusCode?: number;
    throwError?: Error;
  }): { context: ExecutionContext; handler: CallHandler } => {
    const response = {
      statusCode: overrides?.statusCode ?? 200,
    };

    const request = {
      method: 'GET',
      url: '/orders',
      ip: '127.0.0.1',
      id: 'req-1',
      get: jest.fn().mockReturnValue('jest-agent'),
    };

    const context = {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => request,
        getResponse: () => response,
      }),
      getClass: jest.fn().mockReturnValue({ name: 'OrdersController' }),
      getHandler: jest.fn().mockReturnValue({ name: 'findAll' }),
    } as unknown as ExecutionContext;

    const handler: CallHandler = {
      handle: () =>
        overrides?.throwError
          ? throwError(() => overrides.throwError)
          : of({ status: 'ok' }),
    };

    return { context, handler };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs incoming and completed requests for HTTP calls', (done) => {
    const { context, handler } = createHttpContext();

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(infoMock).toHaveBeenCalledTimes(2);
        expect(infoMock).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            method: 'GET',
            url: '/orders',
            controller: 'OrdersController',
            handler: 'findAll',
          }),
          'Incoming request',
        );
        expect(infoMock).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            statusCode: 200,
          }),
          'Request completed',
        );
        const duration = infoMock.mock.calls[1]?.[0].duration;
        expect(typeof duration).toBe('number');
        expect(duration).toBeGreaterThanOrEqual(0);
        done();
      },
    });
  });

  it('logs request failures', (done) => {
    const { context, handler } = createHttpContext({
      throwError: new Error('boom'),
    });

    interceptor.intercept(context, handler).subscribe({
      error: () => {
        expect(errorMock).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            url: '/orders',
            error: 'boom',
          }),
          'Request failed',
        );
        done();
      },
    });
  });

  it('skips health probe requests', (done) => {
    const { context, handler } = createHttpContext();
    const http = context.switchToHttp();
    const request = http.getRequest<{ url: string }>();
    request.url = '/health/ready';

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(infoMock).not.toHaveBeenCalled();
        expect(errorMock).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('skips non-HTTP contexts', (done) => {
    const context = {
      getType: jest.fn().mockReturnValue('rpc'),
    } as unknown as ExecutionContext;
    const handler: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, handler).subscribe({
      complete: () => {
        expect(infoMock).not.toHaveBeenCalled();
        expect(errorMock).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
