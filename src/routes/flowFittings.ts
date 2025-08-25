import { FastifyInstance } from 'fastify';
import { calculateFittingPressureDrop } from '../logic/flowFittings';
import { flowFittingsSchema, FlowFittingsInput } from '../schemas/validation';
import { handleError } from '../utils/errorHandler';
import { createFastifySchema } from '../utils/schemaConverter';

export default async function flowFittingsRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: FlowFittingsInput }>(
    '/calculate/flow-fittings',
    {
      schema: {
        tags: ['Flow Fittings'],
        summary: 'Calculate flow fitting pressure drop',
        description:
          'Calculate pressure drop across flow fittings using K-factor method',
        body: createFastifySchema(flowFittingsSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              pressureDrop: { type: 'number' },
            },
            required: ['pressureDrop'],
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
        const inputs: FlowFittingsInput = request.body;
        const results = calculateFittingPressureDrop(inputs);
        return reply.send(results);
      } catch (error) {
        handleError(error, reply);
      }
    }
  );
}
