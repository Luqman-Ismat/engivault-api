import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import {
  calculateOperatingPoint,
  validateOperatingPointInputs,
} from '@/logic/operatePoint';
import { handleError } from '@/utils/errorHandler';

const zPumpCurvePoint = z.object({
  q: z.number().min(0),
  h: z.number().min(0),
});

const zPumpData = z.object({
  id: z.string(),
  curve: z.array(zPumpCurvePoint).min(2),
  speed: z.number().positive().optional(),
});

const zSystemData = z.object({
  staticHead: z.number().min(0),
  k: z.number().min(0),
  polynomial: z.array(z.number()).optional(),
});

const zOperatingPointRequest = z.object({
  pumps: z.array(zPumpData).min(1),
  arrangement: z.enum(['single', 'parallel', 'series']),
  system: zSystemData,
  speed: z.number().positive().optional(),
});

const zOperatingPointResponse = z.object({
  flow: zQuantity,
  head: zQuantity,
  pumpHead: zQuantity,
  systemHead: zQuantity,
  meta: z.object({
    iterations: z.number(),
    residual: z.number(),
    convergence: z.boolean(),
    method: z.string(),
  }),
  warnings: z.array(z.string()),
});

export default async function operatePointRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/pumps/operate',
    {
      schema: {
        description:
          'Calculate pump operating point for given arrangement and system',
        tags: ['Pumps'],
        body: {
          type: 'object',
          properties: {
            pumps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  curve: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        q: { type: 'number', minimum: 0 },
                        h: { type: 'number', minimum: 0 },
                      },
                      required: ['q', 'h'],
                    },
                    minItems: 2,
                  },
                  speed: { type: 'number', minimum: 0 },
                },
                required: ['id', 'curve'],
              },
              minItems: 1,
            },
            arrangement: {
              type: 'string',
              enum: ['single', 'parallel', 'series'],
            },
            system: {
              type: 'object',
              properties: {
                staticHead: { type: 'number', minimum: 0 },
                k: { type: 'number', minimum: 0 },
                polynomial: {
                  type: 'array',
                  items: { type: 'number' },
                },
              },
              required: ['staticHead', 'k'],
            },
            speed: { type: 'number', minimum: 0 },
          },
          required: ['pumps', 'arrangement', 'system'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              flow: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['value', 'unit'],
              },
              head: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['value', 'unit'],
              },
              pumpHead: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['value', 'unit'],
              },
              systemHead: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['value', 'unit'],
              },
              meta: {
                type: 'object',
                properties: {
                  iterations: { type: 'number' },
                  residual: { type: 'number' },
                  convergence: { type: 'boolean' },
                  method: { type: 'string' },
                },
                required: ['iterations', 'residual', 'convergence', 'method'],
              },
              warnings: { type: 'array', items: { type: 'string' } },
            },
            required: [
              'flow',
              'head',
              'pumpHead',
              'systemHead',
              'meta',
              'warnings',
            ],
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
              details: { type: 'array', items: { type: 'string' } },
            },
            required: ['error', 'code'],
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
            },
            required: ['error', 'code'],
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = zOperatingPointRequest.parse(request.body);

        // Validate inputs
        const validation = validateOperatingPointInputs(
          body.pumps,
          body.arrangement,
          body.system
        );

        if (!validation.isValid) {
          return reply.status(400).send({
            error: 'Invalid input parameters',
            code: 'VALIDATION_ERROR',
            details: validation.errors,
          });
        }

        // Calculate operating point
        const result = calculateOperatingPoint(
          body.pumps,
          body.arrangement,
          body.system,
          body.speed || 1
        );

        // Convert warnings to strings for API response
        const stringWarnings = result.warnings.map(warning =>
          typeof warning === 'string' ? warning : warning.message
        );

        const response = {
          ...result,
          warnings: stringWarnings,
        };

        return reply.send(response);
      } catch (error) {
        handleError(error, reply);
      }
    }
  );

  // GET endpoint to list supported arrangements
  fastify.get(
    '/api/v1/pumps/arrangements',
    {
      schema: {
        description: 'Get supported pump arrangements',
        tags: ['Pumps'],
        response: {
          200: {
            type: 'object',
            properties: {
              arrangements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    description: { type: 'string' },
                    characteristics: { type: 'string' },
                  },
                  required: ['type', 'description', 'characteristics'],
                },
              },
            },
            required: ['arrangements'],
          },
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        arrangements: [
          {
            type: 'single',
            description: 'Single pump operation',
            characteristics: 'Uses the first pump curve only',
          },
          {
            type: 'parallel',
            description: 'Pumps in parallel',
            characteristics:
              'Same head, flows add up (Q_total = Q1 + Q2 + ...)',
          },
          {
            type: 'series',
            description: 'Pumps in series',
            characteristics:
              'Same flow, heads add up (H_total = H1 + H2 + ...)',
          },
        ],
      });
    }
  );
}
