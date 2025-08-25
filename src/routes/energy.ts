import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import { calculatePumpEnergy, validateEnergyInputs } from '@/logic/energy';
import { handleError } from '@/utils/errorHandler';

const zLoadProfilePoint = z.object({
  hours: z.number().positive(),
  Qset: zQuantity,
  speed: z.number().min(0).max(1).optional(),
});

const zEnergyTariff = z.object({
  rate: z.number().positive(),
  name: z.string().optional(),
  description: z.string().optional(),
});

const zEnergyRequest = z.object({
  fluid: z.object({
    density: zQuantity,
    name: z.string().optional(),
  }),
  pumpEfficiency: z.number().min(0).max(1),
  motorEfficiency: z.number().min(0).max(1),
  vfdEfficiency: z.number().min(0).max(1).optional(),
  loadProfile: z.array(zLoadProfilePoint).min(1),
  tariff: zEnergyTariff,
  head: zQuantity,
});

const zEnergyResponse = z.object({
  totalEnergy: zQuantity,
  totalCost: zQuantity,
  averagePower: zQuantity,
  loadProfile: z.array(z.object({
    hours: z.number(),
    Qset: zQuantity,
    speed: z.number().optional(),
    power: zQuantity,
    energy: zQuantity,
    cost: zQuantity,
  })),
  efficiency: z.object({
    averagePumpEfficiency: z.number(),
    averageMotorEfficiency: z.number(),
    averageVfdEfficiency: z.number().optional(),
    averageTotalEfficiency: z.number(),
  }),
  warnings: z.array(z.string()),
  metadata: z.object({
    tariff: zEnergyTariff,
    totalHours: z.number(),
    operatingPoints: z.number(),
  }),
});

export default async function energyRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/pumps/energy',
    {
      schema: {
        description: 'Calculate annual energy consumption and cost for pump system',
        tags: ['Pumps'],
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
                name: { type: 'string' },
              },
              required: ['density'],
            },
            pumpEfficiency: { type: 'number', minimum: 0, maximum: 1 },
            motorEfficiency: { type: 'number', minimum: 0, maximum: 1 },
            vfdEfficiency: { type: 'number', minimum: 0, maximum: 1 },
            loadProfile: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  hours: { type: 'number', minimum: 0 },
                  Qset: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                  speed: { type: 'number', minimum: 0, maximum: 1 },
                },
                required: ['hours', 'Qset'],
              },
              minItems: 1,
            },
            tariff: {
              type: 'object',
              properties: {
                rate: { type: 'number', minimum: 0 },
                name: { type: 'string' },
                description: { type: 'string' },
              },
              required: ['rate'],
            },
            head: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
          },
          required: ['fluid', 'pumpEfficiency', 'motorEfficiency', 'loadProfile', 'tariff', 'head'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              totalEnergy: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              totalCost: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              averagePower: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              loadProfile: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    hours: { type: 'number' },
                    Qset: {
                      type: 'object',
                      properties: { value: { type: 'number' }, unit: { type: 'string' } },
                      required: ['value', 'unit'],
                    },
                    speed: { type: 'number' },
                    power: {
                      type: 'object',
                      properties: { value: { type: 'number' }, unit: { type: 'string' } },
                      required: ['value', 'unit'],
                    },
                    energy: {
                      type: 'object',
                      properties: { value: { type: 'number' }, unit: { type: 'string' } },
                      required: ['value', 'unit'],
                    },
                    cost: {
                      type: 'object',
                      properties: { value: { type: 'number' }, unit: { type: 'string' } },
                      required: ['value', 'unit'],
                    },
                  },
                  required: ['hours', 'Qset', 'power', 'energy', 'cost'],
                },
              },
              efficiency: {
                type: 'object',
                properties: {
                  averagePumpEfficiency: { type: 'number' },
                  averageMotorEfficiency: { type: 'number' },
                  averageVfdEfficiency: { type: 'number' },
                  averageTotalEfficiency: { type: 'number' },
                },
                required: ['averagePumpEfficiency', 'averageMotorEfficiency', 'averageTotalEfficiency'],
              },
              warnings: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  tariff: {
                    type: 'object',
                    properties: {
                      rate: { type: 'number' },
                      name: { type: 'string' },
                      description: { type: 'string' },
                    },
                    required: ['rate'],
                  },
                  totalHours: { type: 'number' },
                  operatingPoints: { type: 'number' },
                },
                required: ['tariff', 'totalHours', 'operatingPoints'],
              },
            },
            required: ['totalEnergy', 'totalCost', 'averagePower', 'loadProfile', 'efficiency', 'warnings', 'metadata'],
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
        const body = zEnergyRequest.parse(request.body);
        
        // Validate inputs
        const validation = validateEnergyInputs(body);
        
        if (!validation.isValid) {
          return reply.status(400).send({
            error: 'Invalid input parameters',
            code: 'VALIDATION_ERROR',
            details: validation.errors,
          });
        }

        // Calculate energy consumption
        const result = calculatePumpEnergy(body);

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

  // GET endpoint to provide example load profiles
  fastify.get(
    '/api/v1/pumps/load-profiles',
    {
      schema: {
        description: 'Get example load profiles for energy calculations',
        tags: ['Pumps'],
        response: {
          200: {
            type: 'object',
            properties: {
              profiles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    points: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          hours: { type: 'number' },
                          Qset: {
                            type: 'object',
                            properties: { value: { type: 'number' }, unit: { type: 'string' } },
                            required: ['value', 'unit'],
                          },
                          speed: { type: 'number' },
                        },
                        required: ['hours', 'Qset'],
                      },
                    },
                  },
                  required: ['name', 'description', 'points'],
                },
              },
            },
            required: ['profiles'],
          },
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        profiles: [
          {
            name: 'Constant Load',
            description: 'Pump operates at constant flow rate year-round',
            points: [
              {
                hours: 8760,
                Qset: { value: 0.1, unit: 'm³/s' },
              },
            ],
          },
          {
            name: 'Two-Speed Operation',
            description: 'Pump operates at two different flow rates',
            points: [
              {
                hours: 4380,
                Qset: { value: 0.15, unit: 'm³/s' },
                speed: 1.0,
              },
              {
                hours: 4380,
                Qset: { value: 0.075, unit: 'm³/s' },
                speed: 0.5,
              },
            ],
          },
          {
            name: 'Seasonal Variation',
            description: 'Pump operates at different flow rates by season',
            points: [
              {
                hours: 2190, // Summer (3 months)
                Qset: { value: 0.2, unit: 'm³/s' },
              },
              {
                hours: 2190, // Spring/Fall (6 months)
                Qset: { value: 0.15, unit: 'm³/s' },
              },
              {
                hours: 4380, // Winter (3 months)
                Qset: { value: 0.1, unit: 'm³/s' },
              },
            ],
          },
          {
            name: 'Variable Speed',
            description: 'Pump operates with variable speed control',
            points: [
              {
                hours: 2000,
                Qset: { value: 0.2, unit: 'm³/s' },
                speed: 1.0,
              },
              {
                hours: 3000,
                Qset: { value: 0.15, unit: 'm³/s' },
                speed: 0.75,
              },
              {
                hours: 2000,
                Qset: { value: 0.1, unit: 'm³/s' },
                speed: 0.5,
              },
              {
                hours: 1760,
                Qset: { value: 0.05, unit: 'm³/s' },
                speed: 0.25,
              },
            ],
          },
        ],
      });
    }
  );

  // GET endpoint to provide example energy tariffs
  fastify.get(
    '/api/v1/pumps/energy-tariffs',
    {
      schema: {
        description: 'Get example energy tariffs for cost calculations',
        tags: ['Pumps'],
        response: {
          200: {
            type: 'object',
            properties: {
              tariffs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    rate: { type: 'number' },
                    description: { type: 'string' },
                    region: { type: 'string' },
                  },
                  required: ['name', 'rate', 'description'],
                },
              },
            },
            required: ['tariffs'],
          },
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        tariffs: [
          {
            name: 'Residential',
            rate: 0.12,
            description: 'Typical residential electricity rate',
            region: 'US Average',
          },
          {
            name: 'Commercial',
            rate: 0.10,
            description: 'Typical commercial electricity rate',
            region: 'US Average',
          },
          {
            name: 'Industrial',
            rate: 0.08,
            description: 'Typical industrial electricity rate',
            region: 'US Average',
          },
          {
            name: 'High Rate',
            rate: 0.20,
            description: 'High electricity rate (e.g., California, Hawaii)',
            region: 'High Cost Areas',
          },
          {
            name: 'Low Rate',
            rate: 0.06,
            description: 'Low electricity rate (e.g., Washington, Louisiana)',
            region: 'Low Cost Areas',
          },
        ],
      });
    }
  );
}
