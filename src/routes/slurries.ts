import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import { calculateSlurryHeadloss, SlurryFlowInput } from '@/logic/slurries';
import { handleError } from '@/utils/errorHandler';

const zParticleProperties = z.object({
  density: zQuantity,
  diameter: zQuantity,
  shape: z.enum(['spherical', 'angular', 'flat']).optional(),
});

const zSlurryProperties = z.object({
  carrierFluid: z.object({
    density: zQuantity,
    viscosity: zQuantity,
  }),
  particles: zParticleProperties,
  concentration: zQuantity,
  concentrationType: z.enum(['volume', 'weight']),
});

const zPipeGeometry = z.object({
  diameter: zQuantity,
  length: zQuantity,
  roughness: zQuantity,
});

const zSlurryFlowRequest = z.object({
  slurry: zSlurryProperties,
  pipe: zPipeGeometry,
  velocity: zQuantity,
});

const zSlurryFlowResponse = z.object({
  headloss: zQuantity,
  pressureDrop: zQuantity,
  frictionFactor: z.number(),
  relativeRoughness: z.number(),
  durandFactor: z.number(),
  froudeNumber: z.number(),
  concentrationEffect: z.number(),
  warnings: z.array(z.string()),
  metadata: z.object({
    input: zSlurryFlowRequest,
    calculations: z.object({
      reynoldsNumber: z.number(),
      carrierFrictionFactor: z.number(),
      settlingVelocity: z.number(),
      concentration: z.number(),
    }),
  }),
});

export default async function slurryRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/slurries/pressure-drop',
    {
      schema: {
        tags: ['Rheology'],
        summary: 'Calculate slurry pressure drop using Durand correlation',
        description: `Calculate pressure drop for slurry flow using Durand correlation with particle settling considerations.

**Correlations Used:**
- **Durand Correlation**: ΔP_slurry = ΔP_fluid × (1 + K × C_v × Fr^(-1.5))
  - K: Durand factor (typically 150-180)
  - C_v: Volume concentration
  - Fr: Froude number = V/√(gD)
- **Settling Velocity**: V_s = √[(4gD_p(ρ_p - ρ_f))/(3ρ_fC_d)]
- **Froude Number**: Fr = V/√(gD)
- **Concentration Effect**: C_effect = 1 + K × C_v × Fr^(-1.5)

**Validity Ranges:**
- Particle Diameter: 0.01 mm < D_p < 10 mm
- Volume Concentration: 0.01 < C_v < 0.3 (1-30%)
- Froude Number: 1 < Fr < 10
- Reynolds Number: 4,000 < Re < 10^6
- Particle Density: 1,000 kg/m³ < ρ_p < 8,000 kg/m³

**Flow Regimes:**
- **Homogeneous**: C_v < 0.01 (1%), particles well suspended
- **Heterogeneous**: 0.01 < C_v < 0.15, particles partially suspended
- **Dense Slurry**: C_v > 0.15, significant particle settling

**References:**
- Durand, R. (1953). "Basic relationships of the transportation of solids in pipes." Proc. Minnesota Int. Hydraulics Conv.
- Wilson, K.C. et al. (2006). "Slurry Transport Using Centrifugal Pumps" (3rd ed.). Springer

**Version:** 1.0.0`,
        body: {
          type: 'object',
          properties: {
            slurry: {
              type: 'object',
              properties: {
                carrierFluid: {
                  type: 'object',
                  properties: {
                    density: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        unit: { type: 'string' },
                      },
                      required: ['value', 'unit'],
                    },
                    viscosity: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        unit: { type: 'string' },
                      },
                      required: ['value', 'unit'],
                    },
                  },
                  required: ['density', 'viscosity'],
                },
                particles: {
                  type: 'object',
                  properties: {
                    density: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        unit: { type: 'string' },
                      },
                      required: ['value', 'unit'],
                    },
                    diameter: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        unit: { type: 'string' },
                      },
                      required: ['value', 'unit'],
                    },
                    shape: {
                      type: 'string',
                      enum: ['spherical', 'angular', 'flat'],
                    },
                  },
                  required: ['density', 'diameter'],
                },
                concentration: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
                concentrationType: {
                  type: 'string',
                  enum: ['volume', 'weight'],
                },
              },
              required: [
                'carrierFluid',
                'particles',
                'concentration',
                'concentrationType',
              ],
            },
            pipe: {
              type: 'object',
              properties: {
                diameter: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
                length: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
                roughness: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
              },
              required: ['diameter', 'length', 'roughness'],
            },
            velocity: {
              type: 'object',
              properties: {
                value: { type: 'number' },
                unit: { type: 'string' },
              },
              required: ['value', 'unit'],
            },
          },
          required: ['slurry', 'pipe', 'velocity'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              headloss: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['value', 'unit'],
              },
              pressureDrop: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['value', 'unit'],
              },
              frictionFactor: { type: 'number' },
              relativeRoughness: { type: 'number' },
              durandFactor: { type: 'number' },
              froudeNumber: { type: 'number' },
              concentrationEffect: { type: 'number' },
              warnings: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                  calculations: {
                    type: 'object',
                    properties: {
                      reynoldsNumber: { type: 'number' },
                      carrierFrictionFactor: { type: 'number' },
                      settlingVelocity: { type: 'number' },
                      concentration: { type: 'number' },
                    },
                    required: [
                      'reynoldsNumber',
                      'carrierFrictionFactor',
                      'settlingVelocity',
                      'concentration',
                    ],
                  },
                },
                required: ['input', 'calculations'],
              },
            },
            required: [
              'headloss',
              'pressureDrop',
              'frictionFactor',
              'relativeRoughness',
              'durandFactor',
              'froudeNumber',
              'concentrationEffect',
              'warnings',
              'metadata',
            ],
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
        const input = zSlurryFlowRequest.parse(request.body);

        // Validate particle density vs carrier fluid density
        const particleDensity = input.slurry.particles.density.value;
        const carrierDensity = input.slurry.carrierFluid.density.value;

        if (particleDensity <= carrierDensity) {
          return reply.status(400).send({
            error: 'ValidationError',
            message:
              'Particle density must be greater than carrier fluid density for settling',
          });
        }

        // Validate concentration range
        const concentration = input.slurry.concentration.value;
        if (concentration <= 0 || concentration >= 1) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Concentration must be between 0 and 1',
          });
        }

        // Validate velocity
        if (input.velocity.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Flow velocity must be positive',
          });
        }

        // Validate pipe geometry
        if (
          input.pipe.diameter.value <= 0 ||
          input.pipe.length.value <= 0 ||
          input.pipe.roughness.value < 0
        ) {
          return reply.status(400).send({
            error: 'ValidationError',
            message:
              'Pipe diameter and length must be positive, roughness must be non-negative',
          });
        }

        // Check particle-to-pipe diameter ratio
        const particleToPipeRatio =
          input.slurry.particles.diameter.value / input.pipe.diameter.value;
        if (particleToPipeRatio > 0.1) {
          return reply.status(400).send({
            error: 'ValidationError',
            message:
              'Particle diameter should be less than 10% of pipe diameter for Durand correlation',
          });
        }

        const result = calculateSlurryHeadloss(input);

        return reply.send(result);
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
}
