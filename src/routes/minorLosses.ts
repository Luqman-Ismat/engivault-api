import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity, zFluid } from '@/schemas/common';
import { sumMinorLosses } from '@/logic/minorLosses';
import { convert } from '@/utils/units';
import { getFluidDefaults } from '@/props';
import { handleError } from '@/utils/errorHandler';

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
const zMinorLossesRequest = z.object({
  fluid: zFluid,
  pipe: zPipe,
  fittings: z
    .array(zMinorLossItem)
    .min(1, 'At least one fitting is required'),
  velocity: zQuantity.optional(),
  flow: zQuantity.optional(),
  diameter: zQuantity.optional(),
});

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
        body: zMinorLossesRequest,
        response: {
          200: zMinorLossesResponse,
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
          const tempKelvin = convert(fluid.temperature, 'K');
          temperature = tempKelvin.value;
        } else {
          temperature = 293.15; // Default to 20°C
        }

        if (fluid.density) {
          // Use provided density
          const densitySI = convert(fluid.density, 'kg/m³');
          rho = densitySI.value;
        } else {
          // Get density from fluid properties
          if (!fluid.name) {
            throw new Error(
              'Fluid name is required when density is not provided'
            );
          }
          const fluidProps = getFluidDefaults(fluid.name, temperature);
          rho = fluidProps.density.value;
        }

        // Convert pipe diameter to SI units
        const diameterSI = convert(pipe.diameter, 'm');
        const D = diameterSI.value;

        // Calculate velocity
        let velocity: number;

        if ('velocity' in body) {
          // Use provided velocity
          const velocitySI = convert(body.velocity, 'm/s');
          velocity = velocitySI.value;
        } else if ('flow' in body && 'diameter' in body) {
          // Calculate velocity from flow rate
          const flowSI = convert(body.flow, 'm³/s');
          const flowDiameterSI = convert(body.diameter, 'm');

          const area = Math.PI * (flowDiameterSI.value / 2) ** 2;
          velocity = flowSI.value / area;
        } else {
          throw new Error('Either velocity or flow+diameter must be provided');
        }

        // Convert fittings to proper MinorLossItem format
        const minorLossItems = fittings.map(fitting => ({
          type: fitting.type,
          count: fitting.count,
          ...(fitting.k !== undefined && { k: fitting.k }),
          ...(fitting.nominalSize !== undefined && {
            nominalSize: fitting.nominalSize,
          }),
          ...(fitting.schedule !== undefined && { schedule: fitting.schedule }),
        }));

        // Calculate minor losses
        const result = sumMinorLosses({
          items: minorLossItems,
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
        handleError(error, reply);
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
        handleError(error, reply);
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
    async (_request, reply) => {
      try {
        const { getAvailableFittingTypes } = await import('@/data/k-factors');
        const fittingTypes = getAvailableFittingTypes();

        return reply.send({ fittingTypes });
      } catch (error) {
        handleError(error, reply);
      }
    }
  );
}
