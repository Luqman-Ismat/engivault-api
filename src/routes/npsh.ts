import { FastifyInstance } from 'fastify';
import { calculateNpsh } from '../logic/npsh';
import { npshSchema, NpshInput } from '../schemas/validation';
import { handleError } from '../utils/errorHandler';
import { createFastifySchema } from '../utils/schemaConverter';

export default async function npshRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: NpshInput }>(
    '/calculate/npsh',
    {
      schema: {
        tags: ['NPSH'],
        summary: 'Calculate NPSH Available',
        description: 'Calculate Net Positive Suction Head Available (NPSHa)',
        body: createFastifySchema(npshSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              npsha: { type: 'number' },
            },
            required: ['npsha'],
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
              details: { type: 'object' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const inputs: NpshInput = request.body;
        const results = calculateNpsh(inputs);
        return reply.send(results);
      } catch (error) {
        handleError(error, reply);
      }
    }
  );
}
