import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import { sizeValve, validateValveSizingInputs } from '@/logic/valves';
import { handleError } from '@/utils/errorHandler';

const zValveTrimCharacteristic = z.object({
  type: z.enum(['linear', 'equal-percentage', 'quick-opening', 'modified-parabolic']),
  description: z.string().optional(),
});

const zValveSizingRequest = z.object({
  flow: zQuantity,
  pressureDrop: zQuantity,
  specificGravity: z.number().positive(),
  trimCharacteristic: zValveTrimCharacteristic,
  pressureRecoveryFactor: z.number().min(0).max(1).optional(),
  upstreamPressure: zQuantity.optional(),
  downstreamPressure: zQuantity.optional(),
  temperature: zQuantity.optional(),
  fluidName: z.string().optional(),
});

const zValveSizingResponse = z.object({
  cv: zQuantity,
  kv: zQuantity,
  valveAuthority: z.number(),
  chokedFlow: z.object({
    isChoked: z.boolean(),
    likelihood: z.enum(['none', 'low', 'medium', 'high']),
    criticalPressureDrop: zQuantity,
    actualPressureDrop: zQuantity,
  }),
  warnings: z.array(z.string()),
  metadata: z.object({
    input: zValveSizingRequest,
    calculations: z.object({
      flowRate: zQuantity,
      pressureDrop: zQuantity,
      specificGravity: z.number(),
    }),
  }),
});

export default async function valveRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/valves/size',
    {
      schema: {
        description: 'Size control valve for liquid flow',
        tags: ['Valves'],
        body: {
          type: 'object',
          properties: {
            flow: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            pressureDrop: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            specificGravity: { type: 'number', minimum: 0 },
            trimCharacteristic: {
              type: 'object',
              properties: {
                type: { 
                  type: 'string', 
                  enum: ['linear', 'equal-percentage', 'quick-opening', 'modified-parabolic'] 
                },
                description: { type: 'string' },
              },
              required: ['type'],
            },
            pressureRecoveryFactor: { type: 'number', minimum: 0, maximum: 1 },
            upstreamPressure: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            downstreamPressure: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            temperature: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            fluidName: { type: 'string' },
          },
          required: ['flow', 'pressureDrop', 'specificGravity', 'trimCharacteristic'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              cv: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              kv: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              valveAuthority: { type: 'number' },
              chokedFlow: {
                type: 'object',
                properties: {
                  isChoked: { type: 'boolean' },
                  likelihood: { 
                    type: 'string', 
                    enum: ['none', 'low', 'medium', 'high'] 
                  },
                  criticalPressureDrop: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                  actualPressureDrop: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                },
                required: ['isChoked', 'likelihood', 'criticalPressureDrop', 'actualPressureDrop'],
              },
              warnings: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  input: {
                    type: 'object',
                    properties: {
                      flow: {
                        type: 'object',
                        properties: { value: { type: 'number' }, unit: { type: 'string' } },
                        required: ['value', 'unit'],
                      },
                      pressureDrop: {
                        type: 'object',
                        properties: { value: { type: 'number' }, unit: { type: 'string' } },
                        required: ['value', 'unit'],
                      },
                      specificGravity: { type: 'number' },
                      trimCharacteristic: {
                        type: 'object',
                        properties: {
                          type: { type: 'string' },
                          description: { type: 'string' },
                        },
                        required: ['type'],
                      },
                    },
                    required: ['flow', 'pressureDrop', 'specificGravity', 'trimCharacteristic'],
                  },
                  calculations: {
                    type: 'object',
                    properties: {
                      flowRate: {
                        type: 'object',
                        properties: { value: { type: 'number' }, unit: { type: 'string' } },
                        required: ['value', 'unit'],
                      },
                      pressureDrop: {
                        type: 'object',
                        properties: { value: { type: 'number' }, unit: { type: 'string' } },
                        required: ['value', 'unit'],
                      },
                      specificGravity: { type: 'number' },
                    },
                    required: ['flowRate', 'pressureDrop', 'specificGravity'],
                  },
                },
                required: ['input', 'calculations'],
              },
            },
            required: ['cv', 'kv', 'valveAuthority', 'chokedFlow', 'warnings', 'metadata'],
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
        const body = zValveSizingRequest.parse(request.body);
        
        // Validate inputs
        const validation = validateValveSizingInputs(body);
        
        if (!validation.isValid) {
          return reply.status(400).send({
            error: 'Invalid input parameters',
            code: 'VALIDATION_ERROR',
            details: validation.errors,
          });
        }

        // Size valve
        const result = sizeValve(body);

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

  // GET endpoint to provide valve trim characteristics
  fastify.get(
    '/api/v1/valves/trim-characteristics',
    {
      schema: {
        description: 'Get valve trim characteristics for sizing',
        tags: ['Valves'],
        response: {
          200: {
            type: 'object',
            properties: {
              characteristics: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    typicalFL: { type: 'number' },
                    applications: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['type', 'name', 'description', 'typicalFL', 'applications'],
                },
              },
            },
            required: ['characteristics'],
          },
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        characteristics: [
          {
            type: 'linear',
            name: 'Linear',
            description: 'Flow rate changes linearly with valve position',
            typicalFL: 0.9,
            applications: [
              'Level control',
              'Pressure control',
              'Simple flow control',
              'Systems with constant pressure drop',
            ],
          },
          {
            type: 'equal-percentage',
            name: 'Equal Percentage',
            description: 'Equal increments of valve travel produce equal percentage changes in flow',
            typicalFL: 0.85,
            applications: [
              'Temperature control',
              'Complex flow control',
              'Systems with variable pressure drop',
              'Most control applications',
            ],
          },
          {
            type: 'quick-opening',
            name: 'Quick Opening',
            description: 'Large flow change occurs with small valve movement',
            typicalFL: 0.95,
            applications: [
              'On/off control',
              'Safety systems',
              'Relief valves',
              'Systems requiring fast response',
            ],
          },
          {
            type: 'modified-parabolic',
            name: 'Modified Parabolic',
            description: 'Intermediate characteristic between linear and equal percentage',
            typicalFL: 0.88,
            applications: [
              'Temperature control',
              'Flow control',
              'Systems requiring intermediate control',
            ],
          },
        ],
      });
    }
  );

  // GET endpoint to provide example valve sizing scenarios
  fastify.get(
    '/api/v1/valves/sizing-examples',
    {
      schema: {
        description: 'Get example valve sizing scenarios',
        tags: ['Valves'],
        response: {
          200: {
            type: 'object',
            properties: {
              examples: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    scenario: {
                      type: 'object',
                      properties: {
                        flow: {
                          type: 'object',
                          properties: { value: { type: 'number' }, unit: { type: 'string' } },
                          required: ['value', 'unit'],
                        },
                        pressureDrop: {
                          type: 'object',
                          properties: { value: { type: 'number' }, unit: { type: 'string' } },
                          required: ['value', 'unit'],
                        },
                        specificGravity: { type: 'number' },
                        trimCharacteristic: {
                          type: 'object',
                          properties: {
                            type: { type: 'string' },
                            description: { type: 'string' },
                          },
                          required: ['type'],
                        },
                        upstreamPressure: {
                          type: 'object',
                          properties: { value: { type: 'number' }, unit: { type: 'string' } },
                          required: ['value', 'unit'],
                        },
                        downstreamPressure: {
                          type: 'object',
                          properties: { value: { type: 'number' }, unit: { type: 'string' } },
                          required: ['value', 'unit'],
                        },
                        temperature: {
                          type: 'object',
                          properties: { value: { type: 'number' }, unit: { type: 'string' } },
                          required: ['value', 'unit'],
                        },
                        fluidName: { type: 'string' },
                      },
                      required: ['flow', 'pressureDrop', 'specificGravity', 'trimCharacteristic'],
                    },
                  },
                  required: ['name', 'description', 'scenario'],
                },
              },
            },
            required: ['examples'],
          },
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        examples: [
          {
            name: 'Water Flow Control',
            description: 'Typical water flow control valve in HVAC system',
            scenario: {
              flow: { value: 50, unit: 'gpm' },
              pressureDrop: { value: 10, unit: 'psi' },
              specificGravity: 1.0,
              trimCharacteristic: {
                type: 'equal-percentage',
                description: 'Equal percentage for temperature control',
              },
              upstreamPressure: { value: 101325, unit: 'Pa' },
              downstreamPressure: { value: 101325, unit: 'Pa' },
              temperature: { value: 293.15, unit: 'K' },
              fluidName: 'water',
            },
          },
          {
            name: 'Chemical Process Control',
            description: 'Control valve for chemical process with high pressure drop',
            scenario: {
              flow: { value: 25, unit: 'gpm' },
              pressureDrop: { value: 50, unit: 'psi' },
              specificGravity: 1.2,
              trimCharacteristic: {
                type: 'linear',
                description: 'Linear for simple flow control',
              },
              upstreamPressure: { value: 500000, unit: 'Pa' },
              downstreamPressure: { value: 500000, unit: 'Pa' },
              temperature: { value: 323.15, unit: 'K' },
              fluidName: 'chemical',
            },
          },
          {
            name: 'Low Flow Control',
            description: 'Precision control valve for low flow applications',
            scenario: {
              flow: { value: 2, unit: 'gpm' },
              pressureDrop: { value: 5, unit: 'psi' },
              specificGravity: 0.8,
              trimCharacteristic: {
                type: 'modified-parabolic',
                description: 'Modified parabolic for precision control',
              },
              upstreamPressure: { value: 200000, unit: 'Pa' },
              downstreamPressure: { value: 200000, unit: 'Pa' },
              temperature: { value: 298.15, unit: 'K' },
              fluidName: 'solvent',
            },
          },
          {
            name: 'High Pressure Steam',
            description: 'Control valve for high pressure steam system',
            scenario: {
              flow: { value: 100, unit: 'gpm' },
              pressureDrop: { value: 100, unit: 'psi' },
              specificGravity: 0.6,
              trimCharacteristic: {
                type: 'quick-opening',
                description: 'Quick opening for steam control',
              },
              upstreamPressure: { value: 1000000, unit: 'Pa' },
              downstreamPressure: { value: 1000000, unit: 'Pa' },
              temperature: { value: 473.15, unit: 'K' },
              fluidName: 'steam',
            },
          },
        ],
      });
    }
  );
}
