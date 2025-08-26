import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { sizePipeForTarget } from '@/logic/sizing';
import { handleError } from '@/utils/errorHandler';

// Zod schemas for request/response validation
const zFluidProperties = z.object({
  density: z.object({
    value: z.number().positive(),
    unit: z.string()
  }),
  viscosity: z.object({
    value: z.number().positive(),
    unit: z.string()
  })
});

const zPipeSizingRequest = z.object({
  flow: z.object({
    value: z.number().positive(),
    unit: z.string()
  }),
  target: z.enum(['velocity', 'dP']),
  value: z.object({
    value: z.number().positive(),
    unit: z.string()
  }),
  roughness: z.object({
    value: z.number().positive(),
    unit: z.string()
  }).optional(),
  fluid: zFluidProperties,
  length: z.object({
    value: z.number().positive(),
    unit: z.string()
  })
});

const zPipeSizingResponse = z.object({
  diameter: z.object({
    value: z.number(),
    unit: z.literal('m')
  }),
  velocity: z.object({
    value: z.number(),
    unit: z.literal('m/s')
  }),
  pressureDrop: z.object({
    value: z.number(),
    unit: z.literal('Pa')
  }),
  reynoldsNumber: z.number(),
  frictionFactor: z.number(),
  warnings: z.array(z.object({
    type: z.enum(['transition', 'mach', 'correlation', 'general']),
    message: z.string(),
    severity: z.enum(['low', 'medium', 'high'])
  })),
  metadata: z.object({
    input: z.any(),
    calculations: z.object({
      method: z.string(),
      iterations: z.number(),
      convergenceTolerance: z.number(),
      finalTolerance: z.number()
    })
  })
});

export default async function hydraulicsRoutes(fastify: FastifyInstance) {
  // POST /api/v1/hydraulics/size-pipe
  fastify.post('/api/v1/hydraulics/size-pipe', async (request, reply) => {
    try {
      const input = request.body as z.infer<typeof zPipeSizingRequest>;
      
      // Basic validation
      if (!input || typeof input !== 'object') {
        return reply.status(400).send({
          error: 'Invalid request body'
        });
      }
      
      if (!input.flow || !input.target || !input.value || !input.fluid || !input.length) {
        return reply.status(400).send({
          error: 'Missing required fields'
        });
      }
      
      // Validate positive values
      if (input.flow.value <= 0) {
        return reply.status(400).send({
          error: 'Flow rate must be positive'
        });
      }
      
      if (input.value.value <= 0) {
        return reply.status(400).send({
          error: 'Target value must be positive'
        });
      }
      
      if (input.length.value <= 0) {
        return reply.status(400).send({
          error: 'Pipe length must be positive'
        });
      }
      
      if (input.fluid.density.value <= 0) {
        return reply.status(400).send({
          error: 'Fluid density must be positive'
        });
      }
      
      if (input.fluid.viscosity.value <= 0) {
        return reply.status(400).send({
          error: 'Fluid viscosity must be positive'
        });
      }
      
      // Validate target value unit based on target type
      if (input.target === 'velocity') {
        if (!['m/s', 'ft/s', 'km/h'].includes(input.value.unit)) {
          return reply.status(400).send({
            error: 'Invalid velocity unit. Use m/s, ft/s, or km/h.'
          });
        }
      } else {
        if (!['Pa', 'kPa', 'bar', 'psi'].includes(input.value.unit)) {
          return reply.status(400).send({
            error: 'Invalid pressure unit. Use Pa, kPa, bar, or psi.'
          });
        }
      }
      
      const result = sizePipeForTarget(input);
      return reply.send(result);
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
