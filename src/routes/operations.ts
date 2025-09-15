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
  warnings: z.array(
    z.object({
      type: z.string(),
      message: z.string(),
    })
  ),
  metadata: z.object({
    calculationMethod: z.string(),
    timestamp: z.string(),
  }),
});

export default async function operationsRoutes(fastify: FastifyInstance) {
  // Fill/Drain Time Calculation
  fastify.post(
    '/operations/fill-drain-time',
    {
      schema: {
        tags: ['Operations'],
        summary: 'Calculate fill/drain time for tanks',
        description: 'Calculate the time required to fill or drain a tank based on flow rate and tank geometry',
        body: {
          type: 'object',
          properties: {
            tank: {
              type: 'object',
              properties: {
                volume: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', minimum: 0 },
                    unit: { type: 'string' }
                  },
                  required: ['value', 'unit']
                },
                height: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', minimum: 0 },
                    unit: { type: 'string' }
                  }
                },
                diameter: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', minimum: 0 },
                    unit: { type: 'string' }
                  }
                },
                shape: { type: 'string', enum: ['cylindrical', 'rectangular', 'custom'] }
              },
              required: ['volume', 'shape']
            },
            flowRate: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['constant', 'variable'] },
                value: {
                  type: 'object',
                  properties: {
                    value: { type: 'number', minimum: 0 },
                    unit: { type: 'string' }
                  }
                },
                function: { type: 'string' }
              },
              required: ['type']
            },
            operation: { type: 'string', enum: ['fill', 'drain'] },
            initialLevel: {
              type: 'object',
              properties: {
                value: { type: 'number', minimum: 0 },
                unit: { type: 'string' }
              }
            },
            targetLevel: {
              type: 'object',
              properties: {
                value: { type: 'number', minimum: 0 },
                unit: { type: 'string' }
              }
            },
            timeStep: {
              type: 'object',
              properties: {
                value: { type: 'number', minimum: 0 },
                unit: { type: 'string' }
              }
            }
          },
          required: ['tank', 'flowRate', 'operation']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              totalTime: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' }
                }
              },
              averageFlowRate: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' }
                }
              },
              volumeChange: {
                type: 'object',
                properties: {
                  value: { type: 'number' },
                  unit: { type: 'string' }
                }
              },
              warnings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              },
              metadata: {
                type: 'object',
                properties: {
                  calculationMethod: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const input = zFillDrainRequest.parse(request.body);
        
        const result = await computeFillDrainTime(input as FillDrainInput);
        
        // Generate transcript
        const transcript = transcriptService.generateTranscript(
          'fill-drain-time',
          input,
          result
        );
        
        return reply.send({
          ...result,
          transcript
        });
      } catch (error) {
        handleError(error, reply);
      }
    }
  );

  // Batch Processing for Fill/Drain Calculations
  fastify.post(
    '/operations/batch-processing',
    {
      schema: {
        tags: ['Operations'],
        summary: 'Process multiple fill/drain calculations in batch',
        description: 'Process multiple fill/drain time calculations efficiently in a single request',
        body: {
          type: 'object',
          properties: {
            endpoint: { type: 'string' },
            requests: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          },
          required: ['endpoint', 'requests']
        }
      }
    },
    async (request, reply) => {
      try {
        const batchRequest = request.body as BatchRequest;
        const result = await processBatchOrSingle(batchRequest, computeFillDrainTime);
        return reply.send(result as BatchResponse);
      } catch (error) {
        handleError(error, reply);
      }
    }
  );
}