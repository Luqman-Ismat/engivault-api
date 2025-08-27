import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from '@/config/environment';

export async function registerSwagger(fastify: FastifyInstance): Promise<void> {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'EngiVault API',
        description: 'Engineering calculations API for fluid dynamics and pump systems',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://${config.HOST}:${config.PORT}`,
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'Health', description: 'Health check and monitoring endpoints' },
        { name: 'Monitoring', description: 'Prometheus metrics and system monitoring' },
        { name: 'Hydraulics', description: 'Hydraulic calculations including pressure drop, friction factors, and flow analysis' },
        { name: 'Pumps', description: 'Pump performance analysis, NPSH calculations, and operating point determination' },
        { name: 'Valves', description: 'Valve sizing, flow coefficients, and pressure drop calculations' },
        { name: 'Networks', description: 'Pipe network analysis using Hardy Cross method and flow distribution' },
        { name: 'Gas', description: 'Compressible gas flow calculations including isothermal/adiabatic flow and Fanno/Rayleigh lines' },
        { name: 'Thermal', description: 'Thermal calculations including heat transfer and temperature-dependent properties' },
        { name: 'Safety', description: 'Safety-related calculations including relief valve sizing and cavitation risk assessment' },
        { name: 'Rheology', description: 'Non-Newtonian fluid flow and slurry transport calculations' },
        { name: 'Operations', description: 'Operational calculations including fill/drain times and batch processing' },
        { name: 'Utilities', description: 'Utility functions including curve fitting and calculation transcripts' },
      ],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (_request, _reply, next) {
        next();
      },
      preHandler: function (_request, _reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, _request, _reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });
}
