/**
 * Heat Transfer Calculations
 * 
 * This module provides comprehensive heat transfer calculations including:
 * - Heat exchanger sizing and analysis
 * - Heat transfer coefficients
 * - Effectiveness-NTU method
 * - LMTD calculations
 * - Fin analysis
 * - Thermal resistance calculations
 */

export interface HeatExchangerInput {
  heatDuty: number;           // Heat duty in W
  overallU: number;           // Overall heat transfer coefficient in W/m²·K
  tHotIn: number;            // Hot fluid inlet temperature in K
  tHotOut: number;           // Hot fluid outlet temperature in K
  tColdIn: number;           // Cold fluid inlet temperature in K
  tColdOut: number;          // Cold fluid outlet temperature in K
  flowArrangement?: string;   // 'counterflow', 'parallel', 'crossflow'
}

export interface HeatExchangerResult {
  area: number;              // Heat transfer area in m²
  lmtd: number;              // Log mean temperature difference in K
  effectiveness: number;      // Heat exchanger effectiveness (0-1)
  ntu: number;               // Number of transfer units
  capacityRatio: number;     // Capacity rate ratio
}

export interface EffectivenessNTUInput {
  ntu: number;               // Number of transfer units
  capacityRatio: number;     // Capacity rate ratio (Cmin/Cmax)
  flowArrangement: string;   // Flow arrangement type
}

export interface EffectivenessNTUResult {
  effectiveness: number;     // Heat exchanger effectiveness
  maxHeatTransfer: number;   // Maximum possible heat transfer in W
}

export interface ConvectionInput {
  fluidVelocity: number;     // Fluid velocity in m/s
  characteristicLength: number; // Characteristic length in m
  fluidProperties: {
    density: number;         // Density in kg/m³
    viscosity: number;       // Dynamic viscosity in Pa·s
    thermalConductivity: number; // Thermal conductivity in W/m·K
    specificHeat: number;    // Specific heat in J/kg·K
  };
  surfaceTemperature: number; // Surface temperature in K
  fluidTemperature: number;   // Bulk fluid temperature in K
  geometry: string;          // 'flat_plate', 'cylinder', 'sphere', 'tube_internal', 'tube_external'
}

export interface ConvectionResult {
  reynoldsNumber: number;    // Reynolds number
  prandtlNumber: number;     // Prandtl number
  nusseltNumber: number;     // Nusselt number
  heatTransferCoefficient: number; // Convective heat transfer coefficient in W/m²·K
}

export interface FinInput {
  finLength: number;         // Fin length in m
  finThickness: number;      // Fin thickness in m
  finWidth: number;          // Fin width in m
  thermalConductivity: number; // Fin material thermal conductivity in W/m·K
  heatTransferCoefficient: number; // Convective heat transfer coefficient in W/m²·K
  baseTemperature: number;   // Base temperature in K
  ambientTemperature: number; // Ambient temperature in K
}

export interface FinResult {
  finEfficiency: number;     // Fin efficiency (0-1)
  finEffectiveness: number;  // Fin effectiveness
  heatTransferRate: number;  // Heat transfer rate in W
  tipTemperature: number;    // Fin tip temperature in K
}

export interface ThermalResistanceInput {
  layers: Array<{
    thickness: number;       // Layer thickness in m
    thermalConductivity: number; // Thermal conductivity in W/m·K
    area: number;           // Heat transfer area in m²
  }>;
  convectionResistances?: Array<{
    heatTransferCoefficient: number; // Convective coefficient in W/m²·K
    area: number;           // Area in m²
  }>;
}

export interface ThermalResistanceResult {
  totalResistance: number;   // Total thermal resistance in K/W
  conductionResistances: number[]; // Individual conduction resistances in K/W
  convectionResistances: number[]; // Individual convection resistances in K/W
  heatTransferRate: number;  // Heat transfer rate for unit temperature difference in W/K
}

/**
 * Calculate heat exchanger area using LMTD method
 */
export function calculateHeatExchangerArea(input: HeatExchangerInput): HeatExchangerResult {
  const { heatDuty, overallU, tHotIn, tHotOut, tColdIn, tColdOut, flowArrangement = 'counterflow' } = input;
  
  // Calculate LMTD
  const lmtd = calculateLMTD(tHotIn, tHotOut, tColdIn, tColdOut, flowArrangement);
  
  // Calculate area
  const area = heatDuty / (overallU * lmtd);
  
  // Calculate capacity rates
  const qHot = heatDuty; // Assuming hot fluid heat duty
  const qCold = heatDuty; // Energy balance
  
  const cHot = qHot / (tHotIn - tHotOut);
  const cCold = qCold / (tColdOut - tColdIn);
  
  const cMin = Math.min(cHot, cCold);
  const cMax = Math.max(cHot, cCold);
  const capacityRatio = cMin / cMax;
  
  // Calculate NTU
  const ntu = overallU * area / cMin;
  
  // Calculate effectiveness
  const effectiveness = calculateEffectiveness(ntu, capacityRatio, flowArrangement);
  
  return {
    area,
    lmtd,
    effectiveness,
    ntu,
    capacityRatio
  };
}

/**
 * Calculate Log Mean Temperature Difference (LMTD)
 */
export function calculateLMTD(tHotIn: number, tHotOut: number, tColdIn: number, tColdOut: number, flowArrangement: string = 'counterflow'): number {
  let deltaT1: number, deltaT2: number;
  
  if (flowArrangement === 'counterflow') {
    deltaT1 = tHotIn - tColdOut;
    deltaT2 = tHotOut - tColdIn;
  } else if (flowArrangement === 'parallel') {
    deltaT1 = tHotIn - tColdIn;
    deltaT2 = tHotOut - tColdOut;
  } else {
    // Default to counterflow
    deltaT1 = tHotIn - tColdOut;
    deltaT2 = tHotOut - tColdIn;
  }
  
  if (Math.abs(deltaT1 - deltaT2) < 0.01) {
    // If temperature differences are nearly equal, use arithmetic mean
    return (deltaT1 + deltaT2) / 2;
  }
  
  return (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
}

/**
 * Calculate heat exchanger effectiveness using NTU method
 */
export function calculateEffectivenessNTU(input: EffectivenessNTUInput): EffectivenessNTUResult {
  const { ntu, capacityRatio, flowArrangement } = input;
  
  let effectiveness: number;
  
  switch (flowArrangement.toLowerCase()) {
    case 'counterflow':
      if (Math.abs(capacityRatio - 1) < 0.001) {
        effectiveness = ntu / (1 + ntu);
      } else {
        const exp_term = Math.exp(-ntu * (1 - capacityRatio));
        effectiveness = (1 - exp_term) / (1 - capacityRatio * exp_term);
      }
      break;
      
    case 'parallel':
      const exp_parallel = Math.exp(-ntu * (1 + capacityRatio));
      effectiveness = (1 - exp_parallel) / (1 + capacityRatio);
      break;
      
    case 'crossflow_unmixed':
      // Approximation for crossflow with both fluids unmixed
      const ntu1 = Math.pow(ntu, 0.22);
      const exp_cross = Math.exp(-capacityRatio * ntu1);
      effectiveness = 1 - Math.exp((exp_cross - 1) / capacityRatio);
      break;
      
    default:
      // Default to counterflow
      if (Math.abs(capacityRatio - 1) < 0.001) {
        effectiveness = ntu / (1 + ntu);
      } else {
        const exp_term = Math.exp(-ntu * (1 - capacityRatio));
        effectiveness = (1 - exp_term) / (1 - capacityRatio * exp_term);
      }
  }
  
  // Maximum possible heat transfer (assuming infinite area)
  const maxHeatTransfer = effectiveness; // This would be multiplied by Cmin*(Th_in - Tc_in) in practice
  
  return {
    effectiveness: Math.min(effectiveness, 1.0), // Cap at 100%
    maxHeatTransfer
  };
}

/**
 * Calculate effectiveness from NTU and capacity ratio
 */
export function calculateEffectiveness(ntu: number, capacityRatio: number, flowArrangement: string): number {
  const input: EffectivenessNTUInput = { ntu, capacityRatio, flowArrangement };
  return calculateEffectivenessNTU(input).effectiveness;
}

/**
 * Calculate convective heat transfer coefficient
 */
export function calculateConvection(input: ConvectionInput): ConvectionResult {
  const { fluidVelocity, characteristicLength, fluidProperties, geometry } = input;
  const { density, viscosity, thermalConductivity, specificHeat } = fluidProperties;
  
  // Calculate Reynolds number
  const reynoldsNumber = (density * fluidVelocity * characteristicLength) / viscosity;
  
  // Calculate Prandtl number
  const prandtlNumber = (viscosity * specificHeat) / thermalConductivity;
  
  // Calculate Nusselt number based on geometry
  let nusseltNumber: number;
  
  switch (geometry.toLowerCase()) {
    case 'flat_plate':
      if (reynoldsNumber < 5e5) {
        // Laminar flow
        nusseltNumber = 0.332 * Math.pow(reynoldsNumber, 0.5) * Math.pow(prandtlNumber, 1/3);
      } else {
        // Turbulent flow
        nusseltNumber = 0.0296 * Math.pow(reynoldsNumber, 0.8) * Math.pow(prandtlNumber, 1/3);
      }
      break;
      
    case 'cylinder':
      // Churchill and Bernstein correlation for cylinder in crossflow
      const re_d = reynoldsNumber;
      const term1 = 0.62 * Math.pow(re_d, 0.5) * Math.pow(prandtlNumber, 1/3);
      const term2 = Math.pow(1 + Math.pow(0.4 / prandtlNumber, 2/3), 0.25);
      const term3 = Math.pow(1 + Math.pow(re_d / 282000, 5/8), 4/5);
      nusseltNumber = 0.3 + (term1 / term2) * term3;
      break;
      
    case 'sphere':
      // Ranz-Marshall correlation for sphere
      nusseltNumber = 2 + 0.6 * Math.pow(reynoldsNumber, 0.5) * Math.pow(prandtlNumber, 1/3);
      break;
      
    case 'tube_internal':
      if (reynoldsNumber < 2300) {
        // Laminar flow in tube
        nusseltNumber = 3.66; // Fully developed, constant wall temperature
      } else {
        // Turbulent flow - Dittus-Boelter equation
        nusseltNumber = 0.023 * Math.pow(reynoldsNumber, 0.8) * Math.pow(prandtlNumber, 0.4);
      }
      break;
      
    case 'tube_external':
      // External flow over tube (similar to cylinder)
      const re_tube = reynoldsNumber;
      const term1_tube = 0.62 * Math.pow(re_tube, 0.5) * Math.pow(prandtlNumber, 1/3);
      const term2_tube = Math.pow(1 + Math.pow(0.4 / prandtlNumber, 2/3), 0.25);
      const term3_tube = Math.pow(1 + Math.pow(re_tube / 282000, 5/8), 4/5);
      nusseltNumber = 0.3 + (term1_tube / term2_tube) * term3_tube;
      break;
      
    default:
      // Default to flat plate
      if (reynoldsNumber < 5e5) {
        nusseltNumber = 0.332 * Math.pow(reynoldsNumber, 0.5) * Math.pow(prandtlNumber, 1/3);
      } else {
        nusseltNumber = 0.0296 * Math.pow(reynoldsNumber, 0.8) * Math.pow(prandtlNumber, 1/3);
      }
  }
  
  // Calculate heat transfer coefficient
  const heatTransferCoefficient = (nusseltNumber * thermalConductivity) / characteristicLength;
  
  return {
    reynoldsNumber,
    prandtlNumber,
    nusseltNumber,
    heatTransferCoefficient
  };
}

/**
 * Calculate fin performance
 */
export function calculateFin(input: FinInput): FinResult {
  const { finLength, finThickness, finWidth, thermalConductivity, heatTransferCoefficient, baseTemperature, ambientTemperature } = input;
  
  // Calculate fin parameter
  const perimeter = 2 * (finThickness + finWidth);
  const crossSectionalArea = finThickness * finWidth;
  const m = Math.sqrt((heatTransferCoefficient * perimeter) / (thermalConductivity * crossSectionalArea));
  
  // Calculate fin efficiency (assuming insulated tip)
  const mL = m * finLength;
  const finEfficiency = Math.tanh(mL) / mL;
  
  // Calculate fin effectiveness
  const finSurfaceArea = perimeter * finLength;
  const baseArea = crossSectionalArea;
  const finEffectiveness = (finEfficiency * finSurfaceArea) / baseArea;
  
  // Calculate heat transfer rate
  const temperatureDifference = baseTemperature - ambientTemperature;
  const heatTransferRate = finEfficiency * heatTransferCoefficient * finSurfaceArea * temperatureDifference;
  
  // Calculate tip temperature
  const tipTemperature = ambientTemperature + temperatureDifference * (1 / Math.cosh(mL));
  
  return {
    finEfficiency,
    finEffectiveness,
    heatTransferRate,
    tipTemperature
  };
}

/**
 * Calculate thermal resistance network
 */
export function calculateThermalResistance(input: ThermalResistanceInput): ThermalResistanceResult {
  const { layers, convectionResistances = [] } = input;
  
  // Calculate conduction resistances
  const conductionResistances = layers.map(layer => 
    layer.thickness / (layer.thermalConductivity * layer.area)
  );
  
  // Calculate convection resistances
  const convectionResistanceValues = convectionResistances.map(resistance =>
    1 / (resistance.heatTransferCoefficient * resistance.area)
  );
  
  // Total resistance (series)
  const totalResistance = [...conductionResistances, ...convectionResistanceValues].reduce((sum, r) => sum + r, 0);
  
  // Heat transfer rate for unit temperature difference
  const heatTransferRate = 1 / totalResistance;
  
  return {
    totalResistance,
    conductionResistances,
    convectionResistances: convectionResistanceValues,
    heatTransferRate
  };
}

/**
 * Calculate overall heat transfer coefficient
 */
export function calculateOverallU(
  innerRadius: number,
  outerRadius: number,
  wallThermalConductivity: number,
  innerHTC: number,
  outerHTC: number,
  foulingFactorInner: number = 0,
  foulingFactorOuter: number = 0
): number {
  const innerArea = 2 * Math.PI * innerRadius;
  const outerArea = 2 * Math.PI * outerRadius;
  
  // Calculate individual resistances
  const innerConvectionR = 1 / (innerHTC * innerArea);
  const innerFoulingR = foulingFactorInner / innerArea;
  const wallConductionR = Math.log(outerRadius / innerRadius) / (2 * Math.PI * wallThermalConductivity);
  const outerFoulingR = foulingFactorOuter / outerArea;
  const outerConvectionR = 1 / (outerHTC * outerArea);
  
  const totalResistance = innerConvectionR + innerFoulingR + wallConductionR + outerFoulingR + outerConvectionR;
  
  return 1 / (totalResistance * innerArea);
}
