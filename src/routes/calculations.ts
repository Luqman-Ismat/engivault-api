import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { calculatePressureDrop, calculatePumpPerformance, calculateNPSH, calculateFlowRate } from '@/logic/calculations';
import { PressureDropSchema, PumpPerformanceSchema, NPSHSchema } from '@/types';
import { createSuccessResponse, AppError, handleAsync } from '@/utils/errorHandler';
import logger from '@/utils/logger';

export default async function calculationRoutes(fastify: FastifyInstance): Promise<void> {
  // Pressure Drop Calculation
  fastify.post('/api/v1/hydraulics/pressure-drop', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Hydraulics'],
      summary: 'Calculate pressure drop',
      description: 'Calculate pressure drop using Darcy-Weisbach equation',
      body: {
        type: 'object',
        required: ['flowRate', 'pipeDiameter', 'pipeLength', 'fluidDensity', 'fluidViscosity'],
        properties: {
          flowRate: { type: 'number', minimum: 0 },
          pipeDiameter: { type: 'number', minimum: 0 },
          pipeLength: { type: 'number', minimum: 0 },
          fluidDensity: { type: 'number', minimum: 0 },
          fluidViscosity: { type: 'number', minimum: 0 },
          pipeRoughness: { type: 'number', minimum: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                pressureDrop: { type: 'number' },
                reynoldsNumber: { type: 'number' },
                frictionFactor: { type: 'number' },
                velocity: { type: 'number' },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = PressureDropSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    const result = calculatePressureDrop(input);
    
    logger.info({ userId, calculationType: 'pressure-drop' }, 'Pressure drop calculation completed');
    
    const response = createSuccessResponse(result);
    return reply.send(response);
  }));

  // Pump Performance Calculation
  fastify.post('/api/v1/pumps/performance', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Pumps'],
      summary: 'Calculate pump performance',
      description: 'Calculate pump hydraulic power, brake power, and specific speed',
      body: {
        type: 'object',
        required: ['flowRate', 'head', 'efficiency', 'power'],
        properties: {
          flowRate: { type: 'number', minimum: 0 },
          head: { type: 'number', minimum: 0 },
          efficiency: { type: 'number', minimum: 0, maximum: 1 },
          power: { type: 'number', minimum: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                hydraulicPower: { type: 'number' },
                brakePower: { type: 'number' },
                specificSpeed: { type: 'number' },
                efficiency: { type: 'number' },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = PumpPerformanceSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    const result = calculatePumpPerformance(input);
    
    logger.info({ userId, calculationType: 'pump-performance' }, 'Pump performance calculation completed');
    
    const response = createSuccessResponse(result);
    return reply.send(response);
  }));

  // NPSH Calculation
  fastify.post('/api/v1/pumps/npsh', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Pumps'],
      summary: 'Calculate NPSH',
      description: 'Calculate Net Positive Suction Head available and required',
      body: {
        type: 'object',
        required: ['suctionPressure', 'vaporPressure', 'fluidDensity', 'suctionVelocity', 'suctionLosses'],
        properties: {
          suctionPressure: { type: 'number' },
          vaporPressure: { type: 'number' },
          fluidDensity: { type: 'number', minimum: 0 },
          suctionVelocity: { type: 'number', minimum: 0 },
          suctionLosses: { type: 'number', minimum: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                npshAvailable: { type: 'number' },
                npshRequired: { type: 'number' },
                margin: { type: 'number' },
                isCavitationRisk: { type: 'boolean' },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = NPSHSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    const result = calculateNPSH(input);
    
    logger.info({ userId, calculationType: 'npsh' }, 'NPSH calculation completed');
    
    const response = createSuccessResponse(result);
    return reply.send(response);
  }));

  // Flow Rate Calculation
  fastify.post('/api/v1/hydraulics/flow-rate', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Hydraulics'],
      summary: 'Calculate flow rate',
      description: 'Calculate flow rate from pressure drop using iterative method',
      body: {
        type: 'object',
        required: ['pressureDrop', 'pipeDiameter', 'pipeLength', 'fluidDensity', 'fluidViscosity'],
        properties: {
          pressureDrop: { type: 'number', minimum: 0 },
          pipeDiameter: { type: 'number', minimum: 0 },
          pipeLength: { type: 'number', minimum: 0 },
          fluidDensity: { type: 'number', minimum: 0 },
          fluidViscosity: { type: 'number', minimum: 0 },
          pipeRoughness: { type: 'number', minimum: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                flowRate: { type: 'number' },
                velocity: { type: 'number' },
                reynoldsNumber: { type: 'number' },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const userId = (request.user as any).userId;
    
    const { pressureDrop, pipeDiameter, pipeLength, fluidDensity, fluidViscosity, pipeRoughness = 0.00015 } = body;
    
    if (!pressureDrop || !pipeDiameter || !pipeLength || !fluidDensity || !fluidViscosity) {
      throw new AppError('Missing required parameters', 400);
    }
    
    const result = calculateFlowRate(pressureDrop, pipeDiameter, pipeLength, fluidDensity, fluidViscosity, pipeRoughness);
    
    logger.info({ userId, calculationType: 'flow-rate' }, 'Flow rate calculation completed');
    
    const response = createSuccessResponse(result);
    return reply.send(response);
  }));
}
