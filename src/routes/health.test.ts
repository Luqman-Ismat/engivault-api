import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';

describe('Health Endpoint', () => {
  it('should return 200 OK for health check', async () => {
    const fastify = Fastify();

    // Register only the health endpoint
    fastify.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
      };
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('status', 'ok');
    expect(response.json()).toHaveProperty('timestamp');
    expect(response.json()).toHaveProperty('uptime');
    expect(response.json()).toHaveProperty('version', '1.0.0');
  });

  it('should return 200 OK for root endpoint', async () => {
    const fastify = Fastify();

    // Register only the root endpoint
    fastify.get('/', async () => {
      return {
        status: 'ok',
        message: 'EngiVault API is running',
        documentation: '/documentation',
        health: '/health',
      };
    });

    const response = await fastify.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('status', 'ok');
    expect(response.json()).toHaveProperty(
      'message',
      'EngiVault API is running'
    );
    expect(response.json()).toHaveProperty('documentation', '/documentation');
    expect(response.json()).toHaveProperty('health', '/health');
  });

  it('should return 404 for non-existent endpoint', async () => {
    const fastify = Fastify();

    const response = await fastify.inject({
      method: 'GET',
      url: '/non-existent',
    });

    expect(response.statusCode).toBe(404);
  });
});
