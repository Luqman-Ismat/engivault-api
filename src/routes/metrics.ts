import { FastifyInstance } from 'fastify';
import { getMetrics } from '@/utils/metrics';

export default async function metricsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/metrics',
    {
      schema: {
        tags: ['Monitoring'],
        summary: 'Get Prometheus metrics',
        description: 'Returns Prometheus-formatted metrics for monitoring',
        response: {
          200: {
            type: 'string',
            description: 'Prometheus metrics in text format',
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const metrics = await getMetrics();

        reply.header(
          'Content-Type',
          'text/plain; version=0.0.4; charset=utf-8'
        );
        return reply.send(metrics);
      } catch (error) {
        request.log.error('Error generating metrics:', error);
        return reply.status(500).send({ error: 'Failed to generate metrics' });
      }
    }
  );
}
