import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { calculateFittingPressureDrop } from '../logic/flowFittings';
import { flowFittingsSchema, FlowFittingsInput } from '../schemas/validation';
import { handleError } from '../utils/errorHandler';

export default async function flowFittingsRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post<{ Body: FlowFittingsInput }>(
    '/calculate/flow-fittings',
    {
      schema: {
        body: flowFittingsSchema,
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
