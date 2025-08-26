import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import { calculateGasFlow, fannoLine, rayleighLine, GasFlowInput, FannoLineInput, RayleighLineInput } from '@/logic/gas';
import { handleError } from '@/utils/errorHandler';

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
        description: 'Calculate gas pressure drop using isothermal or adiabatic models',
        tags: ['Gas Flow'],
        body: {
          type: 'object',
          properties: {
            gas: {
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
                molecularWeight: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                specificHeatRatio: { type: 'number', minimum: 1 },
                compressibilityFactor: { type: 'number', minimum: 0 },
              },
              required: ['density', 'viscosity', 'molecularWeight'],
            },
            pipe: {
              type: 'object',
              properties: {
                diameter: {
                  type: 'object',
                  properties: { value: { type: 'number' }, unit: { type: 'string' } },
                  required: ['value', 'unit'],
                },
                length: {
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
              required: ['diameter', 'length', 'roughness'],
            },
            inletPressure: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            outletPressure: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            massFlowRate: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            temperature: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            model: { 
              type: 'string', 
              enum: ['isothermal', 'adiabatic'] 
            },
          },
          required: ['gas', 'pipe', 'inletPressure', 'massFlowRate', 'temperature', 'model'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              inletPressure: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              outletPressure: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              pressureDrop: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              pressureDropPercent: { type: 'number' },
              velocity: {
                type: 'object',
                properties: { value: { type: 'number' }, unit: { type: 'string' } },
                required: ['value', 'unit'],
              },
              machNumber: { type: 'number' },
              isChoked: { type: 'boolean' },
              frictionFactor: { type: 'number' },
              reynoldsNumber: { type: 'number' },
              warnings: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                  calculations: {
                    type: 'object',
                    properties: {
                      model: { type: 'string', enum: ['isothermal', 'adiabatic'] },
                      compressibilityFactor: { type: 'number' },
                      specificHeatRatio: { type: 'number' },
                      sonicVelocity: { type: 'number' },
                      relativeRoughness: { type: 'number' },
                    },
                    required: ['model', 'compressibilityFactor', 'sonicVelocity', 'relativeRoughness'],
                  },
                },
                required: ['input', 'calculations'],
              },
            },
            required: ['inletPressure', 'outletPressure', 'pressureDrop', 'pressureDropPercent', 'velocity', 'machNumber', 'isChoked', 'frictionFactor', 'reynoldsNumber', 'warnings', 'metadata'],
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
        const input = zGasFlowRequest.parse(request.body);
        
        // Validate gas properties
        if (input.gas.density.value <= 0 || input.gas.viscosity.value <= 0 || input.gas.molecularWeight.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Gas properties must be positive'
          });
        }
        
        // Validate pipe geometry
        if (input.pipe.diameter.value <= 0 || input.pipe.length.value <= 0 || input.pipe.roughness.value < 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Pipe diameter and length must be positive, roughness must be non-negative'
          });
        }
        
        // Validate flow conditions
        if (input.inletPressure.value <= 0 || input.massFlowRate.value <= 0 || input.temperature.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Inlet pressure, mass flow rate, and temperature must be positive'
          });
        }
        
        // Validate adiabatic model requirements
        if (input.model === 'adiabatic' && input.gas.specificHeatRatio !== undefined) {
          if (input.gas.specificHeatRatio <= 1) {
            return reply.status(400).send({
              error: 'ValidationError',
              message: 'Specific heat ratio must be greater than 1 for adiabatic flow'
            });
          }
        }
        
        // Validate compressibility factor if provided
        if (input.gas.compressibilityFactor !== undefined) {
          if (input.gas.compressibilityFactor <= 0) {
            return reply.status(400).send({
              error: 'ValidationError',
              message: 'Compressibility factor must be positive'
            });
          }
        }
        
        const result = calculateGasFlow(input);
        
        return reply.send(result);
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );

  fastify.post(
    '/api/v1/gas/fanno',
    {
      schema: {
        description: 'Calculate Fanno line - gas properties along a duct with friction',
        tags: ['Gas Flow'],
        body: {
          type: 'object',
          properties: {
            state0: {
              type: 'object',
              properties: {
                pressure: { type: 'number' },
                temperature: { type: 'number' },
                density: { type: 'number' },
                velocity: { type: 'number' },
                machNumber: { type: 'number' },
                stagnationPressure: { type: 'number' },
                stagnationTemperature: { type: 'number' },
              },
              required: ['pressure', 'temperature', 'density', 'velocity', 'machNumber', 'stagnationPressure', 'stagnationTemperature'],
            },
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
            frictionFactor: { type: 'number', minimum: 0 },
            specificHeatRatio: { type: 'number', minimum: 1 },
            molecularWeight: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
          },
          required: ['state0', 'length', 'diameter', 'frictionFactor', 'specificHeatRatio', 'molecularWeight'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              states: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    pressure: { type: 'number' },
                    temperature: { type: 'number' },
                    density: { type: 'number' },
                    velocity: { type: 'number' },
                    machNumber: { type: 'number' },
                    stagnationPressure: { type: 'number' },
                    stagnationTemperature: { type: 'number' },
                  },
                  required: ['pressure', 'temperature', 'density', 'velocity', 'machNumber', 'stagnationPressure', 'stagnationTemperature'],
                },
              },
              maxLength: { type: 'number' },
              isChoked: { type: 'boolean' },
              warnings: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                  calculations: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['fanno'] },
                      specificHeatRatio: { type: 'number' },
                      molecularWeight: { type: 'number' },
                      sonicConditions: { type: 'object' },
                    },
                    required: ['type', 'specificHeatRatio', 'molecularWeight'],
                  },
                },
                required: ['input', 'calculations'],
              },
            },
            required: ['states', 'isChoked', 'warnings', 'metadata'],
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
        const input = zFannoLineRequest.parse(request.body);
        
        // Validate gas state
        if (input.state0.pressure <= 0 || input.state0.temperature <= 0 || input.state0.density <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Gas state properties must be positive'
          });
        }
        
        // Validate duct parameters
        if (input.length.value <= 0 || input.diameter.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Length and diameter must be positive'
          });
        }
        
        // Validate initial Mach number
        if (input.state0.machNumber >= 1) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Initial Mach number must be subsonic for Fanno line analysis'
          });
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
        description: 'Calculate Rayleigh line - gas properties along a duct with heat transfer',
        tags: ['Gas Flow'],
        body: {
          type: 'object',
          properties: {
            state0: {
              type: 'object',
              properties: {
                pressure: { type: 'number' },
                temperature: { type: 'number' },
                density: { type: 'number' },
                velocity: { type: 'number' },
                machNumber: { type: 'number' },
                stagnationPressure: { type: 'number' },
                stagnationTemperature: { type: 'number' },
              },
              required: ['pressure', 'temperature', 'density', 'velocity', 'machNumber', 'stagnationPressure', 'stagnationTemperature'],
            },
            heatTransferRate: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            diameter: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
            specificHeatRatio: { type: 'number', minimum: 1 },
            molecularWeight: {
              type: 'object',
              properties: { value: { type: 'number' }, unit: { type: 'string' } },
              required: ['value', 'unit'],
            },
          },
          required: ['state0', 'heatTransferRate', 'diameter', 'specificHeatRatio', 'molecularWeight'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              states: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    pressure: { type: 'number' },
                    temperature: { type: 'number' },
                    density: { type: 'number' },
                    velocity: { type: 'number' },
                    machNumber: { type: 'number' },
                    stagnationPressure: { type: 'number' },
                    stagnationTemperature: { type: 'number' },
                  },
                  required: ['pressure', 'temperature', 'density', 'velocity', 'machNumber', 'stagnationPressure', 'stagnationTemperature'],
                },
              },
              maxHeatTransfer: { type: 'number' },
              isChoked: { type: 'boolean' },
              warnings: { type: 'array', items: { type: 'string' } },
              metadata: {
                type: 'object',
                properties: {
                  input: { type: 'object' },
                  calculations: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['rayleigh'] },
                      specificHeatRatio: { type: 'number' },
                      molecularWeight: { type: 'number' },
                      sonicConditions: { type: 'object' },
                    },
                    required: ['type', 'specificHeatRatio', 'molecularWeight'],
                  },
                },
                required: ['input', 'calculations'],
              },
            },
            required: ['states', 'isChoked', 'warnings', 'metadata'],
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
        const input = zRayleighLineRequest.parse(request.body);
        
        // Validate gas state
        if (input.state0.pressure <= 0 || input.state0.temperature <= 0 || input.state0.density <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Gas state properties must be positive'
          });
        }
        
        // Validate duct parameters
        if (input.diameter.value <= 0) {
          return reply.status(400).send({
            error: 'ValidationError',
            message: 'Diameter must be positive'
          });
        }
        
        const result = rayleighLine(input);
        
        return reply.send(result);
      } catch (error) {
        return handleError(error, reply);
      }
    }
  );
}
