import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import { joukowskySurge, JoukowskyInput } from '@/logic/transients';
import { handleError } from '@/utils/errorHandler';

const zFluidProperties = z.object({
  density: zQuantity,
  bulkModulus: zQuantity.optional(),
});

const zPipeProperties = z.object({
  elasticModulus: zQuantity.optional(),
  wallThickness: zQuantity.optional(),
  diameter: zQuantity.optional(),
  waveSpeed: zQuantity.optional(),
});

const zJoukowskyRequest = z.object({
  fluid: zFluidProperties,
  pipe: zPipeProperties,
  velocityChange: zQuantity,
  pipeRating: zQuantity.optional(),
});

const zJoukowskyResponse = z.object({
  pressureSurge: zQuantity,
  waveSpeed: zQuantity,
  comparison: z.object({
    pipeRating: zQuantity,
    safetyFactor: z.number(),
    isWithinRating: z.boolean(),
  }).optional(),
  warnings: z.array(z.string()),
  metadata: z.object({
    input: zJoukowskyRequest,
    calculations: z.object({
      fluidDensity: z.number(),
      velocityChange: z.number(),
      waveSpeed: z.number(),
    }),
  }),
});

export default async function transientRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/transients/joukowsky',
    {
      schema: {
        description: 'Calculate pressure surge using Joukowsky equation',
        tags: ['Transients'],
        body: {
          type: 'object',
          properties: {
            fluid: {
              type: 'object',
              properties: {
                density: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                bulkModulus: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
              },
              required: ['density'],
            },
            pipe: {
              type: 'object',
              properties: {
                elasticModulus: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                wallThickness: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                diameter: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                waveSpeed: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
              },
            },
            velocityChange: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            pipeRating: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
          },
          required: ['fluid', 'pipe', 'velocityChange'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              pressureSurge: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              waveSpeed: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              comparison: {
                type: 'object',
                properties: {
                  pipeRating: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                  safetyFactor: { type: 'number' },
                  isWithinRating: { type: 'boolean' },
                },
                required: ['pipeRating', 'safetyFactor', 'isWithinRating'],
              },
              warnings: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                  calculations: {
                    type: 'object',
                    properties: {
                      fluidDensity: { type: 'number' },
                      velocityChange: { type: 'number' },
                      waveSpeed: { type: 'number' },
                    },
                    required: ['fluidDensity', 'velocityChange', 'waveSpeed'],
                  },
                },
                required: ['input', 'calculations'],
              },
            },
            required: ['pressureSurge', 'waveSpeed', 'warnings', 'metadata'],
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
            required: ['error', 'message'],
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
            required: ['error', 'message'],
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const input = zJoukowskyRequest.parse(request.body);
        
        // Validate that either wave speed or complete pipe properties are provided
        const hasWaveSpeed = !!input.pipe.waveSpeed;
        const hasCompletePipeProps = !!(input.pipe.elasticModulus && input.pipe.wallThickness && input.pipe.diameter);
        
        if (!hasWaveSpeed && !hasCompletePipeProps) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Either wave speed or complete pipe properties (elastic modulus, wall thickness, diameter) must be provided'
          });
        }
        
        // Validate pipe properties if provided
        if (input.pipe.diameter && input.pipe.wallThickness) {
          const diameter = input.pipe.diameter.value;
          const wallThickness = input.pipe.wallThickness.value;
          
          if (wallThickness >= diameter / 2) {
            return reply.status(400).send({
              error: 'ValidationError',
              message: 'Wall thickness must be less than pipe radius'
            });
          }
        }
        
        const result = joukowskySurge(input);
        
        return reply.send(result);
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
}
