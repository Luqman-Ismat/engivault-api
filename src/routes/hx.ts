import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import { hxPressureDrop, HXPressureDropInput } from '@/logic/hx';
import { handleError } from '@/utils/errorHandler';

const zHXGeometry = z.object({
  tubeDiameter: zQuantity,
  tubeLength: zQuantity,
  numberOfTubes: z.number().positive(),
  tubePitch: zQuantity,
  tubeThickness: zQuantity,
  shellDiameter: zQuantity,
  baffleSpacing: zQuantity,
  baffleCut: z.number().min(0).max(100),
  tubeLayout: z.enum(['triangular', 'square', 'rotated-square']),
});

const zFluidProperties = z.object({
  density: zQuantity,
  viscosity: zQuantity,
});

const zHXPressureDropRequest = z.object({
  geometry: zHXGeometry,
  passes: z.number().positive(),
  massFlux: zQuantity,
  fluidSide: z.enum(['tube', 'shell']),
  fluidProperties: zFluidProperties,
  roughness: zQuantity.optional(),
});

const zHXPressureDropResponse = z.object({
  pressureDrop: zQuantity,
  pressureDropPercent: z.number(),
  velocity: zQuantity,
  reynoldsNumber: z.number(),
  frictionFactor: z.number(),
  flowArea: zQuantity,
  equivalentDiameter: zQuantity,
  flowLength: zQuantity,
  numberOfCrossings: z.number(),
  baffleSpacing: zQuantity,
  warnings: z.array(z.string()),
  metadata: z.object({
    input: zHXPressureDropRequest,
    calculations: z.object({
      correlation: z.string(),
      flowRegime: z.enum(['laminar', 'turbulent', 'transition']),
      parameters: z.record(z.number()),
    }),
  }),
});

export default async function hxRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/thermal/hx-drop',
    {
      schema: {
        description: 'Calculate heat exchanger pressure drop using standard correlations',
        tags: ['Thermal'],
        body: {
          type: 'object',
          properties: {
            geometry: {
              type: 'object',
              properties: {
                tubeDiameter: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                tubeLength: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                numberOfTubes: { type: 'number', minimum: 1 },
                tubePitch: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                tubeThickness: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                shellDiameter: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                baffleSpacing: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                baffleCut: { type: 'number', minimum: 0, maximum: 100 },
                tubeLayout: { type: 'string', enum: ['triangular', 'square', 'rotated-square'] },
              },
              required: ['tubeDiameter', 'tubeLength', 'numberOfTubes', 'tubePitch', 'tubeThickness', 'shellDiameter', 'baffleSpacing', 'baffleCut', 'tubeLayout'],
            },
            passes: { type: 'number', minimum: 1 },
            massFlux: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            fluidSide: { type: 'string', enum: ['tube', 'shell'] },
            fluidProperties: {
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
              },
              required: ['density', 'viscosity'],
            },
            roughness: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
          },
          required: ['geometry', 'passes', 'massFlux', 'fluidSide', 'fluidProperties'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              pressureDrop: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              pressureDropPercent: { type: 'number' },
              velocity: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              reynoldsNumber: { type: 'number' },
              frictionFactor: { type: 'number' },
              flowArea: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              equivalentDiameter: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              flowLength: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              numberOfCrossings: { type: 'number' },
              baffleSpacing: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              warnings: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                  calculations: {
                    type: 'object',
                    properties: {
                      correlation: { type: 'string' },
                      flowRegime: { type: 'string', enum: ['laminar', 'turbulent', 'transition'] },
                      parameters: { 
                        type: 'object',
                        properties: {
                          relativeRoughness: { type: 'number' },
                          returnBendEquivalentLength: { type: 'number' },
                          totalLength: { type: 'number' },
                          singleTubeLength: { type: 'number' },
                          numberOfPasses: { type: 'number' },
                          bundleDiameter: { type: 'number' },
                          tubeOuterDiameter: { type: 'number' },
                          clearance: { type: 'number' },
                          crossFlowArea: { type: 'number' },
                          windowPressureDrop: { type: 'number' },
                          entranceExitPressureDrop: { type: 'number' },
                          crossFlowPressureDrop: { type: 'number' }
                        }
                      },
                    },
                    required: ['correlation', 'flowRegime', 'parameters'],
                  },
                },
                required: ['input', 'calculations'],
              },
            },
            required: ['pressureDrop', 'pressureDropPercent', 'velocity', 'reynoldsNumber', 'frictionFactor', 'flowArea', 'equivalentDiameter', 'flowLength', 'numberOfCrossings', 'baffleSpacing', 'warnings', 'metadata'],
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
        const input = zHXPressureDropRequest.parse(request.body);
        
        // Validate geometry parameters
        if (input.geometry.tubeDiameter.value <= 0 || input.geometry.tubeLength.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Tube diameter and length must be positive'
          });
        }
        
        if (input.geometry.shellDiameter.value <= 0 || input.geometry.baffleSpacing.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Shell diameter and baffle spacing must be positive'
          });
        }
        
        if (input.geometry.tubePitch.value <= 0 || input.geometry.tubeThickness.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Tube pitch and thickness must be positive'
          });
        }
        
        // Validate tube pitch vs diameter
        const tubeOuterDiameter = input.geometry.tubeDiameter.value + 2 * input.geometry.tubeThickness.value;
        if (input.geometry.tubePitch.value <= tubeOuterDiameter) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Tube pitch must be greater than tube outer diameter'
          });
        }
        
        // Validate shell diameter vs tube bundle
        const bundleDiameter = input.geometry.shellDiameter.value - 0.025; // Typical clearance
        if (bundleDiameter <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Shell diameter must be large enough for tube bundle'
          });
        }
        
        // Validate fluid properties
        if (input.fluidProperties.density.value <= 0 || input.fluidProperties.viscosity.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Fluid density and viscosity must be positive'
          });
        }
        
        // Validate mass flux
        if (input.massFlux.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Mass flux must be positive'
          });
        }
        
        // Validate roughness if provided
        if (input.roughness && input.roughness.value < 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Roughness must be non-negative'
          });
        }
        
        const result = hxPressureDrop(input);
        
        return reply.send(result);
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
}
