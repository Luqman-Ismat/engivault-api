import { describe, it, expect, beforeEach } from 'vitest';
import { createLogger, createRequestLogger, sanitizeRequestData, LogConfig } from './logger';
import { FastifyRequest } from 'fastify';

describe('Logger', () => {
  let mockRequest: Partial<FastifyRequest>;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/test',
      headers: {
        'user-agent': 'test-agent',
        'authorization': 'Bearer secret-token',
        'content-type': 'application/json',
      },
      body: {
        username: 'testuser',
        password: 'secretpassword',
        email: 'test@example.com',
      },
      ip: '127.0.0.1',
    };
  });

  describe('createLogger', () => {
    it('should create a logger with basic configuration', () => {
      const config: LogConfig = {
        level: 'info',
        prettyPrint: false,
        redactPII: false,
      };

      const logger = createLogger(config);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('should create a logger with PII redaction', () => {
      const config: LogConfig = {
        level: 'info',
        prettyPrint: false,
        redactPII: true,
      };

      const logger = createLogger(config);
      expect(logger).toBeDefined();
    });

    it('should create a logger with pretty printing', () => {
      const config: LogConfig = {
        level: 'info',
        prettyPrint: true,
        redactPII: false,
      };

      const logger = createLogger(config);
      expect(logger).toBeDefined();
    });
  });

  describe('createRequestLogger', () => {
    it('should create a child logger for a request', () => {
      const baseLogger = createLogger({
        level: 'info',
        prettyPrint: false,
        redactPII: false,
      });

      const requestLogger = createRequestLogger(
        baseLogger,
        mockRequest as FastifyRequest,
        {
          requestId: 'test-123',
          method: 'GET',
          url: '/test',
          userAgent: 'test-agent',
          ip: '127.0.0.1',
        }
      );

      expect(requestLogger).toBeDefined();
      expect(typeof requestLogger.info).toBe('function');
    });
  });

  describe('sanitizeRequestData', () => {
    it('should return data unchanged when redactPII is false', () => {
      const data = {
        username: 'testuser',
        password: 'secretpassword',
        email: 'test@example.com',
      };

      const result = sanitizeRequestData(data, false);
      expect(result).toEqual(data);
    });

    it('should redact PII fields when redactPII is true', () => {
      const data = {
        username: 'testuser',
        password: 'secretpassword',
        email: 'test@example.com',
        normalField: 'normal-value',
      };

      const result = sanitizeRequestData(data, true);
      expect(result).toEqual({
        username: '[REDACTED]',
        password: '[REDACTED]',
        email: '[REDACTED]',
        normalField: 'normal-value',
      });
    });

    it('should handle null and undefined data', () => {
      expect(sanitizeRequestData(null, true)).toBeNull();
      expect(sanitizeRequestData(undefined, true)).toBeUndefined();
    });

    it('should handle non-object data', () => {
      expect(sanitizeRequestData('string', true)).toBe('string');
      expect(sanitizeRequestData(123, true)).toBe(123);
    });
  });
});
