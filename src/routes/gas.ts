import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import {
  calculateGasFlow,
  fannoLine,
  rayleighLine,
  GasFlowInput,
  FannoLineInput,
  RayleighLineInput,
} from '@/logic/gas';
import { handleError } from '@/utils/errorHandler';
import { ErrorHelper } from '@/utils/errorHelper';

// Custom error for gas flow calculations
class GasFlowError extends Error {
  machNumber?: number;
  reynoldsNumber?: number;
  velocity?: number;
  diameter?: number;

  constructor(
    message: string,
    options?: {
      machNumber?: number;
      reynoldsNumber?: number;
      velocity?: number;
      diameter?: number;
    }
  ) {
    super(message);
    this.name = 'GasFlowError';
    this.machNumber = options?.machNumber;
    this.reynoldsNumber = options?.reynoldsNumber;
    this.velocity = options?.velocity;
    this.diameter = options?.diameter;
  }
}

const zGasProperties = z.object({
  density: zQuantity,
  viscosity: zQuantity,
  molecularWeight: zQuantity,
  specificHeatRatio: z.number().min(1).optional(),
  compressibilityFactor: z.number().min(0).optional(),
});

const zPipeGeometry = z.object({
  diameter: zQuantity,
  length: zQuantity,
  roughness: zQuantity,
});

const zGasFlowRequest = z.object({
  gas: zGasProperties,
  pipe: zPipeGeometry,
  inletPressure: zQuantity,
  outletPressure: zQuantity.optional(),
  massFlowRate: zQuantity,
  temperature: zQuantity,
  model: z.enum(['isothermal', 'adiabatic']),
});

const zGasFlowResponse = z.object({
  inletPressure: zQuantity,
  outletPressure: zQuantity,
  pressureDrop: zQuantity,
  pressureDropPercent: z.number(),
  velocity: zQuantity,
  machNumber: z.number(),
  isChoked: z.boolean(),
  frictionFactor: z.number(),
  reynoldsNumber: z.number(),
  warnings: z.array(z.string()),
  metadata: z.object({
    input: zGasFlowRequest,
    calculations: z.object({
      model: z.enum(['isothermal', 'adiabatic']),
      compressibilityFactor: z.number(),
      specificHeatRatio: z.number().optional(),
      sonicVelocity: z.number(),
      relativeRoughness: z.number(),
    }),
  }),
});

const zGasState = z.object({
  pressure: z.number(),
  temperature: z.number(),
  density: z.number(),
  velocity: z.number(),
  machNumber: z.number(),
  stagnationPressure: z.number(),
  stagnationTemperature: z.number(),
});

const zFannoLineRequest = z.object({
  state0: zGasState,
  length: zQuantity,
  diameter: zQuantity,
  frictionFactor: z.number().min(0),
  specificHeatRatio: z.number().min(1),
  molecularWeight: zQuantity,
});

const zRayleighLineRequest = z.object({
  state0: zGasState,
  heatTransferRate: zQuantity,
  diameter: zQuantity,
  specificHeatRatio: z.number().min(1),
  molecularWeight: zQuantity,
});

const zDuctFlowResponse = z.object({
  states: z.array(zGasState),
  maxLength: z.number().optional(),
  maxHeatTransfer: z.number().optional(),
  isChoked: z.boolean(),
  warnings: z.array(z.string()),
  metadata: z.object({
    input: z.union([zFannoLineRequest, zRayleighLineRequest]),
    calculations: z.object({
      type: z.enum(['fanno', 'rayleigh']),
      specificHeatRatio: z.number(),
      molecularWeight: z.number(),
      sonicConditions: zGasState.optional(),
    }),
  }),
});

export default async function gasRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/gas/pressure-drop',
    {
      schema: {
        description:
          'Calculate gas pressure drop using isothermal or adiabatic models',
        tags: ['Gas'],
        body: zGasFlowRequest,
        response: {
          200: zGasFlowResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const input = request.body as GasFlowInput;

        // Additional validation logic can be moved to a separate validation function if needed
        if (
          input.model === 'adiabatic' &&
          (!input.gas.specificHeatRatio || input.gas.specificHeatRatio <= 1)
        ) {
          throw new GasFlowError(
            'Specific heat ratio must be greater than 1 for adiabatic model'
          );
        }

        const result = calculateGasFlow(input);

        const hints = ErrorHelper.addEngineeringHints('gas_flow', {
          mach: result.machNumber,
          reynolds: result.reynoldsNumber,
          velocity: result.velocity.value,
          diameter: input.pipe.diameter.value,
        });

        if (hints.length > 0) {
          result.warnings.push(...hints.map(h => h.message));
        }

        return reply.send(result);
      } catch (error) {
        const gasError = error as GasFlowError;
        const hints = ErrorHelper.addEngineeringHints('gas_flow', {
          mach: gasError.machNumber,
          reynolds: gasError.reynoldsNumber,
          velocity: gasError.velocity,
          diameter: gasError.diameter,
        });

        return handleError(error, reply, hints);
      }
    }
  );

  fastify.post(
    '/api/v1/gas/fanno',
    {
      schema: {
        description:
          'Calculate Fanno line - gas properties along a duct with friction',
        tags: ['Gas'],
        body: zFannoLineRequest,
        response: {
          200: zDuctFlowResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const input = request.body as FannoLineInput;

        if (input.state0.machNumber >= 1) {
          throw new GasFlowError(
            'Initial Mach number must be subsonic for Fanno line analysis'
          );
        }

        const result = fannoLine(input);
        return reply.send(result);
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  fastify.post(
    '/api/v1/gas/rayleigh',
    {
      schema: {
        description:
          'Calculate Rayleigh line - gas properties along a duct with heat transfer',
        tags: ['Gas Flow'],
        body: zRayleighLineRequest,
        response: {
          200: zDuctFlowResponse,
        },
      },
    },
    async (request, reply) => {
      try {
        const input = request.body as RayleighLineInput;
        const result = rayleighLine(input);
        return reply.send(result);
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
}
