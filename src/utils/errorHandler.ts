import { FastifyReply } from 'fastify';

export interface ApiError {
  error: string;
  code?: string;
  details?: any;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CalculationError extends Error {
  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'CalculationError';
  }
}

export function handleError(error: unknown, reply: FastifyReply): void {
  if (error instanceof ValidationError) {
    reply.status(400).send({
      error: error.message,
      code: 'VALIDATION_ERROR',
      details: error.details,
    });
  } else if (error instanceof CalculationError) {
    reply.status(422).send({
      error: error.message,
      code: 'CALCULATION_ERROR',
      details: error.details,
    });
  } else if (error instanceof Error) {
    reply.status(500).send({
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    });
  } else {
    reply.status(500).send({
      error: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
    });
  }
}

export function createValidationError(
  message: string,
  details?: any
): ValidationError {
  return new ValidationError(message, details);
}

export function createCalculationError(
  message: string,
  details?: any
): CalculationError {
  return new CalculationError(message, details);
}
