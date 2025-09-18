import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  calculateHeatExchangerArea,
  calculateLMTD,
  calculateEffectivenessNTU,
  calculateConvection,
  calculateFin,
  calculateThermalResistance,
  calculateOverallU,
  HeatExchangerInput,
  EffectivenessNTUInput,
  ConvectionInput,
  FinInput,
  ThermalResistanceInput
} from '../logic/heatTransfer';
import { createSuccessResponse, AppError, handleAsync } from '../utils/errorHandler';
import logger from '../utils/logger';

export default async function heatTransferRoutes(fastify: FastifyInstance): Promise<void> {
  // Heat Exchanger Area Calculation
  fastify.post('/api/v1/heat-transfer/heat-exchanger-area', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Heat Transfer'],
      summary: 'Calculate heat exchanger area',
      description: 'Calculate heat exchanger area using LMTD method',
      body: {
        type: 'object',
        required: ['heatDuty', 'overallU', 'tHotIn', 'tHotOut', 'tColdIn', 'tColdOut'],
        properties: {
          heatDuty: { type: 'number', minimum: 0, description: 'Heat duty in W' },
          overallU: { type: 'number', minimum: 0, description: 'Overall heat transfer coefficient in W/m²·K' },
          tHotIn: { type: 'number', minimum: 0, description: 'Hot fluid inlet temperature in K' },
          tHotOut: { type: 'number', minimum: 0, description: 'Hot fluid outlet temperature in K' },
          tColdIn: { type: 'number', minimum: 0, description: 'Cold fluid inlet temperature in K' },
          tColdOut: { type: 'number', minimum: 0, description: 'Cold fluid outlet temperature in K' },
          flowArrangement: { type: 'string', enum: ['counterflow', 'parallel', 'crossflow'], default: 'counterflow' }
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
                area: { type: 'number', description: 'Heat transfer area in m²' },
                lmtd: { type: 'number', description: 'Log mean temperature difference in K' },
                effectiveness: { type: 'number', description: 'Heat exchanger effectiveness (0-1)' },
                ntu: { type: 'number', description: 'Number of transfer units' },
                capacityRatio: { type: 'number', description: 'Capacity rate ratio' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as HeatExchangerInput;
    
    logger.info({
      heatDuty: input.heatDuty,
      overallU: input.overallU
    }, 'Heat exchanger area calculation requested');
    
    // Validate temperature inputs
    if (input.tHotIn <= input.tHotOut) {
      throw new AppError('Hot fluid inlet temperature must be greater than outlet temperature', 400);
    }
    
    if (input.tColdOut <= input.tColdIn) {
      throw new AppError('Cold fluid outlet temperature must be greater than inlet temperature', 400);
    }
    
    const result = calculateHeatExchangerArea(input);
    
    return reply.send(createSuccessResponse(result));
  }));

  // LMTD Calculation
  fastify.post('/api/v1/heat-transfer/lmtd', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Heat Transfer'],
      summary: 'Calculate LMTD',
      description: 'Calculate Log Mean Temperature Difference',
      body: {
        type: 'object',
        required: ['tHotIn', 'tHotOut', 'tColdIn', 'tColdOut'],
        properties: {
          tHotIn: { type: 'number', description: 'Hot fluid inlet temperature in K' },
          tHotOut: { type: 'number', description: 'Hot fluid outlet temperature in K' },
          tColdIn: { type: 'number', description: 'Cold fluid inlet temperature in K' },
          tColdOut: { type: 'number', description: 'Cold fluid outlet temperature in K' },
          flowArrangement: { type: 'string', enum: ['counterflow', 'parallel'], default: 'counterflow' }
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
                lmtd: { type: 'number', description: 'Log mean temperature difference in K' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const { tHotIn, tHotOut, tColdIn, tColdOut, flowArrangement = 'counterflow' } = request.body as any;
    
    logger.info({
      flowArrangement
    }, 'LMTD calculation requested');
    
    const lmtd = calculateLMTD(tHotIn, tHotOut, tColdIn, tColdOut, flowArrangement);
    
    return reply.send(createSuccessResponse({ lmtd }));
  }));

  // Effectiveness-NTU Calculation
  fastify.post('/api/v1/heat-transfer/effectiveness-ntu', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Heat Transfer'],
      summary: 'Calculate effectiveness using NTU method',
      description: 'Calculate heat exchanger effectiveness using NTU method',
      body: {
        type: 'object',
        required: ['ntu', 'capacityRatio', 'flowArrangement'],
        properties: {
          ntu: { type: 'number', minimum: 0, description: 'Number of transfer units' },
          capacityRatio: { type: 'number', minimum: 0, maximum: 1, description: 'Capacity rate ratio (Cmin/Cmax)' },
          flowArrangement: { type: 'string', enum: ['counterflow', 'parallel', 'crossflow_unmixed'], description: 'Flow arrangement' }
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
                effectiveness: { type: 'number', description: 'Heat exchanger effectiveness (0-1)' },
                maxHeatTransfer: { type: 'number', description: 'Maximum possible heat transfer factor' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as EffectivenessNTUInput;
    
    logger.info({
      ntu: input.ntu,
      capacityRatio: input.capacityRatio,
      flowArrangement: input.flowArrangement
    }, 'Effectiveness-NTU calculation requested');
    
    const result = calculateEffectivenessNTU(input);
    
    return reply.send(createSuccessResponse(result));
  }));

  // Convective Heat Transfer Coefficient
  fastify.post('/api/v1/heat-transfer/convection', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Heat Transfer'],
      summary: 'Calculate convective heat transfer coefficient',
      description: 'Calculate convective heat transfer coefficient for various geometries',
      body: {
        type: 'object',
        required: ['fluidVelocity', 'characteristicLength', 'fluidProperties', 'surfaceTemperature', 'fluidTemperature', 'geometry'],
        properties: {
          fluidVelocity: { type: 'number', minimum: 0, description: 'Fluid velocity in m/s' },
          characteristicLength: { type: 'number', minimum: 0, description: 'Characteristic length in m' },
          fluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'thermalConductivity', 'specificHeat'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Dynamic viscosity in Pa·s' },
              thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
              specificHeat: { type: 'number', minimum: 0, description: 'Specific heat in J/kg·K' }
            }
          },
          surfaceTemperature: { type: 'number', description: 'Surface temperature in K' },
          fluidTemperature: { type: 'number', description: 'Bulk fluid temperature in K' },
          geometry: { 
            type: 'string', 
            enum: ['flat_plate', 'cylinder', 'sphere', 'tube_internal', 'tube_external'],
            description: 'Geometry type'
          }
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
                prandtlNumber: { type: 'number', description: 'Prandtl number' },
                nusseltNumber: { type: 'number', description: 'Nusselt number' },
                heatTransferCoefficient: { type: 'number', description: 'Heat transfer coefficient in W/m²·K' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as ConvectionInput;
    
    logger.info({
      geometry: input.geometry,
      velocity: input.fluidVelocity
    }, 'Convection calculation requested');
    
    const result = calculateConvection(input);
    
    return reply.send(createSuccessResponse(result));
  }));

  // Fin Analysis
  fastify.post('/api/v1/heat-transfer/fin-analysis', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Heat Transfer'],
      summary: 'Calculate fin performance',
      description: 'Calculate fin efficiency, effectiveness, and heat transfer rate',
      body: {
        type: 'object',
        required: ['finLength', 'finThickness', 'finWidth', 'thermalConductivity', 'heatTransferCoefficient', 'baseTemperature', 'ambientTemperature'],
        properties: {
          finLength: { type: 'number', minimum: 0, description: 'Fin length in m' },
          finThickness: { type: 'number', minimum: 0, description: 'Fin thickness in m' },
          finWidth: { type: 'number', minimum: 0, description: 'Fin width in m' },
          thermalConductivity: { type: 'number', minimum: 0, description: 'Fin material thermal conductivity in W/m·K' },
          heatTransferCoefficient: { type: 'number', minimum: 0, description: 'Convective heat transfer coefficient in W/m²·K' },
          baseTemperature: { type: 'number', description: 'Base temperature in K' },
          ambientTemperature: { type: 'number', description: 'Ambient temperature in K' }
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
                finEfficiency: { type: 'number', description: 'Fin efficiency (0-1)' },
                finEffectiveness: { type: 'number', description: 'Fin effectiveness' },
                heatTransferRate: { type: 'number', description: 'Heat transfer rate in W' },
                tipTemperature: { type: 'number', description: 'Fin tip temperature in K' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as FinInput;
    
    logger.info({
      finLength: input.finLength,
      finThickness: input.finThickness
    }, 'Fin analysis requested');
    
    const result = calculateFin(input);
    
    return reply.send(createSuccessResponse(result));
  }));

  // Thermal Resistance Network
  fastify.post('/api/v1/heat-transfer/thermal-resistance', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Heat Transfer'],
      summary: 'Calculate thermal resistance network',
      description: 'Calculate total thermal resistance for multi-layer systems',
      body: {
        type: 'object',
        required: ['layers'],
        properties: {
          layers: {
            type: 'array',
            items: {
              type: 'object',
              required: ['thickness', 'thermalConductivity', 'area'],
              properties: {
                thickness: { type: 'number', minimum: 0, description: 'Layer thickness in m' },
                thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
                area: { type: 'number', minimum: 0, description: 'Heat transfer area in m²' }
              }
            }
          },
          convectionResistances: {
            type: 'array',
            items: {
              type: 'object',
              required: ['heatTransferCoefficient', 'area'],
              properties: {
                heatTransferCoefficient: { type: 'number', minimum: 0, description: 'Heat transfer coefficient in W/m²·K' },
                area: { type: 'number', minimum: 0, description: 'Area in m²' }
              }
            }
          }
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
                totalResistance: { type: 'number', description: 'Total thermal resistance in K/W' },
                conductionResistances: { type: 'array', items: { type: 'number' }, description: 'Individual conduction resistances' },
                convectionResistances: { type: 'array', items: { type: 'number' }, description: 'Individual convection resistances' },
                heatTransferRate: { type: 'number', description: 'Heat transfer rate for unit ΔT in W/K' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as ThermalResistanceInput;
    
    logger.info({
      layerCount: input.layers.length,
      convectionCount: input.convectionResistances?.length || 0
    }, 'Thermal resistance calculation requested');
    
    const result = calculateThermalResistance(input);
    
    return reply.send(createSuccessResponse(result));
  }));

  // Overall Heat Transfer Coefficient for Cylindrical Systems
  fastify.post('/api/v1/heat-transfer/overall-u', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Heat Transfer'],
      summary: 'Calculate overall heat transfer coefficient',
      description: 'Calculate overall U for cylindrical systems (pipes, tubes)',
      body: {
        type: 'object',
        required: ['innerRadius', 'outerRadius', 'wallThermalConductivity', 'innerHTC', 'outerHTC'],
        properties: {
          innerRadius: { type: 'number', minimum: 0, description: 'Inner radius in m' },
          outerRadius: { type: 'number', minimum: 0, description: 'Outer radius in m' },
          wallThermalConductivity: { type: 'number', minimum: 0, description: 'Wall thermal conductivity in W/m·K' },
          innerHTC: { type: 'number', minimum: 0, description: 'Inner heat transfer coefficient in W/m²·K' },
          outerHTC: { type: 'number', minimum: 0, description: 'Outer heat transfer coefficient in W/m²·K' },
          foulingFactorInner: { type: 'number', minimum: 0, default: 0, description: 'Inner fouling factor in m²·K/W' },
          foulingFactorOuter: { type: 'number', minimum: 0, default: 0, description: 'Outer fouling factor in m²·K/W' }
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
                overallU: { type: 'number', description: 'Overall heat transfer coefficient in W/m²·K' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const { 
      innerRadius, 
      outerRadius, 
      wallThermalConductivity, 
      innerHTC, 
      outerHTC, 
      foulingFactorInner = 0, 
      foulingFactorOuter = 0 
    } = request.body as any;
    
    logger.info({
      innerRadius,
      outerRadius
    }, 'Overall U calculation requested');
    
    if (outerRadius <= innerRadius) {
      throw new AppError('Outer radius must be greater than inner radius', 400);
    }
    
    const overallU = calculateOverallU(
      innerRadius, 
      outerRadius, 
      wallThermalConductivity, 
      innerHTC, 
      outerHTC, 
      foulingFactorInner, 
      foulingFactorOuter
    );
    
    return reply.send(createSuccessResponse({ overallU }));
  }));
}
