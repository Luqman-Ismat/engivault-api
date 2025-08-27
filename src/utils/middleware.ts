import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import {
  createRequestLogger,
  sanitizeRequestData,
  RequestLogContext,
} from './logger';
import { recordRequestMetrics } from './metrics';
import { config } from '@/config/environment';

export interface RequestContext {
  requestId: string;
  startTime: number;
  logger: any;
}

declare module 'fastify' {
  interface FastifyRequest {
    context: RequestContext;
  }
}

export async function requestLoggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const startTime = Date.now();
  const requestId =
    request.id ||
    `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create request context
  const context: RequestLogContext = {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers['user-agent'],
    ip: request.ip,
    userId: request.headers['x-user-id'] as string,
  };

  // Create child logger for this request
  const requestLogger = createRequestLogger(request.log, request, context);

  // Store context in request
  request.context = {
    requestId,
    startTime,
    logger: requestLogger,
  };

  // Log request start
  requestLogger.info({
    msg: 'Request started',
    method: request.method,
    url: request.url,
    headers: sanitizeRequestData(request.headers, config.REDACT_PII),
    body: sanitizeRequestData(request.body, config.REDACT_PII),
  });

  // Store timing info for later use
  request.context.startTime = startTime;
  request.context.logger = requestLogger;
}

export async function registerMiddleware(
  fastify: FastifyInstance
): Promise<void> {
  // Add request ID if not present
  fastify.addHook('onRequest', async (request, reply) => {
    if (!request.id) {
      request.id = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  });

  // Register request logging middleware
  fastify.addHook('preHandler', requestLoggingMiddleware);

  // Add response logging
  fastify.addHook('onResponse', async (request, reply) => {
    const context = getRequestContext(request);
    if (context) {
      const duration = Date.now() - context.startTime;
      const statusCode = reply.statusCode;

      // Log request completion
      context.logger.info({
        msg: 'Request completed',
        method: request.method,
        url: request.url,
        statusCode,
        duration,
        responseSize: reply.getHeader('content-length'),
      });

      // Record metrics
      const route = request.routerPath || request.url;
      const requestSize = request.headers['content-length']
        ? parseInt(request.headers['content-length'] as string)
        : undefined;
      const responseSize = reply.getHeader('content-length')
        ? parseInt(reply.getHeader('content-length') as string)
        : undefined;

      recordRequestMetrics(
        request.method,
        route,
        statusCode,
        duration,
        requestSize,
        responseSize
      );
    }
  });

  // Add error logging
  fastify.addHook('onError', async (request, reply, error) => {
    const context = getRequestContext(request);
    if (context) {
      const duration = Date.now() - context.startTime;

      context.logger.error({
        msg: 'Request error',
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
    }
  });
}

// Helper function to get request logger
export function getRequestLogger(request: FastifyRequest): any {
  return request.context?.logger || request.log;
}

// Helper function to get request context
export function getRequestContext(
  request: FastifyRequest
): RequestContext | null {
  return request.context || null;
}
