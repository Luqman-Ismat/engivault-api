import { FastifyInstance } from 'fastify';
import authRoutes from './auth';
import calculationRoutes from './calculations';
import analyticsRoutes from './analytics';

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Health check endpoint
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check endpoint',
      description: 'Returns the health status of the API',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            memory: {
              type: 'object',
              properties: {
                rss: { type: 'number' },
                heapTotal: { type: 'number' },
                heapUsed: { type: 'number' },
                external: { type: 'number' },
              },
            },
          },
          required: ['status', 'timestamp', 'uptime', 'version', 'memory'],
        },
      },
    },
  }, async () => {
    const memUsage = process.memoryUsage();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
      },
    };
  });

  // Root endpoint
  fastify.get('/', {
    schema: {
      tags: ['Health'],
      summary: 'Root endpoint',
      description: 'Returns basic API information',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            documentation: { type: 'string' },
            health: { type: 'string' },
            version: { type: 'string' },
          },
          required: ['status', 'message', 'documentation', 'health', 'version'],
        },
      },
    },
  }, async () => {
    return {
      status: 'ok',
      message: 'EngiVault API v2.0 is running',
      documentation: '/documentation',
      health: '/health',
      version: '2.0.0',
    };
  });

  // Register route modules
  await fastify.register(authRoutes);
  await fastify.register(calculationRoutes);
  await fastify.register(analyticsRoutes);
}