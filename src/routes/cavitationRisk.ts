import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import { calculateCavitationRisk, validateNPSHInputs, resolveAtmosphericPressure } from '@/logic/npsh';
import { handleError } from '@/utils/errorHandler';

const zNPSHCurvePoint = z.object({
  q: z.number().min(0),
  npshr: z.number().min(0),
});

const zNPSHCurve = z.object({
  points: z.array(zNPSHCurvePoint).min(1),
  name: z.string().optional(),
});

const zCavitationRiskRequest = z.object({
  atmosphericPressure: zQuantity.optional(),
  vaporPressure: zQuantity.optional(),
  staticHead: zQuantity,
  losses: zQuantity,
  flowRate: zQuantity,
  npshCurve: zNPSHCurve,
  altitude: z.number().min(0).optional(),
  temperature: zQuantity.optional(),
  fluidName: z.string().optional(),
});

const zCavitationRiskResponse = z.object({
  npshAvailable: zQuantity,
  npshRequired: zQuantity,
  cavitationMargin: zQuantity,
  warnings: z.array(z.string()),
  metadata: z.object({
    atmosphericPressure: zQuantity,
    vaporPressure: zQuantity,
    staticHead: zQuantity,
    losses: zQuantity,
    flowRate: zQuantity,
    altitude: z.number().optional(),
    temperature: zQuantity,
  }),
});

export default async function cavitationRiskRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/pumps/cavitation-risk',
    {
      schema: {
        description: 'Calculate cavitation risk analysis for pump system',
        tags: ['Pumps'],
        body: {
          type: 'object',
          properties: {
            atmosphericPressure: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            vaporPressure: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            staticHead: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            losses: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            flowRate: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            npshCurve: {
              type: 'object',
              properties: {
                points: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      q: { type: 'number', minimum: 0 },
                      npshr: { type: 'number', minimum: 0 },
                    },
                    required: ['q', 'npshr'],
                  },
                  minItems: 1,
                },
                name: { type: 'string' },
              },
              required: ['points'],
            },
            altitude: { type: 'number', minimum: 0 },
            temperature: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            fluidName: { type: 'string' },
          },
          required: ['staticHead', 'losses', 'flowRate', 'npshCurve'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              npshAvailable: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              npshRequired: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              cavitationMargin: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              warnings: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  atmosphericPressure: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                  vaporPressure: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                  staticHead: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                  losses: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                  flowRate: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                  altitude: { type: 'number' },
                  temperature: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                },
                required: ['atmosphericPressure', 'vaporPressure', 'staticHead', 'losses', 'flowRate', 'temperature'],
              },
            },
            required: ['npshAvailable', 'npshRequired', 'cavitationMargin', 'warnings', 'metadata'],
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
        const body = zCavitationRiskRequest.parse(request.body);
        
        // Resolve atmospheric pressure from altitude if not provided
        const resolvedInput = resolveAtmosphericPressure(body);
        
        // Validate inputs
        const validation = validateNPSHInputs(resolvedInput);
        
        if (!validation.isValid) {
          return reply.status(400).send({
            error: 'Invalid input parameters',
            code: 'VALIDATION_ERROR',
            details: validation.errors,
          });
        }

        // Calculate cavitation risk
        const result = calculateCavitationRisk(resolvedInput);

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

  // GET endpoint to list supported fluids and their properties
  fastify.get(
    '/api/v1/pumps/fluids',
    {
      schema: {
        description: 'Get supported fluids for NPSH calculations',
        tags: ['Pumps'],
        response: {
          200: {
            type: 'object',
            properties: {
              fluids: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    vaporPressureMethod: { type: 'string' },
                    temperatureRange: { type: 'string' },
                  },
                  required: ['name', 'description', 'vaporPressureMethod', 'temperatureRange'],
                },
              },
            },
            required: ['fluids'],
          },
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        fluids: [
          {
            name: 'water',
            description: 'Water with automatic vapor pressure calculation',
            vaporPressureMethod: 'Antoine equation (0-100°C)',
            temperatureRange: '273-373 K (0-100°C)',
          },
          {
            name: 'air',
            description: 'Air (requires manual vapor pressure input)',
            vaporPressureMethod: 'Manual input required',
            temperatureRange: 'N/A',
          },
        ],
      });
    }
  );
}
