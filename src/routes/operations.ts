import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  computeFillDrainTime,
  FillDrainInput,
} from '@/logic/operations/fill-drain-time';
import { handleError } from '@/utils/errorHandler';
import {
  processBatchOrSingle,
  BatchRequest,
  BatchResponse,
} from '@/utils/batchProcessor';
import { transcriptService } from '@/services/runs';

const zTankGeometry = z.object({
  volume: z.object({
    value: z.number().positive(),
    unit: z.string(),
  }),
  height: z
    .object({
      value: z.number().positive(),
      unit: z.string(),
    })
    .optional(),
  diameter: z
    .object({
      value: z.number().positive(),
      unit: z.string(),
    })
    .optional(),
  shape: z.enum(['cylindrical', 'rectangular', 'custom']),
});

const zFlowRate = z.object({
  type: z.enum(['constant', 'variable']),
  value: z
    .object({
      value: z.number().positive(),
      unit: z.string(),
    })
    .optional(),
  function: z.string().optional(),
});

const zFillDrainRequest = z.object({
  tank: zTankGeometry,
  flowRate: zFlowRate,
  operation: z.enum(['fill', 'drain']),
  initialLevel: z
    .object({
      value: z.number().min(0),
      unit: z.string(),
    })
    .optional(),
  targetLevel: z
    .object({
      value: z.number().min(0),
      unit: z.string(),
    })
    .optional(),
  timeStep: z
    .object({
      value: z.number().positive(),
      unit: z.string(),
    })
    .optional(),
});

const zFillDrainResponse = z.object({
  totalTime: z.object({
    value: z.number(),
    unit: z.literal('s'),
  }),
  averageFlowRate: z.object({
    value: z.number(),
    unit: z.literal('m³/s'),
  }),
  volumeChange: z.object({
    value: z.number(),
    unit: z.literal('m³'),
  }),
  timeHistory: z.array(
    z.object({
      time: z.number(),
      level: z.number(),
      volume: z.number(),
      flowRate: z.number(),
    })
  ),
  warnings: z.array(
    z.object({
      type: z.string(),
      message: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
    })
  ),
  metadata: z.object({
    input: z.any(),
    calculations: z.object({
      method: z.string(),
      timeSteps: z.number(),
      convergence: z.boolean(),
    }),
  }),
});

export default async function operationsRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/operations/fill-drain-time',
    {
      schema: {
        tags: ['Operations'],
        summary: 'Calculate tank fill/drain time using numerical integration',
        description: `Calculate fill or drain time for tanks using numerical integration with variable flow rates.

**Method Used:**
- **Numerical Integration**: Fourth-order Runge-Kutta method for time stepping
- **Volume Calculation**: V = f(h) based on tank geometry (cylindrical, rectangular, custom)
- **Flow Rate**: Q = Q(t) or constant Q
- **Time Integration**: Δt = min(timeStep, convergence_criteria)

**Tank Geometries:**
- **Cylindrical**: V = πD²h/4, A = πD²/4
- **Rectangular**: V = L×W×h, A = L×W
- **Custom**: User-defined volume-height relationship

**Validity Ranges:**
- Tank Volume: 0.1 m³ < V < 100,000 m³
- Flow Rate: 0.001 m³/s < Q < 100 m³/s
- Time Step: 0.1 s < Δt < 3600 s
- Level Change: 0.01 m < Δh < 100 m
- Integration Time: 1 s < t < 24 hours

**Convergence Criteria:**
- Volume balance satisfied within 0.1%
- Time step stability maintained
- Maximum iterations not exceeded

**References:**
- Press, W.H. et al. (2007). "Numerical Recipes" (3rd ed.). Cambridge University Press
- Chapra, S.C. (2018). "Applied Numerical Methods with MATLAB" (4th ed.). McGraw-Hill

**Version:** 1.0.0`,
        body: {
          type: 'object',
          properties: {
            tank: {
              type: 'object',
              properties: {
                volume: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
                height: {
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
                  enum: ['cylindrical', 'rectangular', 'custom'],
                },
              },
              required: ['volume', 'shape'],
            },
            flowRate: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['constant', 'variable'],
                },
                value: {
                  type: 'object',
                  properties: {
                    value: { type: 'number' },
                    unit: { type: 'string' },
                  },
                  required: ['value', 'unit'],
                },
                function: { type: 'string' },
              },
              required: ['type'],
            },
            operation: {
              type: 'string',
              enum: ['fill', 'drain'],
            },
            initialLevel: {
              type: 'object',
              properties: {
                value: { type: 'number' },
                unit: { type: 'string' },
              },
              required: ['value', 'unit'],
            },
            targetLevel: {
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
          required: ['tank', 'flowRate', 'operation'],
        },
        examples: [
          {
            name: 'Cylindrical Tank Fill',
            summary: 'Fill a cylindrical tank with constant flow rate',
            description: 'Calculate fill time for a 100m³ cylindrical tank',
            value: {
              tank: {
                volume: { value: 100, unit: 'm³' },
                height: { value: 10, unit: 'm' },
                diameter: { value: 3.57, unit: 'm' },
                shape: 'cylindrical',
              },
              flowRate: {
                type: 'constant',
                value: { value: 0.05, unit: 'm³/s' },
              },
              operation: 'fill',
              initialLevel: { value: 0, unit: 'm' },
              targetLevel: { value: 10, unit: 'm' },
              timeStep: { value: 60, unit: 's' },
            },
          },
          {
            name: 'Variable Flow Drain',
            summary: 'Drain tank with variable flow rate',
            description: 'Drain tank with flow rate decreasing over time',
            value: {
              tank: {
                volume: { value: 50, unit: 'm³' },
                height: { value: 5, unit: 'm' },
                shape: 'rectangular',
              },
              flowRate: {
                type: 'variable',
                function: '0.02 * Math.exp(-t/3600)',
              },
              operation: 'drain',
              initialLevel: { value: 5, unit: 'm' },
              targetLevel: { value: 0.5, unit: 'm' },
            },
          },
        ],
        response: {
          200: {
            type: 'object',
            properties: {
              totalTime: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['value', 'unit'],
              },
              averageFlowRate: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['value', 'unit'],
              },
              volumeChange: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' },
                },
                required: ['value', 'unit'],
              },
              timeHistory: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    time: { type: 'number' },
                    level: { type: 'number' },
                    volume: { type: 'number' },
                    flowRate: { type: 'number' },
                  },
                },
              },
              warnings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    message: { type: 'string' },
                    severity: {
                      type: 'string',
                      enum: ['low', 'medium', 'high'],
                    },
                  },
                },
              },
              metadata: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                  calculations: {
                    type: 'object',
                    properties: {
                      method: { type: 'string' },
                      timeSteps: { type: 'number' },
                      convergence: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            required: [
              'totalTime',
              'averageFlowRate',
              'volumeChange',
              'timeHistory',
              'warnings',
              'metadata',
            ],
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const startTime = Date.now();

      try {
        const payload = request.body as any;

        // Validate basic structure
        if (!payload) {
          return reply.status(400).send({
            error: 'Request body is required',
          });
        }

        // Check if this is a batch request
        if (payload && Array.isArray(payload.items)) {
          // Batch request - use batch processor
          const result = await processBatchOrSingle(
            payload,
            (input: FillDrainInput) => {
              // Manual validation for single item
              if (
                !input ||
                !input.tank ||
                !input.flowRate ||
                !input.operation
              ) {
                throw new Error(
                  'Missing required fields: tank, flowRate, and operation'
                );
              }

              // Validate tank
              if (
                !input.tank.volume ||
                typeof input.tank.volume.value !== 'number' ||
                input.tank.volume.value <= 0
              ) {
                throw new Error('Tank volume must be positive');
              }

              if (
                !input.tank.shape ||
                !['cylindrical', 'rectangular', 'custom'].includes(
                  input.tank.shape
                )
              ) {
                throw new Error('Invalid tank shape');
              }

              // Validate flow rate
              if (
                !input.flowRate.type ||
                !['constant', 'variable'].includes(input.flowRate.type)
              ) {
                throw new Error('Invalid flow rate type');
              }

              if (
                input.flowRate.type === 'constant' &&
                (!input.flowRate.value ||
                  typeof input.flowRate.value.value !== 'number' ||
                  input.flowRate.value.value <= 0)
              ) {
                throw new Error('Constant flow rate must be positive');
              }

              if (
                input.flowRate.type === 'variable' &&
                !input.flowRate.function
              ) {
                throw new Error('Variable flow rate requires a function');
              }

              // Validate operation
              if (!['fill', 'drain'].includes(input.operation)) {
                throw new Error('Invalid operation type');
              }

              // Validate tank geometry based on shape
              if (input.tank.shape === 'cylindrical' && !input.tank.diameter) {
                throw new Error('Diameter is required for cylindrical tanks');
              }

              if (
                (input.tank.shape === 'rectangular' ||
                  input.tank.shape === 'custom') &&
                !input.tank.height
              ) {
                throw new Error(
                  'Height is required for rectangular and custom tanks'
                );
              }

              // Validate flow rate based on type
              if (input.flowRate.type === 'constant' && !input.flowRate.value) {
                throw new Error(
                  'Flow rate value is required for constant flow'
                );
              }

              if (
                input.flowRate.type === 'variable' &&
                !input.flowRate.function
              ) {
                throw new Error(
                  'Flow rate function is required for variable flow'
                );
              }

              return computeFillDrainTime(input);
            },
            reply
          );

          // Capture transcript if enabled
          const processingTime = Date.now() - startTime;
          const transcript = transcriptService.createFromRequest(
            request,
            result,
            processingTime,
            [],
            {},
            [
              'Volume = Area × Level',
              'Time = Volume / Flow Rate',
              'Cross-sectional Area = π × (Diameter/2)²',
            ]
          );

          if (transcript) {
            reply.header('X-EngiVault-Transcript-ID', transcript.id);
          }

          return reply.send(result);
        } else {
          // Single item request - validate and process directly
          const input = payload as FillDrainInput;

          // Manual validation
          if (!input || !input.tank || !input.flowRate || !input.operation) {
            return reply.status(400).send({
              error: 'Missing required fields: tank, flowRate, and operation',
            });
          }

          // Validate tank
          if (
            !input.tank.volume ||
            typeof input.tank.volume.value !== 'number' ||
            input.tank.volume.value <= 0
          ) {
            return reply.status(400).send({
              error: 'Tank volume must be positive',
            });
          }

          if (
            !input.tank.shape ||
            !['cylindrical', 'rectangular', 'custom'].includes(input.tank.shape)
          ) {
            return reply.status(400).send({
              error: 'Invalid tank shape',
            });
          }

          // Validate flow rate
          if (
            !input.flowRate.type ||
            !['constant', 'variable'].includes(input.flowRate.type)
          ) {
            return reply.status(400).send({
              error: 'Invalid flow rate type',
            });
          }

          if (
            input.flowRate.type === 'constant' &&
            (!input.flowRate.value ||
              typeof input.flowRate.value.value !== 'number' ||
              input.flowRate.value.value <= 0)
          ) {
            return reply.status(400).send({
              error: 'Constant flow rate must be positive',
            });
          }

          if (input.flowRate.type === 'variable' && !input.flowRate.function) {
            return reply.status(400).send({
              error: 'Variable flow rate requires a function',
            });
          }

          // Validate operation
          if (!['fill', 'drain'].includes(input.operation)) {
            return reply.status(400).send({
              error: 'Invalid operation type',
            });
          }

          // Validate tank geometry based on shape
          if (input.tank.shape === 'cylindrical' && !input.tank.diameter) {
            return reply.status(400).send({
              error: 'Diameter is required for cylindrical tanks',
            });
          }

          if (
            (input.tank.shape === 'rectangular' ||
              input.tank.shape === 'custom') &&
            !input.tank.height
          ) {
            return reply.status(400).send({
              error: 'Height is required for rectangular and custom tanks',
            });
          }

          // Validate flow rate based on type
          if (input.flowRate.type === 'constant' && !input.flowRate.value) {
            return reply.status(400).send({
              error: 'Flow rate value is required for constant flow',
            });
          }

          if (input.flowRate.type === 'variable' && !input.flowRate.function) {
            return reply.status(400).send({
              error: 'Flow rate function is required for variable flow',
            });
          }

          const result = computeFillDrainTime(input);

          // Capture transcript if enabled
          const processingTime = Date.now() - startTime;
          const transcript = transcriptService.createFromRequest(
            request,
            result,
            processingTime,
            [],
            {},
            [
              'Volume = Area × Level',
              'Time = Volume / Flow Rate',
              'Cross-sectional Area = π × (Diameter/2)²',
            ]
          );

          if (transcript) {
            reply.header('X-EngiVault-Transcript-ID', transcript.id);
          }

          return reply.send(result);
        }
      } catch (error) {
        // Capture transcript for errors too if enabled
        const processingTime = Date.now() - startTime;
        const transcript = transcriptService.createFromRequest(
          request,
          { error: error instanceof Error ? error.message : String(error) },
          processingTime,
          [],
          {},
          [
            'Volume = Area × Level',
            'Time = Volume / Flow Rate',
            'Cross-sectional Area = π × (Diameter/2)²',
          ]
        );

        if (transcript) {
          reply.header('X-EngiVault-Transcript-ID', transcript.id);
        }

        return handleError(error, reply);
      }
    }
  );
}
