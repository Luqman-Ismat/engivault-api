import { FastifyInstance } from 'fastify';
import { calculateNpshr } from '../logic/npsh';
import { npshrSchema, NpshrInput } from '../schemas/validation';
import { handleError } from '../utils/errorHandler';
import { createFastifySchema } from '../utils/schemaConverter';

export default async function npshrRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: NpshrInput }>(
    '/calculate/npsh-required',
    {
      schema: {
        tags: ['NPSH'],
        summary: 'Calculate NPSH Required',
        description:
          'Calculate Net Positive Suction Head Required (NPSHr) from curve data',
        body: createFastifySchema(npshrSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              npshr: { type: 'number' },
            },
            required: ['npshr'],
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
              details: { type: 'object' },
            },
          },
          422: {
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
        const { flowRate, npshrCurve } = request.body;
        const results = calculateNpshr(flowRate, npshrCurve);
        return reply.send(results);
      } catch (error) {
        handleError(error, reply);
      }
    }
  );
}
