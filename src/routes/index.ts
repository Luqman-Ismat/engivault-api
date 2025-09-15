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

// SaaS Authentication and Analytics routes
import authRoutes from './auth';
import analyticsRoutes from './analytics';

// Materials Database routes
import materialsRoutes from './materials';

// Project Management routes
import projectsRoutes from './projects';
import tasksRoutes from './tasks';

// Knowledge Base routes
// import knowledgeRoutes from './knowledge'; // Temporarily disabled

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

  // Register SaaS Authentication and Analytics routes (no prefix needed)
  await fastify.register(authRoutes);
  await fastify.register(analyticsRoutes);
  
  // Register Materials Database routes (no prefix needed)
  await fastify.register(materialsRoutes);
  
  // Register Project Management routes (no prefix needed)
  await fastify.register(projectsRoutes);
  await fastify.register(tasksRoutes);

  // Register Knowledge Base routes (no prefix needed)
  // await fastify.register(knowledgeRoutes); // Temporarily disabled

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
  await fastify.register(operationsRoutes);
  await fastify.register(pumpRoutes);
  await fastify.register(runsRoutes);
  await fastify.register(curvesRoutes);
}
