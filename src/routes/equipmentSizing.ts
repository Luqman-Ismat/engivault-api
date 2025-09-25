import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  calculatePumpSizing,
  calculateHeatExchangerSizing,
  calculateVesselSizing,
  calculatePipingSizing,
  selectPumpFromCatalog,
  analyzePumpPerformanceCurves,
  calculateSystemCurve,
  optimizeShellTubeDesign,
  calculatePlateHeatExchangerSizing,
  calculateAirCooledHeatExchangerSizing,
  rateHeatExchanger,
  calculatePressureVesselSizing,
  calculateStorageTankSizing,
  calculateSeparatorSizing
} from '../logic/equipmentSizing';
import {
  PumpSizingSchema,
  HeatExchangerSizingSchema,
  VesselSizingSchema,
  PipingSizingSchema
} from '../types';
import { createSuccessResponse, handleAsync } from '../utils/errorHandler';
import logger from '../utils/logger';

export default async function equipmentSizingRoutes(fastify: FastifyInstance): Promise<void> {
  // ============================================================================
  // PUMP SIZING ENDPOINTS
  // ============================================================================
  
  // Pump Sizing Calculation
  fastify.post('/api/v1/equipment/pumps/sizing', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Calculate pump sizing',
      description: 'Calculate pump sizing based on hydraulic requirements using API 610 standards',
      body: {
        type: 'object',
        required: ['flowRate', 'head', 'fluidDensity', 'fluidViscosity', 'npshAvailable'],
        properties: {
          flowRate: { type: 'number', minimum: 0, description: 'Flow rate in m³/s' },
          head: { type: 'number', minimum: 0, description: 'Pump head in meters' },
          fluidDensity: { type: 'number', minimum: 0, description: 'Fluid density in kg/m³' },
          fluidViscosity: { type: 'number', minimum: 0, description: 'Fluid viscosity in Pa·s' },
          npshAvailable: { type: 'number', minimum: 0, description: 'NPSH available in meters' },
          efficiencyTarget: { type: 'number', minimum: 0, maximum: 1, description: 'Target efficiency (0-1)' },
          pumpType: { type: 'string', enum: ['centrifugal', 'positive_displacement', 'specialty'], description: 'Pump type' },
          operatingHours: { type: 'number', minimum: 0, description: 'Operating hours per year' },
          designTemperature: { type: 'number', description: 'Design temperature in K' },
          designPressure: { type: 'number', minimum: 0, description: 'Design pressure in Pa' }
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
                hydraulicPower: { type: 'number', description: 'Hydraulic power in kW' },
                brakePower: { type: 'number', description: 'Brake power in kW' },
                specificSpeed: { type: 'number', description: 'Specific speed' },
                efficiency: { type: 'number', description: 'Pump efficiency (0-1)' },
                npshRequired: { type: 'number', description: 'NPSH required in meters' },
                npshMargin: { type: 'number', description: 'NPSH margin in meters' },
                pumpSize: { type: 'string', description: 'Recommended pump size' },
                motorSize: { type: 'string', description: 'Required motor size' },
                references: { type: 'array', items: { type: 'string' }, description: 'Calculation references' },
                standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' },
                calculationMethod: { type: 'string', description: 'Calculation method used' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = PumpSizingSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'pump',
      flowRate: input.flowRate,
      head: input.head
    }, 'Pump sizing calculation requested');
    
    const result = calculatePumpSizing(input);
    
    logger.info({
      userId,
      equipmentType: 'pump',
      hydraulicPower: result.hydraulicPower,
      brakePower: result.brakePower
    }, 'Pump sizing calculation completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // ============================================================================
  // HEAT EXCHANGER SIZING ENDPOINTS
  // ============================================================================
  
  // Heat Exchanger Sizing Calculation
  fastify.post('/api/v1/equipment/heat-exchangers/sizing', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Calculate heat exchanger sizing',
      description: 'Calculate heat exchanger sizing using TEMA standards',
      body: {
        type: 'object',
        required: [
          'heatDuty', 'hotFluidInlet', 'hotFluidOutlet', 'coldFluidInlet', 'coldFluidOutlet',
          'hotFlowRate', 'coldFlowRate', 'designPressure', 'designTemperature',
          'hotFluidProperties', 'coldFluidProperties'
        ],
        properties: {
          heatDuty: { type: 'number', minimum: 0, description: 'Heat duty in W' },
          hotFluidInlet: { type: 'number', minimum: 0, description: 'Hot fluid inlet temperature in K' },
          hotFluidOutlet: { type: 'number', minimum: 0, description: 'Hot fluid outlet temperature in K' },
          coldFluidInlet: { type: 'number', minimum: 0, description: 'Cold fluid inlet temperature in K' },
          coldFluidOutlet: { type: 'number', minimum: 0, description: 'Cold fluid outlet temperature in K' },
          hotFlowRate: { type: 'number', minimum: 0, description: 'Hot fluid flow rate in kg/s' },
          coldFlowRate: { type: 'number', minimum: 0, description: 'Cold fluid flow rate in kg/s' },
          designPressure: { type: 'number', minimum: 0, description: 'Design pressure in Pa' },
          designTemperature: { type: 'number', minimum: 0, description: 'Design temperature in K' },
          hotFluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'thermalConductivity', 'specificHeat'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Viscosity in Pa·s' },
              thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
              specificHeat: { type: 'number', minimum: 0, description: 'Specific heat in J/kg·K' }
            }
          },
          coldFluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'thermalConductivity', 'specificHeat'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Viscosity in Pa·s' },
              thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
              specificHeat: { type: 'number', minimum: 0, description: 'Specific heat in J/kg·K' }
            }
          },
          exchangerType: { type: 'string', enum: ['shell_tube', 'plate', 'air_cooled', 'compact'], description: 'Heat exchanger type' },
          flowArrangement: { type: 'string', enum: ['counterflow', 'parallel', 'crossflow'], description: 'Flow arrangement' }
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
                overallU: { type: 'number', description: 'Overall heat transfer coefficient in W/m²·K' },
                ntu: { type: 'number', description: 'Number of transfer units' },
                effectiveness: { type: 'number', description: 'Heat exchanger effectiveness (0-1)' },
                shellDiameter: { type: 'number', description: 'Shell diameter in m' },
                tubeCount: { type: 'number', description: 'Number of tubes' },
                tubeLength: { type: 'number', description: 'Tube length in m' },
                pressureDropShell: { type: 'number', description: 'Shell-side pressure drop in Pa' },
                pressureDropTube: { type: 'number', description: 'Tube-side pressure drop in Pa' },
                references: { type: 'array', items: { type: 'string' }, description: 'Calculation references' },
                standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' },
                calculationMethod: { type: 'string', description: 'Calculation method used' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = HeatExchangerSizingSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'heat_exchanger',
      heatDuty: input.heatDuty,
      exchangerType: input.exchangerType
    }, 'Heat exchanger sizing calculation requested');
    
    const result = calculateHeatExchangerSizing(input);
    
    logger.info({
      userId,
      equipmentType: 'heat_exchanger',
      area: result.area,
      overallU: result.overallU
    }, 'Heat exchanger sizing calculation completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // Shell and Tube Heat Exchanger Optimization
  fastify.post('/api/v1/equipment/heat-exchangers/shell-tube-optimization', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Optimize shell and tube heat exchanger design',
      description: 'Optimize shell and tube heat exchanger design using TEMA standards',
      body: {
        type: 'object',
        required: [
          'heatDuty', 'hotFluidInlet', 'hotFluidOutlet', 'coldFluidInlet', 'coldFluidOutlet',
          'hotFlowRate', 'coldFlowRate', 'designPressure', 'designTemperature',
          'hotFluidProperties', 'coldFluidProperties'
        ],
        properties: {
          heatDuty: { type: 'number', minimum: 0, description: 'Heat duty in W' },
          hotFluidInlet: { type: 'number', minimum: 0, description: 'Hot fluid inlet temperature in K' },
          hotFluidOutlet: { type: 'number', minimum: 0, description: 'Hot fluid outlet temperature in K' },
          coldFluidInlet: { type: 'number', minimum: 0, description: 'Cold fluid inlet temperature in K' },
          coldFluidOutlet: { type: 'number', minimum: 0, description: 'Cold fluid outlet temperature in K' },
          hotFlowRate: { type: 'number', minimum: 0, description: 'Hot fluid flow rate in kg/s' },
          coldFlowRate: { type: 'number', minimum: 0, description: 'Cold fluid flow rate in kg/s' },
          designPressure: { type: 'number', minimum: 0, description: 'Design pressure in Pa' },
          designTemperature: { type: 'number', minimum: 0, description: 'Design temperature in K' },
          hotFluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'thermalConductivity', 'specificHeat'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Viscosity in Pa·s' },
              thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
              specificHeat: { type: 'number', minimum: 0, description: 'Specific heat in J/kg·K' }
            }
          },
          coldFluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'thermalConductivity', 'specificHeat'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Viscosity in Pa·s' },
              thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
              specificHeat: { type: 'number', minimum: 0, description: 'Specific heat in J/kg·K' }
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
                optimizedDesign: { type: 'object', description: 'Optimized design parameters' },
                shellDiameter: { type: 'number', description: 'Shell diameter in m' },
                tubeCount: { type: 'number', description: 'Number of tubes' },
                tubeLength: { type: 'number', description: 'Tube length in m' },
                tubePitch: { type: 'number', description: 'Tube pitch in m' },
                baffleSpacing: { type: 'number', description: 'Baffle spacing in m' },
                baffleCut: { type: 'number', description: 'Baffle cut percentage' },
                pressureDropShell: { type: 'number', description: 'Shell-side pressure drop in Pa' },
                pressureDropTube: { type: 'number', description: 'Tube-side pressure drop in Pa' },
                overallU: { type: 'number', description: 'Overall heat transfer coefficient in W/m²·K' },
                area: { type: 'number', description: 'Heat transfer area in m²' },
                efficiency: { type: 'number', description: 'Heat exchanger efficiency (0-1)' },
                recommendations: { type: 'array', items: { type: 'string' }, description: 'Design recommendations' },
                references: { type: 'array', items: { type: 'string' }, description: 'Calculation references' },
                standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' },
                calculationMethod: { type: 'string', description: 'Calculation method used' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = HeatExchangerSizingSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'heat_exchanger',
      analysisType: 'shell_tube_optimization',
      heatDuty: input.heatDuty
    }, 'Shell and tube heat exchanger optimization requested');
    
    const result = optimizeShellTubeDesign(input);
    
    logger.info({
      userId,
      equipmentType: 'heat_exchanger',
      shellDiameter: result.shellDiameter,
      tubeCount: result.tubeCount,
      efficiency: result.efficiency
    }, 'Shell and tube heat exchanger optimization completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // Plate Heat Exchanger Sizing
  fastify.post('/api/v1/equipment/heat-exchangers/plate-sizing', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Calculate plate heat exchanger sizing',
      description: 'Calculate plate heat exchanger sizing using industry standards',
      body: {
        type: 'object',
        required: [
          'heatDuty', 'hotFluidInlet', 'hotFluidOutlet', 'coldFluidInlet', 'coldFluidOutlet',
          'hotFlowRate', 'coldFlowRate', 'designPressure', 'designTemperature',
          'hotFluidProperties', 'coldFluidProperties'
        ],
        properties: {
          heatDuty: { type: 'number', minimum: 0, description: 'Heat duty in W' },
          hotFluidInlet: { type: 'number', minimum: 0, description: 'Hot fluid inlet temperature in K' },
          hotFluidOutlet: { type: 'number', minimum: 0, description: 'Hot fluid outlet temperature in K' },
          coldFluidInlet: { type: 'number', minimum: 0, description: 'Cold fluid inlet temperature in K' },
          coldFluidOutlet: { type: 'number', minimum: 0, description: 'Cold fluid outlet temperature in K' },
          hotFlowRate: { type: 'number', minimum: 0, description: 'Hot fluid flow rate in kg/s' },
          coldFlowRate: { type: 'number', minimum: 0, description: 'Cold fluid flow rate in kg/s' },
          designPressure: { type: 'number', minimum: 0, description: 'Design pressure in Pa' },
          designTemperature: { type: 'number', minimum: 0, description: 'Design temperature in K' },
          hotFluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'thermalConductivity', 'specificHeat'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Viscosity in Pa·s' },
              thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
              specificHeat: { type: 'number', minimum: 0, description: 'Specific heat in J/kg·K' }
            }
          },
          coldFluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'thermalConductivity', 'specificHeat'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Viscosity in Pa·s' },
              thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
              specificHeat: { type: 'number', minimum: 0, description: 'Specific heat in J/kg·K' }
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
                plateCount: { type: 'number', description: 'Number of plates' },
                plateArea: { type: 'number', description: 'Plate area in m²' },
                plateSpacing: { type: 'number', description: 'Plate spacing in m' },
                overallU: { type: 'number', description: 'Overall heat transfer coefficient in W/m²·K' },
                pressureDrop: { type: 'number', description: 'Pressure drop in Pa' },
                efficiency: { type: 'number', description: 'Heat exchanger efficiency (0-1)' },
                recommendations: { type: 'array', items: { type: 'string' }, description: 'Design recommendations' },
                references: { type: 'array', items: { type: 'string' }, description: 'Calculation references' },
                standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' },
                calculationMethod: { type: 'string', description: 'Calculation method used' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = HeatExchangerSizingSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'heat_exchanger',
      analysisType: 'plate_sizing',
      heatDuty: input.heatDuty
    }, 'Plate heat exchanger sizing requested');
    
    const result = calculatePlateHeatExchangerSizing(input);
    
    logger.info({
      userId,
      equipmentType: 'heat_exchanger',
      plateCount: result.plateCount,
      efficiency: result.efficiency
    }, 'Plate heat exchanger sizing completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // Air-Cooled Heat Exchanger Sizing
  fastify.post('/api/v1/equipment/heat-exchangers/air-cooled-sizing', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Calculate air-cooled heat exchanger sizing',
      description: 'Calculate air-cooled heat exchanger sizing using API 661 standards',
      body: {
        type: 'object',
        required: [
          'heatDuty', 'hotFluidInlet', 'hotFluidOutlet', 'coldFluidInlet', 'coldFluidOutlet',
          'hotFlowRate', 'coldFlowRate', 'designPressure', 'designTemperature',
          'hotFluidProperties', 'coldFluidProperties'
        ],
        properties: {
          heatDuty: { type: 'number', minimum: 0, description: 'Heat duty in W' },
          hotFluidInlet: { type: 'number', minimum: 0, description: 'Hot fluid inlet temperature in K' },
          hotFluidOutlet: { type: 'number', minimum: 0, description: 'Hot fluid outlet temperature in K' },
          coldFluidInlet: { type: 'number', minimum: 0, description: 'Cold fluid inlet temperature in K' },
          coldFluidOutlet: { type: 'number', minimum: 0, description: 'Cold fluid outlet temperature in K' },
          hotFlowRate: { type: 'number', minimum: 0, description: 'Hot fluid flow rate in kg/s' },
          coldFlowRate: { type: 'number', minimum: 0, description: 'Cold fluid flow rate in kg/s' },
          designPressure: { type: 'number', minimum: 0, description: 'Design pressure in Pa' },
          designTemperature: { type: 'number', minimum: 0, description: 'Design temperature in K' },
          hotFluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'thermalConductivity', 'specificHeat'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Viscosity in Pa·s' },
              thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
              specificHeat: { type: 'number', minimum: 0, description: 'Specific heat in J/kg·K' }
            }
          },
          coldFluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'thermalConductivity', 'specificHeat'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Viscosity in Pa·s' },
              thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
              specificHeat: { type: 'number', minimum: 0, description: 'Specific heat in J/kg·K' }
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
                fanCount: { type: 'number', description: 'Number of fans' },
                tubeCount: { type: 'number', description: 'Number of tubes' },
                tubeLength: { type: 'number', description: 'Tube length in m' },
                tubeDiameter: { type: 'number', description: 'Tube diameter in m' },
                overallU: { type: 'number', description: 'Overall heat transfer coefficient in W/m²·K' },
                area: { type: 'number', description: 'Heat transfer area in m²' },
                fanPower: { type: 'number', description: 'Total fan power in kW' },
                efficiency: { type: 'number', description: 'Heat exchanger efficiency (0-1)' },
                recommendations: { type: 'array', items: { type: 'string' }, description: 'Design recommendations' },
                references: { type: 'array', items: { type: 'string' }, description: 'Calculation references' },
                standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' },
                calculationMethod: { type: 'string', description: 'Calculation method used' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = HeatExchangerSizingSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'heat_exchanger',
      analysisType: 'air_cooled_sizing',
      heatDuty: input.heatDuty
    }, 'Air-cooled heat exchanger sizing requested');
    
    const result = calculateAirCooledHeatExchangerSizing(input);
    
    logger.info({
      userId,
      equipmentType: 'heat_exchanger',
      fanCount: result.fanCount,
      tubeCount: result.tubeCount,
      fanPower: result.fanPower
    }, 'Air-cooled heat exchanger sizing completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // Heat Exchanger Rating
  fastify.post('/api/v1/equipment/heat-exchangers/rating', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Rate existing heat exchanger performance',
      description: 'Rate existing heat exchanger performance and analyze efficiency',
      body: {
        type: 'object',
        required: [
          'area', 'hotFluidInlet', 'hotFluidOutlet', 'coldFluidInlet', 'coldFluidOutlet',
          'hotFlowRate', 'coldFlowRate', 'hotFluidProperties', 'coldFluidProperties'
        ],
        properties: {
          area: { type: 'number', minimum: 0, description: 'Heat transfer area in m²' },
          hotFluidInlet: { type: 'number', minimum: 0, description: 'Hot fluid inlet temperature in K' },
          hotFluidOutlet: { type: 'number', minimum: 0, description: 'Hot fluid outlet temperature in K' },
          coldFluidInlet: { type: 'number', minimum: 0, description: 'Cold fluid inlet temperature in K' },
          coldFluidOutlet: { type: 'number', minimum: 0, description: 'Cold fluid outlet temperature in K' },
          hotFlowRate: { type: 'number', minimum: 0, description: 'Hot fluid flow rate in kg/s' },
          coldFlowRate: { type: 'number', minimum: 0, description: 'Cold fluid flow rate in kg/s' },
          hotFluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'thermalConductivity', 'specificHeat'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Viscosity in Pa·s' },
              thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
              specificHeat: { type: 'number', minimum: 0, description: 'Specific heat in J/kg·K' }
            }
          },
          coldFluidProperties: {
            type: 'object',
            required: ['density', 'viscosity', 'thermalConductivity', 'specificHeat'],
            properties: {
              density: { type: 'number', minimum: 0, description: 'Density in kg/m³' },
              viscosity: { type: 'number', minimum: 0, description: 'Viscosity in Pa·s' },
              thermalConductivity: { type: 'number', minimum: 0, description: 'Thermal conductivity in W/m·K' },
              specificHeat: { type: 'number', minimum: 0, description: 'Specific heat in J/kg·K' }
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
                actualHeatDuty: { type: 'number', description: 'Actual heat duty in W' },
                actualOverallU: { type: 'number', description: 'Actual overall heat transfer coefficient in W/m²·K' },
                actualEfficiency: { type: 'number', description: 'Actual efficiency (0-1)' },
                foulingFactor: { type: 'number', description: 'Fouling factor in m²·K/W' },
                performanceRatio: { type: 'number', description: 'Performance ratio' },
                recommendations: { type: 'array', items: { type: 'string' }, description: 'Performance recommendations' },
                references: { type: 'array', items: { type: 'string' }, description: 'Calculation references' },
                standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' },
                calculationMethod: { type: 'string', description: 'Calculation method used' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as any;
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'heat_exchanger',
      analysisType: 'rating',
      area: input.area
    }, 'Heat exchanger rating requested');
    
    const result = rateHeatExchanger(input);
    
    logger.info({
      userId,
      equipmentType: 'heat_exchanger',
      actualHeatDuty: result.actualHeatDuty,
      performanceRatio: result.performanceRatio
    }, 'Heat exchanger rating completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // ============================================================================
  // VESSEL SIZING ENDPOINTS
  // ============================================================================

  // Pressure Vessel Sizing with ASME Section VIII
  fastify.post('/api/v1/equipment/vessels/pressure-vessel', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Calculate pressure vessel sizing with ASME Section VIII compliance',
      description: 'Calculate pressure vessel sizing using ASME Section VIII, Division 1 standards',
      body: {
        type: 'object',
        required: ['volume', 'designPressure', 'designTemperature', 'vesselType'],
        properties: {
          volume: { type: 'number', minimum: 0, description: 'Vessel volume in m³' },
          designPressure: { type: 'number', minimum: 0, description: 'Design pressure in Pa' },
          designTemperature: { type: 'number', minimum: 0, description: 'Design temperature in K' },
          material: { type: 'string', description: 'Vessel material' },
          vesselType: { type: 'string', enum: ['pressure_vessel', 'storage_tank', 'separator', 'reactor'], description: 'Vessel type' },
          diameter: { type: 'number', minimum: 0, description: 'Vessel diameter in m' },
          length: { type: 'number', minimum: 0, description: 'Vessel length in m' },
          height: { type: 'number', minimum: 0, description: 'Vessel height in m' },
          operatingConditions: {
            type: 'object',
            properties: {
              operatingPressure: { type: 'number', description: 'Operating pressure in Pa' },
              operatingTemperature: { type: 'number', description: 'Operating temperature in K' },
              fluidProperties: { type: 'object', description: 'Fluid properties' }
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
                shellThickness: { type: 'number' },
                headThickness: { type: 'number' },
                nozzleReinforcement: { type: 'object' },
                weight: { type: 'number' },
                materialRequirements: { type: 'object' },
                designPressure: { type: 'number' },
                designTemperature: { type: 'number' },
                safetyFactors: { type: 'object' },
                recommendations: { type: 'array', items: { type: 'string' } },
                references: { type: 'array', items: { type: 'string' } },
                standards: { type: 'array', items: { type: 'string' } },
                calculationMethod: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = VesselSizingSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'pressure_vessel',
      volume: input.volume,
      designPressure: input.designPressure,
      designTemperature: input.designTemperature
    }, 'Pressure vessel sizing requested');
    
    const result = calculatePressureVesselSizing(input);
    
    logger.info({
      userId,
      equipmentType: 'pressure_vessel',
      shellThickness: result.shellThickness,
      weight: result.weight
    }, 'Pressure vessel sizing completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // Storage Tank Sizing with API 650
  fastify.post('/api/v1/equipment/vessels/storage-tank', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Calculate storage tank sizing with API 650 compliance',
      description: 'Calculate storage tank sizing using API 650 standards',
      body: {
        type: 'object',
        required: ['volume', 'designPressure', 'designTemperature', 'vesselType'],
        properties: {
          volume: { type: 'number', minimum: 0, description: 'Tank volume in m³' },
          designPressure: { type: 'number', minimum: 0, description: 'Design pressure in Pa' },
          designTemperature: { type: 'number', minimum: 0, description: 'Design temperature in K' },
          material: { type: 'string', description: 'Tank material' },
          vesselType: { type: 'string', enum: ['storage_tank', 'pressure_vessel', 'separator', 'reactor'], description: 'Tank type' },
          diameter: { type: 'number', minimum: 0, description: 'Tank diameter in m' },
          height: { type: 'number', minimum: 0, description: 'Tank height in m' },
          operatingConditions: {
            type: 'object',
            properties: {
              operatingPressure: { type: 'number', description: 'Operating pressure in Pa' },
              operatingTemperature: { type: 'number', description: 'Operating temperature in K' },
              fluidProperties: { type: 'object', description: 'Fluid properties' }
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
                shellThickness: { type: 'array', items: { type: 'number' } },
                bottomThickness: { type: 'number' },
                roofThickness: { type: 'number' },
                windGirder: { type: 'object' },
                seismicDesign: { type: 'object' },
                weight: { type: 'number' },
                materialRequirements: { type: 'object' },
                designPressure: { type: 'number' },
                designTemperature: { type: 'number' },
                recommendations: { type: 'array', items: { type: 'string' } },
                references: { type: 'array', items: { type: 'string' } },
                standards: { type: 'array', items: { type: 'string' } },
                calculationMethod: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = VesselSizingSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'storage_tank',
      volume: input.volume,
      designPressure: input.designPressure,
      designTemperature: input.designTemperature
    }, 'Storage tank sizing requested');
    
    const result = calculateStorageTankSizing(input);
    
    logger.info({
      userId,
      equipmentType: 'storage_tank',
      weight: result.weight,
      numberOfCourses: result.shellThickness.length
    }, 'Storage tank sizing completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // Separator Sizing with API 12J
  fastify.post('/api/v1/equipment/vessels/separator', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Calculate separator sizing with API 12J compliance',
      description: 'Calculate separator sizing using API 12J standards',
      body: {
        type: 'object',
        required: ['volume', 'designPressure', 'designTemperature', 'vesselType'],
        properties: {
          volume: { type: 'number', minimum: 0, description: 'Separator volume in m³' },
          designPressure: { type: 'number', minimum: 0, description: 'Design pressure in Pa' },
          designTemperature: { type: 'number', minimum: 0, description: 'Design temperature in K' },
          material: { type: 'string', description: 'Separator material' },
          vesselType: { type: 'string', enum: ['separator', 'pressure_vessel', 'storage_tank', 'reactor'], description: 'Separator type' },
          diameter: { type: 'number', minimum: 0, description: 'Separator diameter in m' },
          length: { type: 'number', minimum: 0, description: 'Separator length in m' },
          operatingConditions: {
            type: 'object',
            properties: {
              operatingPressure: { type: 'number', description: 'Operating pressure in Pa' },
              operatingTemperature: { type: 'number', description: 'Operating temperature in K' },
              fluidProperties: { type: 'object', description: 'Fluid properties' }
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
                shellThickness: { type: 'number' },
                headThickness: { type: 'number' },
                internals: { type: 'object' },
                weight: { type: 'number' },
                materialRequirements: { type: 'object' },
                designPressure: { type: 'number' },
                designTemperature: { type: 'number' },
                recommendations: { type: 'array', items: { type: 'string' } },
                references: { type: 'array', items: { type: 'string' } },
                standards: { type: 'array', items: { type: 'string' } },
                calculationMethod: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = VesselSizingSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'separator',
      volume: input.volume,
      designPressure: input.designPressure,
      designTemperature: input.designTemperature
    }, 'Separator sizing requested');
    
    const result = calculateSeparatorSizing(input);
    
    logger.info({
      userId,
      equipmentType: 'separator',
      shellThickness: result.shellThickness,
      weight: result.weight
    }, 'Separator sizing completed');
    
    return reply.send(createSuccessResponse(result));
  }));
  
  // Vessel Sizing Calculation
  fastify.post('/api/v1/equipment/vessels/sizing', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Calculate vessel sizing',
      description: 'Calculate vessel sizing using ASME Section VIII standards',
      body: {
        type: 'object',
        required: ['volume', 'designPressure', 'designTemperature', 'vesselType'],
        properties: {
          volume: { type: 'number', minimum: 0, description: 'Vessel volume in m³' },
          designPressure: { type: 'number', minimum: 0, description: 'Design pressure in Pa' },
          designTemperature: { type: 'number', minimum: 0, description: 'Design temperature in K' },
          material: { type: 'string', description: 'Vessel material' },
          vesselType: { type: 'string', enum: ['storage_tank', 'pressure_vessel', 'separator', 'reactor'], description: 'Vessel type' },
          diameter: { type: 'number', minimum: 0, description: 'Vessel diameter in m' },
          length: { type: 'number', minimum: 0, description: 'Vessel length in m' },
          height: { type: 'number', minimum: 0, description: 'Vessel height in m' },
          operatingConditions: {
            type: 'object',
            required: ['pressure', 'temperature', 'fluidDensity'],
            properties: {
              pressure: { type: 'number', minimum: 0, description: 'Operating pressure in Pa' },
              temperature: { type: 'number', minimum: 0, description: 'Operating temperature in K' },
              fluidDensity: { type: 'number', minimum: 0, description: 'Fluid density in kg/m³' }
            }
          },
          standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' }
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
                diameter: { type: 'number', description: 'Vessel diameter in m' },
                length: { type: 'number', description: 'Vessel length in m' },
                wallThickness: { type: 'number', description: 'Wall thickness in m' },
                weight: { type: 'number', description: 'Vessel weight in kg' },
                volume: { type: 'number', description: 'Vessel volume in m³' },
                designPressure: { type: 'number', description: 'Design pressure in Pa' },
                designTemperature: { type: 'number', description: 'Design temperature in K' },
                material: { type: 'string', description: 'Vessel material' },
                references: { type: 'array', items: { type: 'string' }, description: 'Calculation references' },
                standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' },
                calculationMethod: { type: 'string', description: 'Calculation method used' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = VesselSizingSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'vessel',
      volume: input.volume,
      vesselType: input.vesselType
    }, 'Vessel sizing calculation requested');
    
    const result = calculateVesselSizing(input);
    
    logger.info({
      userId,
      equipmentType: 'vessel',
      diameter: result.diameter,
      wallThickness: result.wallThickness
    }, 'Vessel sizing calculation completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // ============================================================================
  // PIPING SIZING ENDPOINTS
  // ============================================================================
  
  // Piping Sizing Calculation
  fastify.post('/api/v1/equipment/piping/sizing', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Calculate piping sizing',
      description: 'Calculate piping sizing using ASME B31.3 standards',
      body: {
        type: 'object',
        required: ['flowRate', 'fluidDensity', 'fluidViscosity'],
        properties: {
          flowRate: { type: 'number', minimum: 0, description: 'Flow rate in m³/s' },
          fluidDensity: { type: 'number', minimum: 0, description: 'Fluid density in kg/m³' },
          fluidViscosity: { type: 'number', minimum: 0, description: 'Fluid viscosity in Pa·s' },
          pressureDrop: { type: 'number', minimum: 0, description: 'Allowable pressure drop in Pa' },
          velocityLimit: { type: 'number', minimum: 0, description: 'Maximum velocity in m/s' },
          pipeMaterial: { type: 'string', description: 'Pipe material' },
          pipeSchedule: { type: 'string', description: 'Pipe schedule' },
          designPressure: { type: 'number', minimum: 0, description: 'Design pressure in Pa' },
          designTemperature: { type: 'number', minimum: 0, description: 'Design temperature in K' },
          pipeLength: { type: 'number', minimum: 0, description: 'Pipe length in m' },
          fittings: {
            type: 'array',
            items: {
              type: 'object',
              required: ['type', 'quantity', 'equivalentLength'],
              properties: {
                type: { type: 'string', description: 'Fitting type' },
                quantity: { type: 'number', minimum: 0, description: 'Number of fittings' },
                equivalentLength: { type: 'number', minimum: 0, description: 'Equivalent length in m' }
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
                pipeDiameter: { type: 'number', description: 'Pipe diameter in m' },
                pipeSchedule: { type: 'string', description: 'Pipe schedule' },
                velocity: { type: 'number', description: 'Fluid velocity in m/s' },
                reynoldsNumber: { type: 'number', description: 'Reynolds number' },
                frictionFactor: { type: 'number', description: 'Friction factor' },
                pressureDrop: { type: 'number', description: 'Pressure drop in Pa' },
                equivalentLength: { type: 'number', description: 'Equivalent length in m' },
                references: { type: 'array', items: { type: 'string' }, description: 'Calculation references' },
                standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' },
                calculationMethod: { type: 'string', description: 'Calculation method used' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const input = PipingSizingSchema.parse(request.body);
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'piping',
      flowRate: input.flowRate,
      pipeLength: input.pipeLength
    }, 'Piping sizing calculation requested');
    
    const result = calculatePipingSizing(input);
    
    logger.info({
      userId,
      equipmentType: 'piping',
      pipeDiameter: result.pipeDiameter,
      pressureDrop: result.pressureDrop
    }, 'Piping sizing calculation completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // ============================================================================
  // PUMP SELECTION AND PERFORMANCE ANALYSIS ENDPOINTS
  // ============================================================================
  
  // Pump Selection from Catalog
  fastify.post('/api/v1/equipment/pumps/selection', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Select pump from catalog',
      description: 'Select appropriate pump from catalog based on sizing results',
      body: {
        type: 'object',
        required: ['sizingResults'],
        properties: {
          sizingResults: { type: 'object', description: 'Pump sizing calculation results' },
          constraints: { type: 'object', description: 'Selection constraints' },
          preferences: { type: 'object', description: 'User preferences' }
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
                selectedPumps: { type: 'array', items: { type: 'object' }, description: 'Selected pump options' },
                recommendations: { type: 'array', items: { type: 'string' }, description: 'Selection recommendations' },
                costEstimate: { type: 'object', description: 'Cost estimation' },
                performanceMatch: { type: 'number', description: 'Performance match percentage' },
                references: { type: 'array', items: { type: 'string' }, description: 'Selection references' },
                standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' },
                calculationMethod: { type: 'string', description: 'Calculation method used' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const { sizingResults, constraints, preferences: _preferences } = request.body as any;
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'pump',
      constraints
    }, 'Pump selection requested');
    
    const result = selectPumpFromCatalog(sizingResults, constraints, _preferences);
    
    logger.info({
      userId,
      equipmentType: 'pump',
      selectedCount: result.selectedPumps.length,
      performanceMatch: result.performanceMatch
    }, 'Pump selection completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // Pump Performance Curve Analysis
  fastify.post('/api/v1/equipment/pumps/performance-analysis', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Analyze pump performance curves',
      description: 'Analyze pump performance curves and system curves',
      body: {
        type: 'object',
        required: ['pumpData', 'systemData'],
        properties: {
          pumpData: { type: 'object', description: 'Pump performance data' },
          systemData: { type: 'object', description: 'System curve data' }
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
                operatingPoint: { type: 'object', description: 'Operating point data' },
                efficiency: { type: 'number', description: 'Operating efficiency' },
                power: { type: 'number', description: 'Operating power in kW' },
                npshRequired: { type: 'number', description: 'NPSH required at operating point' },
                cavitationRisk: { type: 'string', description: 'Cavitation risk assessment' },
                recommendations: { type: 'array', items: { type: 'string' }, description: 'Performance recommendations' },
                references: { type: 'array', items: { type: 'string' }, description: 'Analysis references' },
                standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' },
                calculationMethod: { type: 'string', description: 'Calculation method used' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const { pumpData, systemData } = request.body as any;
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'pump',
      analysisType: 'performance_curves'
    }, 'Pump performance analysis requested');
    
    const result = analyzePumpPerformanceCurves(pumpData, systemData);
    
    logger.info({
      userId,
      equipmentType: 'pump',
      efficiency: result.efficiency,
      cavitationRisk: result.cavitationRisk
    }, 'Pump performance analysis completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // System Curve Calculation
  fastify.post('/api/v1/equipment/pumps/system-curve', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Calculate system curve',
      description: 'Calculate system curve for pump selection',
      body: {
        type: 'object',
        required: ['staticHead', 'frictionLosses', 'flowRate'],
        properties: {
          staticHead: { type: 'number', minimum: 0, description: 'Static head in meters' },
          frictionLosses: { type: 'number', minimum: 0, description: 'Friction losses in meters' },
          flowRate: { type: 'number', minimum: 0, description: 'Flow rate in m³/s' }
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
                systemHead: { type: 'number', description: 'System head in meters' },
                systemFlow: { type: 'number', description: 'System flow in m³/s' },
                frictionFactor: { type: 'number', description: 'Friction factor' },
                references: { type: 'array', items: { type: 'string' }, description: 'Calculation references' },
                standards: { type: 'array', items: { type: 'string' }, description: 'Applicable standards' },
                calculationMethod: { type: 'string', description: 'Calculation method used' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const { staticHead, frictionLosses, flowRate } = request.body as any;
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType: 'pump',
      analysisType: 'system_curve'
    }, 'System curve calculation requested');
    
    const result = calculateSystemCurve(staticHead, frictionLosses, flowRate);
    
    logger.info({
      userId,
      equipmentType: 'pump',
      systemHead: result.systemHead,
      frictionFactor: result.frictionFactor
    }, 'System curve calculation completed');
    
    return reply.send(createSuccessResponse(result));
  }));

  // ============================================================================
  // EQUIPMENT SELECTION ENDPOINTS
  // ============================================================================
  
  // Equipment Selection
  fastify.post('/api/v1/equipment/selection', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Equipment Sizing'],
      summary: 'Select equipment from catalog',
      description: 'Select appropriate equipment from catalog based on sizing results',
      body: {
        type: 'object',
        required: ['equipmentType', 'sizingResults'],
        properties: {
          equipmentType: { type: 'string', enum: ['pump', 'heat_exchanger', 'vessel', 'piping'], description: 'Equipment type' },
          sizingResults: { type: 'object', description: 'Sizing calculation results' },
          constraints: { type: 'object', description: 'Selection constraints' },
          preferences: { type: 'object', description: 'User preferences' }
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
                selectedEquipment: { type: 'array', items: { type: 'object' }, description: 'Selected equipment options' },
                recommendations: { type: 'array', items: { type: 'string' }, description: 'Selection recommendations' },
                costEstimate: { type: 'object', description: 'Cost estimation' },
                references: { type: 'array', items: { type: 'string' }, description: 'Selection references' }
              }
            },
            timestamp: { type: 'string' }
          }
        }
      }
    }
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const { equipmentType, sizingResults: _sizingResults, constraints, preferences: _preferences } = request.body as any;
    const userId = (request.user as any).userId;
    
    logger.info({
      userId,
      equipmentType,
      constraints
    }, 'Equipment selection requested');
    
    // TODO: Implement equipment selection logic
    const result = {
      selectedEquipment: [],
      recommendations: ['Equipment selection logic to be implemented'],
      costEstimate: {},
      references: ['Equipment selection references to be added']
    };
    
    logger.info({
      userId,
      equipmentType,
      selectedCount: result.selectedEquipment.length
    }, 'Equipment selection completed');
    
    return reply.send(createSuccessResponse(result));
  }));
}
