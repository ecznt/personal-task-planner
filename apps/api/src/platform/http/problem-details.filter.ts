import { randomUUID } from 'node:crypto';

import {
  type ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';

import { ApiProblemException, type ValidationProblemItem } from './api-problem.exception';

type ProblemDetails = {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly code: string;
  readonly traceId: string;
  readonly errors?: readonly ValidationProblemItem[];
  readonly retryAfterSeconds?: number;
};

const statusCodes: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'MALFORMED_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'AUTHENTICATION_REQUIRED',
  [HttpStatus.FORBIDDEN]: 'REQUEST_FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
  [HttpStatus.CONFLICT]: 'DOMAIN_CONFLICT',
  [HttpStatus.PRECONDITION_FAILED]: 'PRECONDITION_FAILED',
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: 'UNSUPPORTED_MEDIA_TYPE',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_FAILED',
  [HttpStatus.PRECONDITION_REQUIRED]: 'PRECONDITION_REQUIRED',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
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
    const apiProblem = exception instanceof ApiProblemException ? exception.problem : undefined;
    const code = apiProblem?.code ?? statusCodes[status] ?? 'INTERNAL_ERROR';
    const detail = apiProblem?.detail ?? safeDetail(status);
    const traceId = request.id ?? randomUUID();

    const body: ProblemDetails = {
      type: `https://personal-task-planner.local/problems/${code.toLowerCase().replaceAll('_', '-')}`,
      title: HttpStatus[status] ?? 'Error',
      status,
      detail,
      code,
      traceId,
      ...(apiProblem?.errors === undefined ? {} : { errors: apiProblem.errors }),
      ...(apiProblem?.retryAfterSeconds === undefined
        ? {}
        : { retryAfterSeconds: apiProblem.retryAfterSeconds }),
    };

    httpAdapter.setHeader(response, 'Content-Type', 'application/problem+json');
    if (apiProblem?.retryAfterSeconds !== undefined) {
      httpAdapter.setHeader(response, 'Retry-After', apiProblem.retryAfterSeconds.toString());
    }
    httpAdapter.reply(response, body, status);
  }
}

function safeDetail(status: number): string {
  if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
    return 'An unexpected error occurred.';
  }

  return 'The request could not be completed.';
}
