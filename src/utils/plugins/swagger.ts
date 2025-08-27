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
        { name: 'Pressure Drop', description: 'Pressure drop calculations' },
        { name: 'NPSH', description: 'Net Positive Suction Head calculations' },
        { name: 'Flow Fittings', description: 'Flow fitting pressure drop calculations' },
        { name: 'Pump System Curve', description: 'Pump system curve analysis' },
        { name: 'Minor Losses', description: 'Minor losses calculations' },
        { name: 'Pressure Profile', description: 'Pressure profile analysis' },
        { name: 'Operating Point', description: 'Operating point calculations' },
        { name: 'Cavitation Risk', description: 'Cavitation risk assessment' },
        { name: 'Energy', description: 'Energy calculations' },
        { name: 'Valves', description: 'Valve calculations' },
        { name: 'Networks', description: 'Network analysis using Hardy Cross method' },
        { name: 'Transients', description: 'Transient analysis using Joukowsky equation' },
        { name: 'Dynamics', description: 'Dynamic system analysis' },
        { name: 'Slurries', description: 'Slurry flow calculations' },
        { name: 'Gas', description: 'Gas flow calculations' },
        { name: 'Thermal', description: 'Thermal calculations' },
        { name: 'Heat Exchangers', description: 'Heat exchanger calculations' },
        { name: 'Hydraulics', description: 'Hydraulic calculations' },
        { name: 'Pumps', description: 'Pump calculations and analysis' },
        { name: 'Operations', description: 'Operational calculations' },
        { name: 'Runs', description: 'Calculation transcript management' },
        { name: 'Curves', description: 'Pump curve fitting and analysis' },
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
