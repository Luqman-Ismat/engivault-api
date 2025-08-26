import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '../schemas/common';
import { sizeReliefValve, validateReliefValveInputs, type ReliefValveInput } from '../logic/relief';
import { handleError } from '../utils/errorHandler';

// Zod schemas for relief valve sizing
const zReliefValveInput = z.object({
  fluidType: z.enum(['liquid', 'gas']),
  flow: zQuantity,
  pressureDrop: zQuantity,
  specificGravity: z.number().positive().optional(),
  molecularWeight: z.number().positive().optional(),
  temperature: zQuantity.optional(),
  backPressure: zQuantity.optional(),
  dischargeCoefficient: z.number().min(0).max(1).optional(),
  backPressureCorrection: z.number().min(0).max(1).optional(),
  compressibilityFactor: z.number().positive().optional(),
  specificHeatRatio: z.number().gt(1).optional(),
});

const zReliefValveResponse = z.object({
  requiredArea: zQuantity,
  flowRegime: z.enum(['liquid', 'choked-gas', 'non-choked-gas']),
  criticalPressureRatio: z.number().optional(),
  backPressureCorrection: z.number().optional(),
  warnings: z.array(z.union([z.string(), z.object({
    code: z.string(),
    message: z.string(),
    context: z.record(z.any()).optional(),
  })])),
  metadata: z.object({
    input: zReliefValveInput,
    calculations: z.object({
      flowRate: zQuantity,
      pressureDrop: zQuantity,
      dischargeCoefficient: z.number(),
      assumptions: z.array(z.string()),
    }),
  }),
});

// Example relief valve scenarios
const reliefValveExamples = [
  {
    name: 'Water Relief Valve',
    description: 'Liquid relief valve for water service',
    input: {
      fluidType: 'liquid',
      flow: { value: 100, unit: 'gpm' },
      pressureDrop: { value: 50, unit: 'psi' },
      specificGravity: 1.0,
      dischargeCoefficient: 0.65,
    },
  },
  {
    name: 'Air Relief Valve - Choked Flow',
    description: 'Gas relief valve for air service with choked flow',
    input: {
      fluidType: 'gas',
      flow: { value: 1000, unit: 'scfm' },
      pressureDrop: { value: 100, unit: 'psia' },
      molecularWeight: 29,
      temperature: { value: 530, unit: 'R' },
      backPressure: { value: 50, unit: 'psia' },
      dischargeCoefficient: 0.65,
    },
  },
  {
    name: 'Natural Gas Relief Valve - Non-Choked',
    description: 'Gas relief valve for natural gas with non-choked flow',
    input: {
      fluidType: 'gas',
      flow: { value: 500, unit: 'scfm' },
      pressureDrop: { value: 100, unit: 'psia' },
      molecularWeight: 16,
      temperature: { value: 530, unit: 'R' },
      backPressure: { value: 80, unit: 'psia' },
      dischargeCoefficient: 0.65,
      specificHeatRatio: 1.32,
    },
  },
  {
    name: 'Heavy Oil Relief Valve',
    description: 'Liquid relief valve for heavy oil service',
    input: {
      fluidType: 'liquid',
      flow: { value: 50, unit: 'gpm' },
      pressureDrop: { value: 25, unit: 'psi' },
      specificGravity: 1.5,
      dischargeCoefficient: 0.65,
    },
  },
];

// Common discharge coefficients
const dischargeCoefficients = [
  { type: 'Conventional Spring Loaded', value: 0.65, description: 'Standard API 526 conventional valve' },
  { type: 'Balanced Bellows', value: 0.65, description: 'Balanced bellows design for back pressure compensation' },
  { type: 'Pilot Operated', value: 0.70, description: 'Pilot-operated relief valve with higher capacity' },
  { type: 'Rupture Disk', value: 0.62, description: 'Rupture disk device' },
  { type: 'Liquid Service', value: 0.65, description: 'Standard for liquid applications' },
  { type: 'Gas Service', value: 0.65, description: 'Standard for gas applications' },
];

// Common fluid properties
const fluidProperties = [
  {
    name: 'Water',
    type: 'liquid',
    specificGravity: 1.0,
    molecularWeight: null,
    specificHeatRatio: null,
  },
  {
    name: 'Air',
    type: 'gas',
    specificGravity: null,
    molecularWeight: 29,
    specificHeatRatio: 1.4,
  },
  {
    name: 'Natural Gas',
    type: 'gas',
    specificGravity: null,
    molecularWeight: 16,
    specificHeatRatio: 1.32,
  },
  {
    name: 'Steam',
    type: 'gas',
    specificGravity: null,
    molecularWeight: 18,
    specificHeatRatio: 1.33,
  },
  {
    name: 'Propane',
    type: 'gas',
    specificGravity: null,
    molecularWeight: 44,
    specificHeatRatio: 1.13,
  },
  {
    name: 'Heavy Oil',
    type: 'liquid',
    specificGravity: 1.5,
    molecularWeight: null,
    specificHeatRatio: null,
  },
];

export default async function reliefRoutes(fastify: FastifyInstance) {
  // POST /api/v1/safety/relief-size
  fastify.post('/api/v1/safety/relief-size', {
    schema: {
      description: 'Size relief valve for given conditions',
      tags: ['Safety'],
      body: zReliefValveInput,
      response: {
        200: zReliefValveResponse,
        400: z.object({
          error: z.string(),
          code: z.string(),
          details: z.array(z.string()).optional(),
        }),
        422: z.object({
          error: z.string(),
          code: z.string(),
          details: z.array(z.string()).optional(),
        }),
        500: z.object({
          error: z.string(),
          code: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    try {
      const input = request.body as ReliefValveInput;
      
      // Validate inputs
      const validation = validateReliefValveInputs(input);
      if (!validation.isValid) {
        return reply.status(400).send({
          error: 'Invalid input parameters',
          code: 'VALIDATION_ERROR',
          details: validation.errors,
        });
      }
      
      // Size relief valve
      const result = sizeReliefValve(input);
      
      return reply.send(result);
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // GET /api/v1/safety/relief-examples
  fastify.get('/api/v1/safety/relief-examples', {
    schema: {
      description: 'Get example relief valve sizing scenarios',
      tags: ['Safety'],
      response: {
        200: z.object({
          examples: z.array(z.object({
            name: z.string(),
            description: z.string(),
            input: zReliefValveInput,
          })),
        }),
      },
    },
  }, async (request, reply) => {
    return reply.send({ examples: reliefValveExamples });
  });

  // GET /api/v1/safety/discharge-coefficients
  fastify.get('/api/v1/safety/discharge-coefficients', {
    schema: {
      description: 'Get common discharge coefficients for relief valves',
      tags: ['Safety'],
      response: {
        200: z.object({
          coefficients: z.array(z.object({
            type: z.string(),
            value: z.number(),
            description: z.string(),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    return reply.send({ coefficients: dischargeCoefficients });
  });

  // GET /api/v1/safety/fluid-properties
  fastify.get('/api/v1/safety/fluid-properties', {
    schema: {
      description: 'Get common fluid properties for relief valve sizing',
      tags: ['Safety'],
      response: {
        200: z.object({
          fluids: z.array(z.object({
            name: z.string(),
            type: z.enum(['liquid', 'gas']),
            specificGravity: z.number().nullable(),
            molecularWeight: z.number().nullable(),
            specificHeatRatio: z.number().nullable(),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    return reply.send({ fluids: fluidProperties });
  });
}

