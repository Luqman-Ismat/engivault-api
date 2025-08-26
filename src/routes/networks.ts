import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import { solveNetwork, NetworkInput } from '@/logic/networks';
import { handleError } from '@/utils/errorHandler';

const zNode = z.object({
  id: z.string(),
  elevation: zQuantity,
  demand: zQuantity.optional(),
});

const zPipe = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  length: zQuantity,
  diameter: zQuantity,
  roughness: zQuantity,
});

const zLoop = z.object({
  id: z.string(),
  pipes: z.array(z.string()),
});

const zFluidProperties = z.object({
  density: zQuantity,
  viscosity: zQuantity,
});

const zNetworkRequest = z.object({
  nodes: z.array(zNode),
  pipes: z.array(zPipe),
  loops: z.array(zLoop),
  fluidProperties: zFluidProperties,
  tolerance: z.number().positive().optional(),
  maxIterations: z.number().positive().optional(),
  initialFlowGuess: z.number().positive().optional(),
});

const zNetworkResponse = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    elevation: zQuantity,
    demand: zQuantity.optional(),
    head: z.number(),
  })),
  pipes: z.array(z.object({
    id: z.string(),
    from: z.string(),
    to: z.string(),
    length: zQuantity,
    diameter: zQuantity,
    roughness: zQuantity,
    flow: z.number(),
    headloss: z.number(),
  })),
  loops: z.array(zLoop),
  convergence: z.object({
    converged: z.boolean(),
    iterations: z.number(),
    finalTolerance: z.number(),
    maxTolerance: z.number(),
  }),
  metadata: z.object({
    input: zNetworkRequest,
    calculations: z.object({
      totalDemand: z.number(),
      totalSupply: z.number(),
      networkBalance: z.number(),
    }),
  }),
});

export default async function networkRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/networks/solve',
    {
      schema: {
        description: 'Solve pipe network using Hardy Cross method',
        tags: ['Networks'],
        body: {
          type: 'object',
          properties: {
            nodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  elevation: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                  demand: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                },
                required: ['id', 'elevation'],
              },
            },
            pipes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  from: { type: 'string' },
                  to: { type: 'string' },
                  length: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                  diameter: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                  roughness: {
                    type: 'object',
                    properties: { value: { type: 'number' }, unit: { type: 'string' } },
                    required: ['value', 'unit'],
                  },
                },
                required: ['id', 'from', 'to', 'length', 'diameter', 'roughness'],
              },
            },
            loops: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  pipes: { type: 'array', items: { type: 'string' } },
                },
                required: ['id', 'pipes'],
              },
            },
            fluidProperties: {
              type: 'object',
              properties: {
                density: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                viscosity: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
              },
              required: ['density', 'viscosity'],
            },
            tolerance: { type: 'number', minimum: 0 },
            maxIterations: { type: 'number', minimum: 1 },
            initialFlowGuess: { type: 'number', minimum: 0 },
          },
          required: ['nodes', 'pipes', 'loops', 'fluidProperties'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              nodes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    elevation: {
                      type: 'object',
                      properties: { value: { type: 'number' }, unit: { type: 'string' } },
                      required: ['value', 'unit'],
                    },
                    demand: {
                      type: 'object',
                      properties: { value: { type: 'number' }, unit: { type: 'string' } },
                      required: ['value', 'unit'],
                    },
                    head: { type: 'number' },
                  },
                  required: ['id', 'elevation', 'head'],
                },
              },
              pipes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    from: { type: 'string' },
                    to: { type: 'string' },
                    length: {
                      type: 'object',
                      properties: { value: { type: 'number' }, unit: { type: 'string' } },
                      required: ['value', 'unit'],
                    },
                    diameter: {
                      type: 'object',
                      properties: { value: { type: 'number' }, unit: { type: 'string' } },
                      required: ['value', 'unit'],
                    },
                    roughness: {
                      type: 'object',
                      properties: { value: { type: 'number' }, unit: { type: 'string' } },
                      required: ['value', 'unit'],
                    },
                    flow: { type: 'number' },
                    headloss: { type: 'number' },
                  },
                  required: ['id', 'from', 'to', 'length', 'diameter', 'roughness', 'flow', 'headloss'],
                },
              },
              loops: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    pipes: { type: 'array', items: { type: 'string' } },
                  },
                  required: ['id', 'pipes'],
                },
              },
              convergence: {
                type: 'object',
                properties: {
                  converged: { type: 'boolean' },
                  iterations: { type: 'number' },
                  finalTolerance: { type: 'number' },
                  maxTolerance: { type: 'number' },
                },
                required: ['converged', 'iterations', 'finalTolerance', 'maxTolerance'],
              },
              metadata: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                  calculations: {
                    type: 'object',
                    properties: {
                      totalDemand: { type: 'number' },
                      totalSupply: { type: 'number' },
                      networkBalance: { type: 'number' },
                    },
                    required: ['totalDemand', 'totalSupply', 'networkBalance'],
                  },
                },
                required: ['input', 'calculations'],
              },
            },
            required: ['nodes', 'pipes', 'loops', 'convergence', 'metadata'],
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
        const input = zNetworkRequest.parse(request.body);
        
        // Validate network connectivity
        const nodeIds = new Set(input.nodes.map(n => n.id));
        const pipeNodeIds = new Set([
          ...input.pipes.map(p => p.from),
          ...input.pipes.map(p => p.to)
        ]);
        
        // Check if all pipe nodes exist
        for (const nodeId of pipeNodeIds) {
          if (!nodeIds.has(nodeId)) {
            return reply.status(400).send({
              error: 'ValidationError',
              message: `Pipe references non-existent node: ${nodeId}`
            });
          }
        }
        
        // Check if all loop pipes exist
        const pipeIds = new Set(input.pipes.map(p => p.id));
        for (const loop of input.loops) {
          for (const pipeId of loop.pipes) {
            if (!pipeIds.has(pipeId)) {
              return reply.status(400).send({
                error: 'ValidationError',
                message: `Loop references non-existent pipe: ${pipeId}`
              });
            }
          }
        }
        
        const result = solveNetwork(input);
        
        return reply.send(result);
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
}
