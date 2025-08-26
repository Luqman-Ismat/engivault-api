import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import { iterateViscosityAdjustedDrop, ViscosityAdjustedDropInput } from '@/logic/thermal';
import { handleError } from '@/utils/errorHandler';

const zFluidProperties = z.object({
  density: zQuantity,
  viscosity: zQuantity,
  referenceTemperature: zQuantity,
  viscosityTemperatureCoefficient: z.number().optional(),
});

const zViscosityAdjustedDropRequest = z.object({
  flowRate: zQuantity,
  length: zQuantity,
  diameter: zQuantity,
  roughness: zQuantity,
  fluid: zFluidProperties,
  inletTemperature: zQuantity,
  outletTemperature: zQuantity.optional(),
  maxIterations: z.number().min(1).max(1000).optional(),
  convergenceTolerance: z.number().min(1e-12).max(1e-3).optional(),
});

const zViscosityAdjustedDropResponse = z.object({
  inletTemperature: zQuantity,
  outletTemperature: zQuantity,
  averageTemperature: zQuantity,
  pressureDrop: zQuantity,
  pressureDropPercent: z.number(),
  inletViscosity: zQuantity,
  outletViscosity: zQuantity,
  averageViscosity: zQuantity,
  reynoldsNumber: z.number(),
  frictionFactor: z.number(),
  velocity: zQuantity,
  iterations: z.number(),
  converged: z.boolean(),
  warnings: z.array(z.string()),
  metadata: z.object({
    input: zViscosityAdjustedDropRequest,
    calculations: z.object({
      convergenceHistory: z.array(z.object({
        iteration: z.number(),
        pressureDrop: z.number(),
        averageTemperature: z.number(),
        averageViscosity: z.number(),
        reynoldsNumber: z.number(),
        frictionFactor: z.number(),
      })),
      finalTolerance: z.number(),
    }),
  }),
});

export default async function thermalRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/thermal/viscosity-adjusted-drop',
    {
      schema: {
        description: 'Calculate viscosity-adjusted pressure drop with temperature-dependent fluid properties',
        tags: ['Thermal'],
        body: {
          type: 'object',
          properties: {
            flowRate: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            length: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            diameter: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            roughness: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            fluid: {
              type: 'object',
              properties: {
                density: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                viscosity: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                referenceTemperature: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                viscosityTemperatureCoefficient: { type: 'number' },
              },
              required: ['density', 'viscosity', 'referenceTemperature'],
            },
            inletTemperature: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            outletTemperature: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            maxIterations: { type: 'number', minimum: 1, maximum: 1000 },
            convergenceTolerance: { type: 'number', minimum: 1e-12, maximum: 1e-3 },
          },
          required: ['flowRate', 'length', 'diameter', 'roughness', 'fluid', 'inletTemperature'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              inletTemperature: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              outletTemperature: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              averageTemperature: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              pressureDrop: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              pressureDropPercent: { type: 'number' },
              inletViscosity: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              outletViscosity: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              averageViscosity: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              reynoldsNumber: { type: 'number' },
              frictionFactor: { type: 'number' },
              velocity: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              iterations: { type: 'number' },
              converged: { type: 'boolean' },
              warnings: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                  calculations: {
                    type: 'object',
                    properties: {
                      convergenceHistory: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            iteration: { type: 'number' },
                            pressureDrop: { type: 'number' },
                            averageTemperature: { type: 'number' },
                            averageViscosity: { type: 'number' },
                            reynoldsNumber: { type: 'number' },
                            frictionFactor: { type: 'number' },
                          },
                          required: ['iteration', 'pressureDrop', 'averageTemperature', 'averageViscosity', 'reynoldsNumber', 'frictionFactor'],
                        },
                      },
                      finalTolerance: { type: 'number' },
                    },
                    required: ['convergenceHistory', 'finalTolerance'],
                  },
                },
                required: ['input', 'calculations'],
              },
            },
            required: ['inletTemperature', 'outletTemperature', 'averageTemperature', 'pressureDrop', 'pressureDropPercent', 'inletViscosity', 'outletViscosity', 'averageViscosity', 'reynoldsNumber', 'frictionFactor', 'velocity', 'iterations', 'converged', 'warnings', 'metadata'],
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
        const input = zViscosityAdjustedDropRequest.parse(request.body);
        
        // Validate flow parameters
        if (input.flowRate.value <= 0 || input.length.value <= 0 || input.diameter.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Flow rate, length, and diameter must be positive'
          });
        }
        
        if (input.roughness.value < 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Roughness must be non-negative'
          });
        }
        
        // Validate fluid properties
        if (input.fluid.density.value <= 0 || input.fluid.viscosity.value <= 0 || input.fluid.referenceTemperature.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'All fluid properties must be positive'
          });
        }
        
        // Validate temperatures
        if (input.inletTemperature.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Inlet temperature must be positive'
          });
        }
        
        if (input.outletTemperature && input.outletTemperature.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Outlet temperature must be positive if provided'
          });
        }
        
        // Validate temperature coefficient if provided
        if (input.fluid.viscosityTemperatureCoefficient !== undefined) {
          if (input.fluid.viscosityTemperatureCoefficient <= 0) {
            return reply.status(400).send({
              error: 'ValidationError',
              message: 'Viscosity temperature coefficient must be positive'
            });
          }
        }
        
        const result = iterateViscosityAdjustedDrop(input);
        
        return reply.send(result);
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
}
