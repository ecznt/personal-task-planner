import { HttpException } from '@nestjs/common';

export type ValidationProblemItem = {
  readonly code: string;
  readonly path: string;
  readonly message: string;
};

export type ApiProblemOptions = {
  readonly status: number;
  readonly code: string;
  readonly detail: string;
  readonly errors?: readonly ValidationProblemItem[];
  readonly retryAfterSeconds?: number;
};

export class ApiProblemException extends HttpException {
  constructor(readonly problem: ApiProblemOptions) {
    super(problem.detail, problem.status);
  }
}
