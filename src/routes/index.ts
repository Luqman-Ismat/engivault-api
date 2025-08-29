import { FastifyInstance } from 'fastify';
// import pressureDropRoutes from './pressureDrop';
import operatePointRoutes from './operatePoint';
import pumpSystemCurveRoutes from './pumpSystemCurve';
// import npshRequiredRoutes from './npshRequired';
import npshRoutes from './npsh';
// import pressureProfileRoutes from './pressureProfile';
// import reliefRoutes from './relief';
// import cavitationRiskRoutes from './cavitationRisk';
import pumpRoutes from './pumps';
import valveRoutes from './valves';
import thermalRoutes from './thermal';
import gasRoutes from './gas';
import hxRoutes from './hx';
import hydraulicsRoutes from './hydraulics';
import networksRoutes from './networks';
import slurriesRoutes from './slurries';
import transientsRoutes from './transients';
import energyRoutes from './energy';
import operationsRoutes from './operations';
import dynamicsRoutes from './dynamics';
import curvesRoutes from './curves';
import flowFittingsRoutes from './flowFittings';
// import minorLossesRoutes from './minorLosses';
import runsRoutes from './runs';
import metricsRoutes from './metrics';
// import errorHelperDemoRoutes from './errorHelperDemo';

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
    },
    async () => {
      const memUsage = process.memoryUsage();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
        },
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
  // await fastify.register(pressureDropRoutes, { prefix: '/api/v1' });
  await fastify.register(npshRoutes, { prefix: '/api/v1' });
  await fastify.register(flowFittingsRoutes, { prefix: '/api/v1' });
  await fastify.register(pumpSystemCurveRoutes, { prefix: '/api/v1' });
  // await fastify.register(npshRequiredRoutes, { prefix: '/api/v1' });
  // await fastify.register(minorLossesRoutes);
  // await fastify.register(pressureProfileRoutes);
  await fastify.register(operatePointRoutes);
  // await fastify.register(cavitationRiskRoutes);
  await fastify.register(energyRoutes);
  await fastify.register(valveRoutes);
  await fastify.register(gasRoutes);
  await fastify.register(hxRoutes);
  await fastify.register(hydraulicsRoutes);
  await fastify.register(dynamicsRoutes);
  await fastify.register(flowFittingsRoutes);
  // await fastify.register(reliefRoutes);
  await fastify.register(networksRoutes);
  await fastify.register(transientsRoutes);
  await fastify.register(thermalRoutes);
  await fastify.register(slurriesRoutes);
  await fastify.register(operationsRoutes);
  await fastify.register(pumpRoutes);
  await fastify.register(runsRoutes);
  await fastify.register(curvesRoutes);
}
