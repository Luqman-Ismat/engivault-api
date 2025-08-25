import { FastifyInstance } from 'fastify';
import { calculatePressureDrop } from '../logic/pressureDrop';
import { pressureDropSchema, PressureDropInput } from '../schemas/validation';
import { handleError } from '../utils/errorHandler';
import { createFastifySchema } from '../utils/schemaConverter';

export default async function pressureDropRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: PressureDropInput }>(
    '/calculate/pressure-drop',
    {
      schema: {
        tags: ['Pressure Drop'],
        summary: 'Calculate pressure drop',
        description: 'Calculate pressure drop using Darcy-Weisbach equation',
        body: createFastifySchema(pressureDropSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              pressureDrop: { type: 'number' },
              reynoldsNumber: { type: 'number' },
              frictionFactor: { type: 'number' },
            },
            required: ['pressureDrop', 'reynoldsNumber', 'frictionFactor'],
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
        const inputs: PressureDropInput = request.body;
        const results = calculatePressureDrop(inputs);
        return reply.send(results);
      } catch (error) {
        handleError(error, reply);
      }
    }
  );
}
