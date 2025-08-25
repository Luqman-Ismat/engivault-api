import { FastifyInstance } from 'fastify';
import pressureDropRoutes from './pressureDrop';
import npshRoutes from './npsh';
import flowFittingsRoutes from './flowFittings';
import pumpSystemCurveRoutes from './pumpSystemCurve';
import npshRequiredRoutes from './npshRequired';
import minorLossesRoutes from './minorLosses';
import pressureProfileRoutes from './pressureProfile';
import operatePointRoutes from './operatePoint';
import cavitationRiskRoutes from './cavitationRisk';

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Health check endpoint
  fastify.get(
    '/health',
    {
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
            },
            required: ['status', 'timestamp', 'uptime', 'version'],
          },
        },
      },
    },
    async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
      };
    }
  );

  // Root endpoint
  fastify.get(
    '/',
    {
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
            },
            required: ['status', 'message', 'documentation', 'health'],
          },
        },
      },
    },
    async () => {
      return {
        status: 'ok',
        message: 'EngiVault API is running',
        documentation: '/documentation',
        health: '/health',
      };
    }
  );

  // Register API routes with proper tags for documentation
  await fastify.register(pressureDropRoutes, { prefix: '/api/v1' });
  await fastify.register(npshRoutes, { prefix: '/api/v1' });
  await fastify.register(flowFittingsRoutes, { prefix: '/api/v1' });
  await fastify.register(pumpSystemCurveRoutes, { prefix: '/api/v1' });
  await fastify.register(npshRequiredRoutes, { prefix: '/api/v1' });
  await fastify.register(minorLossesRoutes);
  await fastify.register(pressureProfileRoutes);
  await fastify.register(operatePointRoutes);
  await fastify.register(cavitationRiskRoutes);
}
