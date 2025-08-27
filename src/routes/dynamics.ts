import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import { simulateTank, TankSimulationInput } from '@/logic/tank';
import { handleError } from '@/utils/errorHandler';

const zTankGeometry = z.object({
  area: zQuantity,
  initialLevel: zQuantity.optional(),
  maxLevel: zQuantity.optional(),
  minLevel: zQuantity.optional(),
});

const zInflowCurve = z.object({
  type: z.enum(['constant', 'curve', 'function']),
  value: zQuantity.optional(),
  curve: z
    .array(
      z.object({
        time: z.number(),
        flow: zQuantity,
      })
    )
    .optional(),
  function: z.string().optional(),
});

const zOutflowCurve = z.object({
  type: z.enum(['orifice', 'pump', 'constant']),
  orifice: z
    .object({
      coefficient: z.number().min(0).max(1),
      area: zQuantity,
    })
    .optional(),
  pump: z
    .object({
      curve: z.array(
        z.object({
          head: z.number(),
          flow: zQuantity,
        })
      ),
      onOffControl: z
        .object({
          highLevel: zQuantity,
          lowLevel: zQuantity,
        })
        .optional(),
    })
    .optional(),
  constant: z
    .object({
      flow: zQuantity,
    })
    .optional(),
});

const zTankSimulationRequest = z.object({
  tank: zTankGeometry,
  inflow: zInflowCurve,
  outflow: zOutflowCurve,
  simulation: z.object({
    endTime: zQuantity,
    timeStep: zQuantity,
  }),
});

const zTankSimulationResponse = z.object({
  timeSeries: z.array(
    z.object({
      time: z.number(),
      level: z.number(),
      inflow: z.number(),
      outflow: z.number(),
      pumpOn: z.boolean(),
    })
  ),
  summary: z.object({
    finalLevel: z.number(),
    maxLevel: z.number(),
    minLevel: z.number(),
    averageInflow: z.number(),
    averageOutflow: z.number(),
    overflow: z.boolean(),
    empty: z.boolean(),
  }),
  warnings: z.array(z.string()),
  metadata: z.object({
    input: zTankSimulationRequest,
    calculations: z.object({
      totalSteps: z.number(),
      simulationTime: z.number(),
    }),
  }),
});

export default async function dynamicsRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/dynamics/tank-level',
    {
      schema: {
        description: 'Simulate tank level dynamics over time',
        tags: ['Dynamics'],
        body: {
          type: 'object',
          properties: {
            tank: {
              type: 'object',
              properties: {
                area: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
                initialLevel: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
                maxLevel: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
                minLevel: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
              },
              required: ['area'],
            },
            inflow: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['constant', 'curve', 'function'],
                },
                value: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
                curve: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      time: { type: 'number' },
                      flow: {
                        type: 'object',
                        properties: {
                          value: { type: 'number' },
                          unit: { type: 'string' },
                        },
                        required: ['value', 'unit'],
                      },
                    },
                    required: ['time', 'flow'],
                  },
                },
                function: { type: 'string' },
              },
              required: ['type'],
            },
            outflow: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['orifice', 'pump', 'constant'],
                },
                orifice: {
                  type: 'object',
                  properties: {
                    coefficient: { type: 'number', minimum: 0, maximum: 1 },
                    area: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        unit: { type: 'string' },
                      },
                      required: ['value', 'unit'],
                    },
                  },
                  required: ['coefficient', 'area'],
                },
                pump: {
                  type: 'object',
                  properties: {
                    curve: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          head: { type: 'number' },
                          flow: {
                            type: 'object',
                            properties: {
                              value: { type: 'number' },
                              unit: { type: 'string' },
                            },
                            required: ['value', 'unit'],
                          },
                        },
                        required: ['head', 'flow'],
                      },
                    },
                    onOffControl: {
                      type: 'object',
                      properties: {
                        highLevel: {
                          type: 'object',
                          properties: {
                            value: { type: 'number' },
                            unit: { type: 'string' },
                          },
                          required: ['value', 'unit'],
                        },
                        lowLevel: {
                          type: 'object',
                          properties: {
                            value: { type: 'number' },
                            unit: { type: 'string' },
                          },
                          required: ['value', 'unit'],
                        },
                      },
                      required: ['highLevel', 'lowLevel'],
                    },
                  },
                  required: ['curve'],
                },
                constant: {
                  type: 'object',
                  properties: {
                    flow: {
                      type: 'object',
                      properties: {
                        value: { type: 'number' },
                        unit: { type: 'string' },
                      },
                      required: ['value', 'unit'],
                    },
                  },
                  required: ['flow'],
                },
              },
              required: ['type'],
            },
            simulation: {
              type: 'object',
              properties: {
                endTime: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
                timeStep: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
              },
              required: ['endTime', 'timeStep'],
            },
          },
          required: ['tank', 'inflow', 'outflow', 'simulation'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              timeSeries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    time: { type: 'number' },
                    level: { type: 'number' },
                    inflow: { type: 'number' },
                    outflow: { type: 'number' },
                    pumpOn: { type: 'boolean' },
                  },
                  required: ['time', 'level', 'inflow', 'outflow', 'pumpOn'],
                },
              },
              summary: {
                type: 'object',
                properties: {
                  finalLevel: { type: 'number' },
                  maxLevel: { type: 'number' },
                  minLevel: { type: 'number' },
                  averageInflow: { type: 'number' },
                  averageOutflow: { type: 'number' },
                  overflow: { type: 'boolean' },
                  empty: { type: 'boolean' },
                },
                required: [
                  'finalLevel',
                  'maxLevel',
                  'minLevel',
                  'averageInflow',
                  'averageOutflow',
                  'overflow',
                  'empty',
                ],
              },
              warnings: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                  calculations: {
                    type: 'object',
                    properties: {
                      totalSteps: { type: 'number' },
                      simulationTime: { type: 'number' },
                    },
                    required: ['totalSteps', 'simulationTime'],
                  },
                },
                required: ['input', 'calculations'],
              },
            },
            required: ['timeSeries', 'summary', 'warnings', 'metadata'],
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
        const input = zTankSimulationRequest.parse(request.body);

        // Validate inflow configuration
        if (input.inflow.type === 'constant' && !input.inflow.value) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Constant inflow requires a value',
          });
        }

        if (
          input.inflow.type === 'curve' &&
          (!input.inflow.curve || input.inflow.curve.length === 0)
        ) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Curve inflow requires a non-empty curve array',
          });
        }

        // Validate outflow configuration
        if (input.outflow.type === 'orifice' && !input.outflow.orifice) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Orifice outflow requires orifice configuration',
          });
        }

        if (
          input.outflow.type === 'pump' &&
          (!input.outflow.pump || input.outflow.pump.curve.length === 0)
        ) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Pump outflow requires a non-empty pump curve',
          });
        }

        if (input.outflow.type === 'constant' && !input.outflow.constant) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Constant outflow requires constant flow configuration',
          });
        }

        // Validate pump on/off control if present
        if (input.outflow.type === 'pump' && input.outflow.pump?.onOffControl) {
          const { highLevel, lowLevel } = input.outflow.pump.onOffControl;
          if (highLevel.value <= lowLevel.value) {
            return reply.status(400).send({
              error: 'ValidationError',
              message:
                'High level must be greater than low level for pump control',
            });
          }
        }

        const result = simulateTank(input);

        return reply.send(result);
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
}
