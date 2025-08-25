import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity, zFluid } from '@/schemas/common';
import { sumMinorLosses } from '@/logic/minorLosses';
import { convert } from '@/utils/units';
import { getFluidDefaults } from '@/props';

// Zod schema for minor loss fitting item
const zMinorLossItem = z.object({
  type: z.string().min(1, 'Fitting type is required'),
  count: z.number().positive('Count must be positive'),
  k: z.number().optional(),
  nominalSize: z.string().optional(),
  schedule: z.string().optional(),
});

// Zod schema for pipe configuration
const zPipe = z.object({
  diameter: zQuantity,
  roughness: zQuantity.optional(),
});

// Zod schema for velocity input
const zVelocityInput = z.object({
  velocity: zQuantity,
});

// Zod schema for flow input
const zFlowInput = z.object({
  flow: zQuantity,
  diameter: zQuantity,
});

// Zod schema for request body
const zMinorLossesRequest = z
  .object({
    fluid: zFluid,
    pipe: zPipe,
    fittings: z
      .array(zMinorLossItem)
      .min(1, 'At least one fitting is required'),
  })
  .and(z.union([zVelocityInput, zFlowInput]));

// Zod schema for response
const zMinorLossesResponse = z.object({
  deltaP: zQuantity,
  Keq: z.number(),
  warnings: z.array(z.string()),
});

export default async function minorLossesRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/hydraulics/minor-losses',
    {
      schema: {
        description: 'Calculate minor losses for pipe fittings',
        tags: ['hydraulics'],
        summary: 'Calculate pressure drop due to minor losses in pipe fittings',
        body: {
          type: 'object',
          properties: {
            fluid: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                temperature: { type: 'object' },
                density: { type: 'object' },
                viscosity: { type: 'object' },
              },
              required: ['name'],
            },
            pipe: {
              type: 'object',
              properties: {
                diameter: { type: 'object' },
                roughness: { type: 'object' },
              },
              required: ['diameter'],
            },
            fittings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  count: { type: 'number' },
                  k: { type: 'number' },
                  nominalSize: { type: 'string' },
                  schedule: { type: 'string' },
                },
                required: ['type', 'count'],
              },
            },
            velocity: { type: 'object' },
            flow: { type: 'object' },
            diameter: { type: 'object' },
          },
          required: ['fluid', 'pipe', 'fittings'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              deltaP: { type: 'object' },
              Keq: { type: 'number' },
              warnings: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Validate request body
        const body = zMinorLossesRequest.parse(request.body);
        const { fluid, pipe, fittings } = body;

        // Get fluid properties
        let rho: number;
        let temperature: number;

        if (fluid.temperature) {
          // Convert temperature to Kelvin
          const tempKelvin = convert(
            fluid.temperature.value,
            fluid.temperature.unit,
            'K'
          );
          temperature = tempKelvin.value;
        } else {
          temperature = 293.15; // Default to 20°C
        }

        if (fluid.density) {
          // Use provided density
          const densitySI = convert(
            fluid.density.value,
            fluid.density.unit,
            'kg/m³'
          );
          rho = densitySI.value;
        } else {
          // Get density from fluid properties
          const fluidProps = getFluidDefaults(fluid.name, temperature);
          rho = fluidProps.density.value;
        }

        // Convert pipe diameter to SI units
        const diameterSI = convert(
          pipe.diameter.value,
          pipe.diameter.unit,
          'm'
        );
        const D = diameterSI.value;

        // Calculate velocity
        let velocity: number;

        if ('velocity' in body) {
          // Use provided velocity
          const velocitySI = convert(
            body.velocity.value,
            body.velocity.unit,
            'm/s'
          );
          velocity = velocitySI.value;
        } else if ('flow' in body && 'diameter' in body) {
          // Calculate velocity from flow rate
          const flowSI = convert(body.flow.value, body.flow.unit, 'm³/s');
          const flowDiameterSI = convert(
            body.diameter.value,
            body.diameter.unit,
            'm'
          );

          const area = Math.PI * (flowDiameterSI.value / 2) ** 2;
          velocity = flowSI.value / area;
        } else {
          throw new Error('Either velocity or flow+diameter must be provided');
        }

        // Calculate minor losses
        const result = sumMinorLosses({
          items: fittings,
          rho,
          v: velocity,
          D,
        });

        // Convert pressure drop to requested units (default to Pa)
        const deltaPQuantity = {
          value: result.deltaP,
          unit: 'Pa',
        };

        // Prepare response
        const response = {
          deltaP: deltaPQuantity,
          Keq: result.Keq,
          warnings: result.warnings,
        };

        // Validate response
        zMinorLossesResponse.parse(response);

        return reply.send(response);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: 'Validation error',
            details: error.errors,
          });
        }

        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Additional route to get available K-factors
  fastify.get(
    '/api/v1/hydraulics/k-factors',
    {
      schema: {
        description: 'Get available K-factors',
        tags: ['hydraulics'],
        summary:
          'Get list of available K-factors for minor losses calculations',
        querystring: {
          type: 'object',
          properties: {
            nominalSize: { type: 'string' },
            schedule: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              kFactors: {
                type: 'object',
                additionalProperties: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    description: { type: 'string' },
                    k: { type: 'number' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { nominalSize, schedule } = request.query as {
          nominalSize?: string;
          schedule?: string;
        };

        if (nominalSize && schedule) {
          // Get K-factors for specific size and schedule
          const { getKFactorsForSize } = await import('@/data/k-factors');
          const kFactors = getKFactorsForSize(nominalSize, schedule);

          return reply.send({ kFactors });
        } else {
          // Get all generic K-factors
          const { GENERIC_K_FACTORS } = await import('@/data/k-factors');

          return reply.send({ kFactors: GENERIC_K_FACTORS });
        }
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  // Route to get available fitting types
  fastify.get(
    '/api/v1/hydraulics/fitting-types',
    {
      schema: {
        description: 'Get available fitting types',
        tags: ['hydraulics'],
        summary:
          'Get list of available fitting types for minor losses calculations',
        response: {
          200: {
            type: 'object',
            properties: {
              fittingTypes: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { getAvailableFittingTypes } = await import('@/data/k-factors');
        const fittingTypes = getAvailableFittingTypes();

        return reply.send({ fittingTypes });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );
}
