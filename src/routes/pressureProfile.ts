import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity, zFluid } from '@/schemas/common';
import { computeProfile, validateSegments } from '@/logic/pressureProfile';
import { handleError } from '@/utils/errorHandler';

// Zod schemas for request body and response
const zPipelineSegment = z.object({
  length: zQuantity,
  diameter: zQuantity,
  roughness: zQuantity,
  elevationDelta: zQuantity,
  kLocal: z.array(z.number()).optional(),
  flow: zQuantity.optional(),
});

const zPressureNode = z.object({
  cumulativeLength: zQuantity,
  elevation: zQuantity,
  pressure: zQuantity,
});

const zPressureProfileRequest = z.object({
  segments: z.array(zPipelineSegment).min(1),
  fluid: zFluid,
});

const zPressureProfileResponse = z.object({
  nodes: z.array(zPressureNode),
  warnings: z.array(z.string()),
  totalPressureDrop: zQuantity,
  totalLength: zQuantity,
});

export default async function pressureProfileRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/hydraulics/pressure-profile',
    {
      schema: {
        description: 'Calculate pressure profile along pipeline segments',
        tags: ['Hydraulics'],
        body: {
          type: 'object',
          properties: {
            segments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  length: { type: 'object' },
                  diameter: { type: 'object' },
                  roughness: { type: 'object' },
                  elevationDelta: { type: 'object' },
                  kLocal: { 
                    type: 'array',
                    items: { type: 'number' }
                  },
                  flow: { type: 'object' },
                },
                required: ['length', 'diameter', 'roughness', 'elevationDelta'],
              },
              minItems: 1,
            },
            fluid: { type: 'object' },
          },
          required: ['segments', 'fluid'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              nodes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    cumulativeLength: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        unit: { type: 'string' },
                      },
                      required: ['value', 'unit'],
                    },
                    elevation: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        unit: { type: 'string' },
                      },
                      required: ['value', 'unit'],
                    },
                    pressure: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        unit: { type: 'string' },
                      },
                      required: ['value', 'unit'],
                    },
                  },
                  required: ['cumulativeLength', 'elevation', 'pressure'],
                },
              },
              warnings: {
                type: 'array',
                items: { type: 'string' },
              },
              totalPressureDrop: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['value', 'unit'],
              },
              totalLength: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['value', 'unit'],
              },
            },
            required: ['nodes', 'warnings', 'totalPressureDrop', 'totalLength'],
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
              details: { type: 'array' },
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
        const body = zPressureProfileRequest.parse(request.body);
        
        // Validate segments
        const validation = validateSegments(body.segments);
        if (!validation.isValid) {
          return reply.status(400).send({
            error: 'Invalid segments',
            code: 'VALIDATION_ERROR',
            details: validation.warnings,
          });
        }
        
        // Calculate pressure profile
        const result = computeProfile(body.segments, body.fluid);
        
        // Validate response
        const response = zPressureProfileResponse.parse(result);
        
        return reply.send(response);
      } catch (error) {
        handleError(error, reply);
      }
    }
  );
}
