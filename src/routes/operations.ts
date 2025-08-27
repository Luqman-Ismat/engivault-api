import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { computeFillDrainTime, FillDrainInput } from '@/logic/operations/fill-drain-time';
import { handleError } from '@/utils/errorHandler';
import { processBatchOrSingle, BatchRequest, BatchResponse } from '@/utils/batchProcessor';

const zTankGeometry = z.object({
  volume: z.object({
    value: z.number().positive(),
    unit: z.string()
  }),
  height: z.object({
    value: z.number().positive(),
    unit: z.string()
  }).optional(),
  diameter: z.object({
    value: z.number().positive(),
    unit: z.string()
  }).optional(),
  shape: z.enum(['cylindrical', 'rectangular', 'custom'])
});

const zFlowRate = z.object({
  type: z.enum(['constant', 'variable']),
  value: z.object({
    value: z.number().positive(),
    unit: z.string()
  }).optional(),
  function: z.string().optional()
});

const zFillDrainRequest = z.object({
  tank: zTankGeometry,
  flowRate: zFlowRate,
  operation: z.enum(['fill', 'drain']),
  initialLevel: z.object({
    value: z.number().min(0),
    unit: z.string()
  }).optional(),
  targetLevel: z.object({
    value: z.number().min(0),
    unit: z.string()
  }).optional(),
  timeStep: z.object({
    value: z.number().positive(),
    unit: z.string()
  }).optional()
});

const zFillDrainResponse = z.object({
  totalTime: z.object({
    value: z.number(),
    unit: z.literal('s')
  }),
  averageFlowRate: z.object({
    value: z.number(),
    unit: z.literal('m³/s')
  }),
  volumeChange: z.object({
    value: z.number(),
    unit: z.literal('m³')
  }),
  timeHistory: z.array(z.object({
    time: z.number(),
    level: z.number(),
    volume: z.number(),
    flowRate: z.number()
  })),
  warnings: z.array(z.object({
    type: z.string(),
    message: z.string(),
    severity: z.enum(['low', 'medium', 'high'])
  })),
  metadata: z.object({
    input: z.any(),
    calculations: z.object({
      method: z.string(),
      timeSteps: z.number(),
      convergence: z.boolean()
    })
  })
});

export default async function operationsRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/operations/fill-drain-time', async (request, reply) => {
    try {
      const payload = request.body as any;
      
      // Validate basic structure
      if (!payload) {
        return reply.status(400).send({
          error: 'Request body is required'
        });
      }
      
      // Check if this is a batch request
      if (payload && Array.isArray(payload.items)) {
        // Batch request - use batch processor
        const result = await processBatchOrSingle(
          payload,
          (input: FillDrainInput) => {
            // Manual validation for single item
            if (!input || !input.tank || !input.flowRate || !input.operation) {
              throw new Error('Missing required fields: tank, flowRate, and operation');
            }
            
            // Validate tank
            if (!input.tank.volume || typeof input.tank.volume.value !== 'number' || input.tank.volume.value <= 0) {
              throw new Error('Tank volume must be positive');
            }
            
            if (!input.tank.shape || !['cylindrical', 'rectangular', 'custom'].includes(input.tank.shape)) {
              throw new Error('Invalid tank shape');
            }
            
            // Validate flow rate
            if (!input.flowRate.type || !['constant', 'variable'].includes(input.flowRate.type)) {
              throw new Error('Invalid flow rate type');
            }
            
            if (input.flowRate.type === 'constant' && (!input.flowRate.value || typeof input.flowRate.value.value !== 'number' || input.flowRate.value.value <= 0)) {
              throw new Error('Constant flow rate must be positive');
            }
            
            if (input.flowRate.type === 'variable' && !input.flowRate.function) {
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
            
            if ((input.tank.shape === 'rectangular' || input.tank.shape === 'custom') && !input.tank.height) {
              throw new Error('Height is required for rectangular and custom tanks');
            }
            
            // Validate flow rate based on type
            if (input.flowRate.type === 'constant' && !input.flowRate.value) {
              throw new Error('Flow rate value is required for constant flow');
            }
            
            if (input.flowRate.type === 'variable' && !input.flowRate.function) {
              throw new Error('Flow rate function is required for variable flow');
            }
            
            return computeFillDrainTime(input);
          },
          reply
        );
        
        return reply.send(result);
      } else {
        // Single item request - validate and process directly
        const input = payload as FillDrainInput;
        
        // Manual validation
        if (!input || !input.tank || !input.flowRate || !input.operation) {
          return reply.status(400).send({
            error: 'Missing required fields: tank, flowRate, and operation'
          });
        }
        
        // Validate tank
        if (!input.tank.volume || typeof input.tank.volume.value !== 'number' || input.tank.volume.value <= 0) {
          return reply.status(400).send({
            error: 'Tank volume must be positive'
          });
        }
        
        if (!input.tank.shape || !['cylindrical', 'rectangular', 'custom'].includes(input.tank.shape)) {
          return reply.status(400).send({
            error: 'Invalid tank shape'
          });
        }
        
        // Validate flow rate
        if (!input.flowRate.type || !['constant', 'variable'].includes(input.flowRate.type)) {
          return reply.status(400).send({
            error: 'Invalid flow rate type'
          });
        }
        
        if (input.flowRate.type === 'constant' && (!input.flowRate.value || typeof input.flowRate.value.value !== 'number' || input.flowRate.value.value <= 0)) {
          return reply.status(400).send({
            error: 'Constant flow rate must be positive'
          });
        }
        
        if (input.flowRate.type === 'variable' && !input.flowRate.function) {
          return reply.status(400).send({
            error: 'Variable flow rate requires a function'
          });
        }
        
        // Validate operation
        if (!['fill', 'drain'].includes(input.operation)) {
          return reply.status(400).send({
            error: 'Invalid operation type'
          });
        }
        
        // Validate tank geometry based on shape
        if (input.tank.shape === 'cylindrical' && !input.tank.diameter) {
          return reply.status(400).send({
            error: 'Diameter is required for cylindrical tanks'
          });
        }
        
        if ((input.tank.shape === 'rectangular' || input.tank.shape === 'custom') && !input.tank.height) {
          return reply.status(400).send({
            error: 'Height is required for rectangular and custom tanks'
          });
        }
        
        // Validate flow rate based on type
        if (input.flowRate.type === 'constant' && !input.flowRate.value) {
          return reply.status(400).send({
            error: 'Flow rate value is required for constant flow'
          });
        }
        
        if (input.flowRate.type === 'variable' && !input.flowRate.function) {
          return reply.status(400).send({
            error: 'Flow rate function is required for variable flow'
          });
        }
        
        const result = computeFillDrainTime(input);
        return reply.send(result);
      }
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
