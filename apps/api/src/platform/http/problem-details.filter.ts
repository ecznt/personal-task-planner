import {
  type ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';

type ProblemDetails = {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly traceId?: string;
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpAdapter = this.adapterHost.httpAdapter;
    const context = host.switchToHttp();
    const response = context.getResponse<unknown>();
    const request = context.getRequest<{ readonly id?: string }>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const detail =
      isHttpException && status < HttpStatus.INTERNAL_SERVER_ERROR
        ? exception.message
        : 'An unexpected error occurred.';

    const body: ProblemDetails = {
      type: 'about:blank',
      title: HttpStatus[status] ?? 'Error',
      status,
      detail,
      ...(request.id === undefined ? {} : { traceId: request.id }),
    };

    httpAdapter.setHeader(response, 'Content-Type', 'application/problem+json');
    httpAdapter.reply(response, body, status);
  }
}
