import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { calculateOperatingPoint } from '../logic/pumpSystemCurve';
import { pumpSystemCurveSchema, PumpSystemCurveInput } from '../schemas/validation';
import { handleError } from '../utils/errorHandler';

export default async function pumpSystemCurveRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.post<{ Body: PumpSystemCurveInput }>(
    '/calculate/pump-system-curve',
    {
      schema: {
        body: pumpSystemCurveSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              flow: { type: 'number' },
              head: { type: 'number' },
            },
            required: ['flow', 'head'],
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
        const { pumpCurve, systemCurve } = request.body;

        // Construct the system curve equation function
        const systemCurveEquation = (flow: number): number => {
          return systemCurve.staticHead + systemCurve.resistanceCoefficient * Math.pow(flow, 2);
        };

        const operatingPoint = calculateOperatingPoint(pumpCurve, systemCurveEquation);
        return reply.send(operatingPoint);
      } catch (error) {
        handleError(error, reply);
      }
    }
  );
}
