import { FastifyReply } from 'fastify';
import { z } from 'zod';
import { ErrorHelper, ErrorHint } from './errorHelper';

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
  hints?: ErrorHint[];
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CalculationError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CalculationError';
  }
}

export function handleError(
  error: unknown,
  reply: FastifyReply,
  hints?: ErrorHint[]
): void {
  if (error instanceof z.ZodError) {
    const enhancedError = ErrorHelper.createError(
      'Validation error',
      'VALIDATION_ERROR',
      // @ts-ignore
      error.errors as unknown,
      hints
    );
    reply.status(400).send(enhancedError);
  } else if (error instanceof ValidationError) {
    const enhancedError = ErrorHelper.createError(
      error.message,
      'VALIDATION_ERROR',
      error.details,
      hints
    );
    reply.status(400).send(enhancedError);
  } else if (error instanceof CalculationError) {
    const enhancedError = ErrorHelper.createError(
      error.message,
      'CALCULATION_ERROR',
      error.details,
      hints
    );
    reply.status(422).send(enhancedError);
  } else if (error instanceof Error) {
    const enhancedError = ErrorHelper.createError(
      'Internal server error',
      'INTERNAL_ERROR',
      undefined,
      hints
    );
    reply.status(500).send(enhancedError);
  } else {
    const enhancedError = ErrorHelper.createError(
      'Unknown error occurred',
      'UNKNOWN_ERROR',
      undefined,
      hints
    );
    reply.status(500).send(enhancedError);
  }
}

export function createValidationError(
  message: string,
  details?: unknown
): ValidationError {
  return new ValidationError(message, details);
}

export function createCalculationError(
  message: string,
  details?: unknown
): CalculationError {
  return new CalculationError(message, details);
}
