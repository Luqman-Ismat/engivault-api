import pino from 'pino';
import { FastifyRequest } from 'fastify';
import { IncomingMessage, ServerResponse } from 'http';

export interface LogConfig {
  level: string;
  prettyPrint: boolean;
  redactPII: boolean;
}

export interface RequestLogContext {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

// PII fields that should be redacted when redactPII is true
const PII_FIELDS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'email',
  'phone',
  'address',
  'ssn',
  'credit_card',
  'personal_id',
  'name',
  'username',
  'user_id',
  'client_id',
  'secret',
  'key',
  'private',
  'sensitive',
];

// Create base logger
export function createLogger(config: LogConfig) {
  const pinoConfig: pino.LoggerOptions = {
    level: config.level,
    serializers: {
      req: (req: IncomingMessage) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
      }),
      res: (res: ServerResponse) => ({
        statusCode: res.statusCode,
      }),
      err: (err: Error) => ({
        type: err.constructor.name,
        message: err.message,
        stack: err.stack,
      }),
    },
    redact: config.redactPII ? {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password'],
      censor: '[REDACTED]',
      remove: false,
    } : undefined,
  };

  if (config.prettyPrint) {
    pinoConfig.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };
  }

  return pino(pinoConfig);
}

// Create child logger for a specific request
export function createRequestLogger(
  baseLogger: pino.Logger,
  request: FastifyRequest,
  context: RequestLogContext
): pino.Logger {
  return baseLogger.child({
    requestId: context.requestId,
    method: context.method,
    url: context.url,
    userAgent: context.userAgent,
    ip: context.ip,
    userId: context.userId,
  });
}

// Sanitize request data for logging
export function sanitizeRequestData(data: any, redactPII: boolean): any {
  if (!redactPII || !data) {
    return data;
  }

  if (typeof data === 'object') {
    const sanitized = { ...data };

    for (const field of PII_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  return data;
}

// Log levels
export const LOG_LEVELS = {
  FATAL: 60,
  ERROR: 50,
  WARN: 40,
  INFO: 30,
  DEBUG: 20,
  TRACE: 10,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;
