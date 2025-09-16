import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import logger from './logger';
import { ApiResponse } from '@/types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function createErrorResponse(error: string, _statusCode: number = 500): ApiResponse {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
}

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Log error
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      statusCode,
    },
    request: {
      method: request.method,
      url: request.url,
      headers: request.headers,
    },
  }, 'Request error');

  // Create error response
  const errorResponse = createErrorResponse(message, statusCode);

  // Send response
  await reply.status(statusCode).send(errorResponse);
}

export function handleAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return fn(...args).catch((error) => {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(error.message || 'Internal Server Error', 500);
    });
  };
}