import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import { registerPerformancePlugins } from './performance';
import { config } from '@/config/environment';

describe('Performance Plugins', () => {
  let fastify: Fastify.FastifyInstance;

  beforeEach(async () => {
    fastify = Fastify({
      logger: false
    });
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('Rate Limiting', () => {
    it('should register rate limiting plugin', async () => {
      await registerPerformancePlugins(fastify);
      
      // Add a test route
      fastify.get('/test', async (request, reply) => {
        return { message: 'test' };
      });

      await fastify.ready();

      // Check if rate limiting is active
      expect(fastify.hasPlugin('@fastify/rate-limit')).toBe(true);
    });

    it('should allow health and metrics endpoints', async () => {
      await registerPerformancePlugins(fastify);
      
      fastify.get('/health', async () => ({ status: 'ok' }));
      fastify.get('/metrics', async () => 'metrics data');

      await fastify.ready();

      // These should not be rate limited
      const healthResponse = await fastify.inject({
        method: 'GET',
        url: '/health'
      });

      const metricsResponse = await fastify.inject({
        method: 'GET',
        url: '/metrics'
      });

      expect(healthResponse.statusCode).toBe(200);
      expect(metricsResponse.statusCode).toBe(200);
    });
  });

  describe('Compression', () => {
    it('should register compression plugin when enabled', async () => {
      // Mock config to enable compression
      const originalConfig = { ...config };
      config.ENABLE_COMPRESSION = true;

      await registerPerformancePlugins(fastify);
      
      fastify.get('/test', async (request, reply) => {
        return { message: 'test'.repeat(1000) }; // Large payload
      });

      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'accept-encoding': 'gzip, deflate'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-encoding']).toBeDefined();

      // Restore original config
      Object.assign(config, originalConfig);
    });

    it('should not compress small payloads', async () => {
      const originalConfig = { ...config };
      config.ENABLE_COMPRESSION = true;

      await registerPerformancePlugins(fastify);
      
      fastify.get('/test', async (request, reply) => {
        return { message: 'small' };
      });

      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'accept-encoding': 'gzip, deflate'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-encoding']).toBeUndefined();

      Object.assign(config, originalConfig);
    });
  });

  describe('Caching', () => {
    it('should add cache headers for GET requests when enabled', async () => {
      const originalConfig = { ...config };
      config.ENABLE_CACHING = true;

      await registerPerformancePlugins(fastify);
      
      fastify.get('/test', async (request, reply) => {
        return { message: 'test' };
      });

      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/test'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['etag']).toBeDefined();

      Object.assign(config, originalConfig);
    });

    it('should not add cache headers for POST requests', async () => {
      const originalConfig = { ...config };
      config.ENABLE_CACHING = true;

      await registerPerformancePlugins(fastify);
      
      fastify.post('/test', async (request, reply) => {
        return { message: 'test' };
      });

      await fastify.ready();

      const response = await fastify.inject({
        method: 'POST',
        url: '/test',
        payload: { data: 'test' }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBeUndefined();
      expect(response.headers['etag']).toBeUndefined();

      Object.assign(config, originalConfig);
    });

    it('should return 304 for matching ETags', async () => {
      const originalConfig = { ...config };
      config.ENABLE_CACHING = true;

      await registerPerformancePlugins(fastify);
      
      fastify.get('/test', async (request, reply) => {
        return { message: 'test' };
      });

      await fastify.ready();

      // First request to get ETag
      const firstResponse = await fastify.inject({
        method: 'GET',
        url: '/test'
      });

      const etag = firstResponse.headers['etag'];

      // Second request with If-None-Match header
      const secondResponse = await fastify.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'if-none-match': etag
        }
      });

      expect(secondResponse.statusCode).toBe(304);

      Object.assign(config, originalConfig);
    });
  });

  describe('Configuration', () => {
    it('should respect ENABLE_COMPRESSION setting', async () => {
      const originalConfig = { ...config };
      config.ENABLE_COMPRESSION = false;

      await registerPerformancePlugins(fastify);
      
      fastify.get('/test', async (request, reply) => {
        return { message: 'test'.repeat(1000) };
      });

      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/test',
        headers: {
          'accept-encoding': 'gzip, deflate'
        }
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-encoding']).toBeUndefined();

      Object.assign(config, originalConfig);
    });

    it('should respect ENABLE_CACHING setting', async () => {
      const originalConfig = { ...config };
      config.ENABLE_CACHING = false;

      await registerPerformancePlugins(fastify);
      
      fastify.get('/test', async (request, reply) => {
        return { message: 'test' };
      });

      await fastify.ready();

      const response = await fastify.inject({
        method: 'GET',
        url: '/test'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBeUndefined();
      expect(response.headers['etag']).toBeUndefined();

      Object.assign(config, originalConfig);
    });
  });
});
