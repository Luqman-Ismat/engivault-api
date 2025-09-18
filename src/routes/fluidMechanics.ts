import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  calculateOpenChannelFlow,
  calculateCompressibleFlow,
  calculateBoundaryLayer,
  calculateExternalFlow,
  calculateNormalShock,
  calculateChokedFlow,
  OpenChannelFlowInput,
  CompressibleFlowInput,
  BoundaryLayerInput,
  ExternalFlowInput
} from '../logic/fluidMechanics';
import { createSuccessResponse, AppError, handleAsync } from '../utils/errorHandler';
import logger from '../utils/logger';

export default async function fluidMechanicsRoutes(fastify: FastifyInstance): Promise<void> {
  // Open Channel Flow Calculation
  fastify.post('/api/v1/fluid-mechanics/open-channel-flow', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Fluid Mechanics'],
      summary: 'Calculate open channel flow',
      description: 'Calculate open channel flow using Manning\'s equation',
      body: {
        type: 'object',
        required: ['flowRate', 'channelWidth', 'channelSlope', 'manningSCoeff'],
        properties: {
          flowRate: { type: 'number', minimum: 0, description: 'Flow rate in m³/s' },
          channelWidth: { type: 'number', minimum: 0, description: 'Channel width in m' },
          channelSlope: { type: 'number', minimum: 0, description: 'Channel slope (dimensionless)' },
          manningSCoeff: { type: 'number', minimum: 0, description: 'Manning\'s roughness coefficient' },
          channelShape: { type: 'string', enum: ['rectangular', 'trapezoidal', 'circular'], default: 'rectangular' },
          sideSlope: { type: 'number', minimum: 0, default: 0, description: 'Side slope for trapezoidal (m:1)' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                normalDepth: { type: 'number', description: 'Normal depth in m' },
                criticalDepth: { type: 'number', description: 'Critical depth in m' },
                velocity: { type: 'number', description: 'Average velocity in m/s' },
                froudeNumber: { type: 'number', description: 'Froude number' },
                flowRegime: { type: 'string', description: 'Flow regime' },
                hydraulicRadius: { type: 'number', description: 'Hydraulic radius in m' },
                wettedPerimeter: { type: 'number', description: 'Wetted perimeter in m' },
                topWidth: { type: 'number', description: 'Top width in m' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as OpenChannelFlowInput;
    
    logger.info({
      flowRate: input.flowRate,
      channelWidth: input.channelWidth,
      channelShape: input.channelShape || 'rectangular'
    }, 'Open channel flow calculation requested');
    
    // Validate inputs
    if (input.channelSlope <= 0) {
      throw new AppError('Channel slope must be greater than 0', 400);
    }
    
    if (input.manningSCoeff <= 0) {
      throw new AppError('Manning\'s coefficient must be greater than 0', 400);
    }
    
    const result = calculateOpenChannelFlow(input);
    
    return reply.send(createSuccessResponse(result));
  }));

  // Compressible Flow Calculation
  fastify.post('/api/v1/fluid-mechanics/compressible-flow', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Fluid Mechanics'],
      summary: 'Calculate compressible flow properties',
      description: 'Calculate compressible flow properties using isentropic relations',
      body: {
        type: 'object',
        required: ['temperature', 'pressure', 'gasProperties'],
        properties: {
          machNumber: { type: 'number', minimum: 0, description: 'Mach number (if known)' },
          velocity: { type: 'number', minimum: 0, description: 'Velocity in m/s (if Mach unknown)' },
          temperature: { type: 'number', minimum: 0, description: 'Temperature in K' },
          pressure: { type: 'number', minimum: 0, description: 'Pressure in Pa' },
          gasProperties: {
            type: 'object',
            required: ['gamma', 'gasConstant', 'molecularWeight'],
            properties: {
              gamma: { type: 'number', minimum: 1, description: 'Specific heat ratio' },
              gasConstant: { type: 'number', minimum: 0, description: 'Specific gas constant in J/kg·K' },
              molecularWeight: { type: 'number', minimum: 0, description: 'Molecular weight in kg/kmol' }
            }
          },
          flowType: { type: 'string', enum: ['isentropic', 'fanno', 'rayleigh'], default: 'isentropic' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                machNumber: { type: 'number', description: 'Mach number' },
                velocity: { type: 'number', description: 'Velocity in m/s' },
                speedOfSound: { type: 'number', description: 'Speed of sound in m/s' },
                stagnationTemperature: { type: 'number', description: 'Stagnation temperature in K' },
                stagnationPressure: { type: 'number', description: 'Stagnation pressure in Pa' },
                density: { type: 'number', description: 'Density in kg/m³' },
                flowRegime: { type: 'string', description: 'Flow regime' },
                pressureRatio: { type: 'number', description: 'p/p₀' },
                temperatureRatio: { type: 'number', description: 'T/T₀' },
                densityRatio: { type: 'number', description: 'ρ/ρ₀' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as CompressibleFlowInput;
    
    logger.info({
      temperature: input.temperature,
      pressure: input.pressure,
      gamma: input.gasProperties.gamma
    }, 'Compressible flow calculation requested');
    
    // Validate that either Mach number or velocity is provided
    if (input.machNumber === undefined && input.velocity === undefined) {
      throw new AppError('Either machNumber or velocity must be provided', 400);
    }
    
    const result = calculateCompressibleFlow(input);
    
    return reply.send(createSuccessResponse(result));
  }));

  // Boundary Layer Analysis
  fastify.post('/api/v1/fluid-mechanics/boundary-layer', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Fluid Mechanics'],
      summary: 'Calculate boundary layer properties',
      description: 'Calculate boundary layer thickness and properties for flat plate',
      body: {
        type: 'object',
        required: ['velocity', 'distance', 'fluidProperties'],
        properties: {
          velocity: { type: 'number', minimum: 0, description: 'Free stream velocity in m/s' },
          distance: { type: 'number', minimum: 0, description: 'Distance from leading edge in m' },
          fluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'kinematicViscosity'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Dynamic viscosity in Pa·s' },
              kinematicViscosity: { type: 'number', minimum: 0, description: 'Kinematic viscosity in m²/s' }
            }
          },
          surfaceRoughness: { type: 'number', minimum: 0, description: 'Surface roughness in m' },
          plateLength: { type: 'number', minimum: 0, description: 'Total plate length in m' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                reynoldsNumber: { type: 'number', description: 'Reynolds number' },
                boundaryLayerThickness: { type: 'number', description: 'Boundary layer thickness in m' },
                displacementThickness: { type: 'number', description: 'Displacement thickness in m' },
                momentumThickness: { type: 'number', description: 'Momentum thickness in m' },
                skinFrictionCoefficient: { type: 'number', description: 'Skin friction coefficient' },
                wallShearStress: { type: 'number', description: 'Wall shear stress in Pa' },
                flowRegime: { type: 'string', description: 'Flow regime' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as BoundaryLayerInput;
    
    logger.info({
      velocity: input.velocity,
      distance: input.distance
    }, 'Boundary layer calculation requested');
    
    const result = calculateBoundaryLayer(input);
    
    return reply.send(createSuccessResponse(result));
  }));

  // External Flow Analysis
  fastify.post('/api/v1/fluid-mechanics/external-flow', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Fluid Mechanics'],
      summary: 'Calculate external flow drag and lift',
      description: 'Calculate drag and lift coefficients for external flow over objects',
      body: {
        type: 'object',
        required: ['velocity', 'characteristicLength', 'fluidProperties', 'geometry'],
        properties: {
          velocity: { type: 'number', minimum: 0, description: 'Free stream velocity in m/s' },
          characteristicLength: { type: 'number', minimum: 0, description: 'Characteristic length in m' },
          fluidProperties: {
            type: 'object',
            required: ['density', 'viscosity'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Dynamic viscosity in Pa·s' }
            }
          },
          geometry: { 
            type: 'string', 
            enum: ['sphere', 'cylinder', 'flat_plate', 'airfoil'],
            description: 'Object geometry'
          },
          angleOfAttack: { type: 'number', description: 'Angle of attack in degrees (for airfoil)' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                reynoldsNumber: { type: 'number', description: 'Reynolds number' },
                dragCoefficient: { type: 'number', description: 'Drag coefficient' },
                liftCoefficient: { type: 'number', description: 'Lift coefficient (if applicable)' },
                dragForce: { type: 'number', description: 'Drag force in N' },
                liftForce: { type: 'number', description: 'Lift force in N (if applicable)' },
                pressureCoefficient: { type: 'number', description: 'Pressure coefficient' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as ExternalFlowInput;
    
    logger.info({
      geometry: input.geometry,
      velocity: input.velocity,
      characteristicLength: input.characteristicLength
    }, 'External flow calculation requested');
    
    const result = calculateExternalFlow(input);
    
    return reply.send(createSuccessResponse(result));
  }));

  // Normal Shock Wave Analysis
  fastify.post('/api/v1/fluid-mechanics/normal-shock', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Fluid Mechanics'],
      summary: 'Calculate normal shock wave properties',
      description: 'Calculate properties across a normal shock wave',
      body: {
        type: 'object',
        required: ['machNumber1'],
        properties: {
          machNumber1: { type: 'number', minimum: 1, description: 'Upstream Mach number (must be > 1)' },
          gamma: { type: 'number', minimum: 1, default: 1.4, description: 'Specific heat ratio' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                machNumber2: { type: 'number', description: 'Downstream Mach number' },
                pressureRatio: { type: 'number', description: 'Pressure ratio (p₂/p₁)' },
                densityRatio: { type: 'number', description: 'Density ratio (ρ₂/ρ₁)' },
                temperatureRatio: { type: 'number', description: 'Temperature ratio (T₂/T₁)' },
                stagnationPressureRatio: { type: 'number', description: 'Stagnation pressure ratio' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const { machNumber1, gamma = 1.4 } = request.body as any;
    
    logger.info({
      machNumber1,
      gamma
    }, 'Normal shock calculation requested');
    
    if (machNumber1 <= 1.0) {
      throw new AppError('Normal shock requires supersonic upstream flow (M₁ > 1)', 400);
    }
    
    const result = calculateNormalShock(machNumber1, gamma);
    
    return reply.send(createSuccessResponse(result));
  }));

  // Choked Flow Analysis
  fastify.post('/api/v1/fluid-mechanics/choked-flow', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Fluid Mechanics'],
      summary: 'Calculate choked flow properties',
      description: 'Calculate critical flow properties for choked flow conditions',
      body: {
        type: 'object',
        required: ['stagnationTemperature', 'stagnationPressure'],
        properties: {
          stagnationTemperature: { type: 'number', minimum: 0, description: 'Stagnation temperature in K' },
          stagnationPressure: { type: 'number', minimum: 0, description: 'Stagnation pressure in Pa' },
          gamma: { type: 'number', minimum: 1, default: 1.4, description: 'Specific heat ratio' },
          gasConstant: { type: 'number', minimum: 0, default: 287, description: 'Specific gas constant in J/kg·K' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                criticalTemperature: { type: 'number', description: 'Critical temperature in K' },
                criticalPressure: { type: 'number', description: 'Critical pressure in Pa' },
                criticalDensity: { type: 'number', description: 'Critical density in kg/m³' },
                criticalVelocity: { type: 'number', description: 'Critical velocity in m/s' },
                massFlowRate: { type: 'number', description: 'Mass flow rate per unit area in kg/s·m²' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const { stagnationTemperature, stagnationPressure, gamma = 1.4, gasConstant = 287 } = request.body as any;
    
    logger.info({
      stagnationTemperature,
      stagnationPressure,
      gamma
    }, 'Choked flow calculation requested');
    
    const result = calculateChokedFlow(stagnationTemperature, stagnationPressure, gamma, gasConstant);
    
    return reply.send(createSuccessResponse(result));
  }));
}
