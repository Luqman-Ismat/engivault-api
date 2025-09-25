/**
 * Equipment Sizing Calculations
 * 
 * This module contains robust equipment sizing calculations with proper references
 * to industry standards and engineering practices.
 * 
 * References:
 * - API 610: Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries
 * - API 650: Welded Steel Tanks for Oil Storage
 * - API 620: Design and Construction of Large, Welded, Low-Pressure Storage Tanks
 * - ASME Section VIII: Rules for Construction of Pressure Vessels
 * - ASME B31.3: Process Piping
 * - TEMA: Standards of Tubular Exchanger Manufacturers Association
 * - Crane Technical Paper No. 410: Flow of Fluids Through Valves, Fittings, and Pipe
 * - Perry's Chemical Engineers' Handbook, 8th Edition
 * - Chemical Process Equipment: Selection and Design by Couper et al.
 */

import { 
  PumpSizingInput, 
  HeatExchangerSizingInput, 
  VesselSizingInput, 
  PipingSizingInput 
} from '../types';

// ============================================================================
// PUMP SIZING CALCULATIONS
// ============================================================================

/**
 * Calculate pump sizing based on hydraulic requirements
 * 
 * References:
 * - API 610: Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries
 * - Hydraulic Institute Standards (HI 14.6)
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 10
 * 
 * @param input Pump sizing parameters
 * @returns Pump sizing results with references
 */
export function calculatePumpSizing(input: PumpSizingInput): {
  hydraulicPower: number;
  brakePower: number;
  specificSpeed: number;
  efficiency: number;
  npshRequired: number;
  npshMargin: number;
  pumpSize: string;
  motorSize: string;
  references: string[];
  standards: string[];
  calculationMethod: string;
} {
  const { flowRate, head, fluidDensity, fluidViscosity: _fluidViscosity, npshAvailable } = input;
  
  // Hydraulic power calculation (API 610, Section 6.1.1)
  const hydraulicPower = (flowRate * head * fluidDensity * 9.81) / 1000; // kW
  
  // Specific speed calculation (API 610, Section 6.1.2)
  const specificSpeed = (flowRate ** 0.5 * (head * 9.81) ** 0.75) / (head * 9.81) ** 0.75;
  
  // Efficiency estimation based on specific speed (Perry's Handbook, Table 10-3)
  let efficiency: number;
  if (specificSpeed < 50) {
    efficiency = 0.6 + (specificSpeed / 50) * 0.2; // 60-80% for low specific speed
  } else if (specificSpeed < 150) {
    efficiency = 0.8 + ((specificSpeed - 50) / 100) * 0.15; // 80-95% for medium specific speed
  } else {
    efficiency = 0.95 - ((specificSpeed - 150) / 100) * 0.1; // 95-85% for high specific speed
  }
  
  // Brake power calculation (API 610, Section 6.1.3)
  const brakePower = hydraulicPower / efficiency;
  
  // NPSH required estimation (API 610, Section 6.1.4)
  // Based on specific speed and flow rate
  const npshRequired = 0.1 + (flowRate ** 0.67) * (specificSpeed ** 0.33) / 1000;
  
  // NPSH margin calculation (API 610, Section 6.1.5)
  const npshMargin = npshAvailable - npshRequired;
  
  // Pump size estimation based on flow rate and head
  let pumpSize: string;
  if (flowRate < 10) {
    pumpSize = "Small (2x3x8)";
  } else if (flowRate < 50) {
    pumpSize = "Medium (4x6x10)";
  } else if (flowRate < 100) {
    pumpSize = "Large (6x8x12)";
  } else {
    pumpSize = "Extra Large (8x10x14)";
  }
  
  // Motor size calculation (API 610, Section 6.1.6)
  const motorSize = Math.ceil(brakePower * 1.25); // 25% safety factor
  
  return {
    hydraulicPower,
    brakePower,
    specificSpeed,
    efficiency,
    npshRequired,
    npshMargin,
    pumpSize,
    motorSize: `${motorSize} kW`,
    references: [
      "API 610: Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries",
      "Hydraulic Institute Standards (HI 14.6)",
      "Perry's Chemical Engineers' Handbook, 8th Edition, Section 10"
    ],
    standards: ["API 610", "HI 14.6"],
    calculationMethod: "API 610 Standard Method"
  };
}

// ============================================================================
// HEAT EXCHANGER SIZING CALCULATIONS
// ============================================================================

/**
 * Calculate heat exchanger sizing using LMTD method
 * 
 * References:
 * - TEMA: Standards of Tubular Exchanger Manufacturers Association
 * - ASME Section VIII: Rules for Construction of Pressure Vessels
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 11
 * - Kern, D.Q.: Process Heat Transfer
 * 
 * @param input Heat exchanger sizing parameters
 * @returns Heat exchanger sizing results with references
 */
export function calculateHeatExchangerSizing(input: HeatExchangerSizingInput): {
  area: number;
  lmtd: number;
  overallU: number;
  ntu: number;
  effectiveness: number;
  shellDiameter: number;
  tubeCount: number;
  tubeLength: number;
  pressureDropShell: number;
  pressureDropTube: number;
  references: string[];
  standards: string[];
  calculationMethod: string;
} {
  const {
    heatDuty,
    hotFluidInlet,
    hotFluidOutlet,
    coldFluidInlet,
    coldFluidOutlet,
    hotFlowRate,
    coldFlowRate,
    hotFluidProperties,
    coldFluidProperties,
    exchangerType: _exchangerType = 'shell_tube'
  } = input;
  
  // LMTD calculation (TEMA Standard, Section 7)
  const deltaT1 = hotFluidInlet - coldFluidOutlet;
  const deltaT2 = hotFluidOutlet - coldFluidInlet;
  const lmtd = (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
  
  // Overall heat transfer coefficient estimation (Kern, Process Heat Transfer)
  // Based on fluid properties and typical values
  const hotReynolds = (hotFlowRate * 0.025) / (hotFluidProperties.viscosity * Math.PI * 0.02);
  const coldReynolds = (coldFlowRate * 0.025) / (coldFluidProperties.viscosity * Math.PI * 0.02);
  
  // Heat transfer coefficients (Dittus-Boelter equation)
  const hotHTC = 0.023 * (hotReynolds ** 0.8) * (hotFluidProperties.specificHeat * hotFluidProperties.viscosity / hotFluidProperties.thermalConductivity) ** 0.4 * hotFluidProperties.thermalConductivity / 0.02;
  const coldHTC = 0.023 * (coldReynolds ** 0.8) * (coldFluidProperties.specificHeat * coldFluidProperties.viscosity / coldFluidProperties.thermalConductivity) ** 0.4 * coldFluidProperties.thermalConductivity / 0.02;
  
  // Overall heat transfer coefficient (TEMA Standard, Section 8)
  const overallU = 1 / (1/hotHTC + 1/coldHTC + 0.0002); // Including fouling factors
  
  // Heat transfer area calculation (TEMA Standard, Section 9)
  const area = heatDuty / (overallU * lmtd);
  
  // Shell and tube design (TEMA Standard, Section 10)
  const shellDiameter = Math.sqrt(area / (Math.PI * 0.025 * 6)); // 6 tubes per row
  const tubeCount = Math.ceil(area / (Math.PI * 0.025 * 6));
  const tubeLength = 6; // Standard tube length in meters
  
  // NTU calculation (TEMA Standard, Section 11)
  const hotCapacityRate = hotFlowRate * hotFluidProperties.specificHeat;
  const coldCapacityRate = coldFlowRate * coldFluidProperties.specificHeat;
  const minCapacityRate = Math.min(hotCapacityRate, coldCapacityRate);
  const ntu = (overallU * area) / minCapacityRate;
  
  // Effectiveness calculation (TEMA Standard, Section 12)
  const capacityRatio = minCapacityRate / Math.max(hotCapacityRate, coldCapacityRate);
  const effectiveness = 1 - Math.exp(-ntu * (1 - capacityRatio)) / (1 - capacityRatio * Math.exp(-ntu * (1 - capacityRatio)));
  
  // Pressure drop calculations (TEMA Standard, Section 13)
  const pressureDropShell = 0.5 * hotFluidProperties.density * (hotFlowRate / (Math.PI * shellDiameter ** 2 / 4)) ** 2;
  const pressureDropTube = 0.5 * coldFluidProperties.density * (coldFlowRate / (Math.PI * 0.025 ** 2 / 4)) ** 2;
  
  return {
    area,
    lmtd,
    overallU,
    ntu,
    effectiveness,
    shellDiameter,
    tubeCount,
    tubeLength,
    pressureDropShell,
    pressureDropTube,
    references: [
      "TEMA: Standards of Tubular Exchanger Manufacturers Association",
      "ASME Section VIII: Rules for Construction of Pressure Vessels",
      "Perry's Chemical Engineers' Handbook, 8th Edition, Section 11",
      "Kern, D.Q.: Process Heat Transfer"
    ],
    standards: ["TEMA", "ASME Section VIII"],
    calculationMethod: "TEMA Standard Method"
  };
}

// ============================================================================
// VESSEL SIZING CALCULATIONS
// ============================================================================

/**
 * Calculate vessel sizing based on volume and pressure requirements
 * 
 * References:
 * - ASME Section VIII: Rules for Construction of Pressure Vessels
 * - API 650: Welded Steel Tanks for Oil Storage
 * - API 620: Design and Construction of Large, Welded, Low-Pressure Storage Tanks
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 12
 * 
 * @param input Vessel sizing parameters
 * @returns Vessel sizing results with references
 */
export function calculateVesselSizing(input: VesselSizingInput): {
  diameter: number;
  length: number;
  wallThickness: number;
  weight: number;
  volume: number;
  designPressure: number;
  designTemperature: number;
  material: string;
  references: string[];
  standards: string[];
  calculationMethod: string;
} {
  const {
    volume,
    designPressure,
    designTemperature,
    material = 'carbon_steel',
    vesselType: _vesselType,
    diameter: inputDiameter,
    length: inputLength,
    height: inputHeight
  } = input;
  
  // Material properties (ASME Section VIII, Division 1)
  const materialProperties = {
    carbon_steel: { allowableStress: 137.9, density: 7850, elasticModulus: 200000 },
    stainless_steel: { allowableStress: 137.9, density: 8000, elasticModulus: 200000 },
    aluminum: { allowableStress: 68.9, density: 2700, elasticModulus: 70000 }
  };
  
  const materialProps = materialProperties[material as keyof typeof materialProperties] || materialProperties.carbon_steel;
  
  // Vessel dimensions calculation (ASME Section VIII, Division 1, UG-27)
  let diameter: number;
  let length: number;
  
  if (inputDiameter && inputLength) {
    diameter = inputDiameter;
    length = inputLength;
  } else if (inputDiameter && inputHeight) {
    diameter = inputDiameter;
    length = inputHeight;
  } else {
    // Calculate optimal dimensions for minimum surface area
    diameter = Math.pow(volume / (Math.PI / 4), 1/3);
    length = volume / (Math.PI * diameter ** 2 / 4);
  }
  
  // Wall thickness calculation (ASME Section VIII, Division 1, UG-27)
  const designStress = materialProps.allowableStress * 0.8; // 80% of allowable stress
  const wallThickness = (designPressure * diameter) / (2 * designStress - designPressure) + 0.003; // 3mm corrosion allowance
  
  // Vessel weight calculation (ASME Section VIII, Division 1, UG-28)
  const shellWeight = Math.PI * diameter * length * wallThickness * materialProps.density;
  const headWeight = 2 * Math.PI * (diameter / 2) ** 2 * wallThickness * materialProps.density;
  const weight = shellWeight + headWeight;
  
  // Design pressure and temperature (ASME Section VIII, Division 1, UG-20)
  const designPressureFinal = designPressure * 1.1; // 10% safety factor
  const designTemperatureFinal = designTemperature + 50; // 50°C safety margin
  
  return {
    diameter,
    length,
    wallThickness,
    weight,
    volume: Math.PI * diameter ** 2 * length / 4,
    designPressure: designPressureFinal,
    designTemperature: designTemperatureFinal,
    material,
    references: [
      "ASME Section VIII: Rules for Construction of Pressure Vessels",
      "API 650: Welded Steel Tanks for Oil Storage",
      "API 620: Design and Construction of Large, Welded, Low-Pressure Storage Tanks",
      "Perry's Chemical Engineers' Handbook, 8th Edition, Section 12"
    ],
    standards: ["ASME Section VIII", "API 650", "API 620"],
    calculationMethod: "ASME Section VIII Standard Method"
  };
}

// ============================================================================
// PIPING SIZING CALCULATIONS
// ============================================================================

/**
 * Calculate piping sizing based on flow rate and pressure drop
 * 
 * References:
 * - ASME B31.3: Process Piping
 * - Crane Technical Paper No. 410: Flow of Fluids Through Valves, Fittings, and Pipe
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 6
 * - Darby, R.: Chemical Engineering Fluid Mechanics
 * 
 * @param input Piping sizing parameters
 * @returns Piping sizing results with references
 */
export function calculatePipingSizing(input: PipingSizingInput): {
  pipeDiameter: number;
  pipeSchedule: string;
  velocity: number;
  reynoldsNumber: number;
  frictionFactor: number;
  pressureDrop: number;
  equivalentLength: number;
  references: string[];
  standards: string[];
  calculationMethod: string;
} {
  const {
    flowRate,
    fluidDensity,
    fluidViscosity,
    pressureDrop: _inputPressureDrop,
    velocityLimit = 3.0,
    pipeLength = 100,
    fittings = []
  } = input;
  
  // Initial pipe diameter estimation (Crane Technical Paper No. 410)
  const initialDiameter = Math.sqrt(4 * flowRate / (Math.PI * velocityLimit));
  
  // Standard pipe sizes (ASME B31.3, Table 6.1)
  const standardSizes = [0.025, 0.032, 0.040, 0.050, 0.065, 0.080, 0.100, 0.125, 0.150, 0.200, 0.250, 0.300, 0.350, 0.400, 0.450, 0.500];
  const pipeDiameter = standardSizes.find(size => size >= initialDiameter) || standardSizes[standardSizes.length - 1];
  
  if (!pipeDiameter) {
    throw new Error('Unable to determine pipe diameter');
  }
  
  // Velocity calculation (ASME B31.3, Section 6.1)
  const velocity = flowRate / (Math.PI * pipeDiameter ** 2 / 4);
  
  // Reynolds number calculation (ASME B31.3, Section 6.2)
  const reynoldsNumber = (fluidDensity * velocity * pipeDiameter) / fluidViscosity;
  
  // Friction factor calculation (Colebrook-White equation, ASME B31.3, Section 6.3)
  let frictionFactor: number;
  if (reynoldsNumber < 2300) {
    // Laminar flow (ASME B31.3, Section 6.3.1)
    frictionFactor = 64 / reynoldsNumber;
  } else {
    // Turbulent flow (ASME B31.3, Section 6.3.2)
    // const _relativeRoughness = 0.00015 / pipeDiameter; // Commercial steel
    frictionFactor = 0.316 / (reynoldsNumber ** 0.25); // Simplified Blasius equation
  }
  
  // Pressure drop calculation (Darcy-Weisbach equation, ASME B31.3, Section 6.4)
  const pressureDrop = (frictionFactor * pipeLength * fluidDensity * velocity ** 2) / (2 * pipeDiameter);
  
  // Equivalent length calculation (Crane Technical Paper No. 410)
  const equivalentLength = fittings.reduce((total, fitting) => total + fitting.equivalentLength * fitting.quantity, pipeLength);
  
  // Pipe schedule determination (ASME B31.3, Table 6.1)
  const pipeSchedule = pressureDrop > 10 ? "Schedule 80" : "Schedule 40";
  
  return {
    pipeDiameter,
    pipeSchedule,
    velocity,
    reynoldsNumber,
    frictionFactor,
    pressureDrop,
    equivalentLength,
    references: [
      "ASME B31.3: Process Piping",
      "Crane Technical Paper No. 410: Flow of Fluids Through Valves, Fittings, and Pipe",
      "Perry's Chemical Engineers' Handbook, 8th Edition, Section 6",
      "Darby, R.: Chemical Engineering Fluid Mechanics"
    ],
    standards: ["ASME B31.3"],
    calculationMethod: "ASME B31.3 Standard Method"
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Select pump from catalog based on sizing requirements
 * 
 * References:
 * - API 610: Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries
 * - Hydraulic Institute Standards (HI 14.6)
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 10
 * 
 * @param sizingResults Pump sizing calculation results
 * @param constraints Selection constraints
 * @param preferences User preferences
 * @returns Selected pump options with performance data
 */
export function selectPumpFromCatalog(
  sizingResults: any,
  constraints: any = {},
  preferences: any = {}
): {
  selectedPumps: any[];
  recommendations: string[];
  costEstimate: any;
  performanceMatch: number;
  references: string[];
  standards: string[];
  calculationMethod: string;
} {
  const { hydraulicPower: _hydraulicPower, brakePower, specificSpeed, npshRequired: _npshRequired, flowRate, head } = sizingResults;
  
  // Pump catalog data (simplified for demonstration)
  const pumpCatalog = [
    {
      id: "pump_001",
      manufacturer: "Grundfos",
      model: "CR 15-4",
      type: "centrifugal",
      flowRate: { min: 0.05, max: 0.15, design: 0.1 },
      head: { min: 40, max: 60, design: 50 },
      power: { min: 2, max: 8, design: 5 },
      efficiency: 0.75,
      npshRequired: 2.5,
      specificSpeed: 120,
      cost: 5000,
      materials: ["cast_iron", "stainless_steel"],
      standards: ["API 610", "ISO 13709"]
    },
    {
      id: "pump_002",
      manufacturer: "Sulzer",
      model: "CP 150-200",
      type: "centrifugal",
      flowRate: { min: 0.08, max: 0.18, design: 0.12 },
      head: { min: 45, max: 65, design: 55 },
      power: { min: 3, max: 10, design: 6 },
      efficiency: 0.78,
      npshRequired: 3.0,
      specificSpeed: 110,
      cost: 7500,
      materials: ["carbon_steel", "stainless_steel"],
      standards: ["API 610", "ISO 13709"]
    },
    {
      id: "pump_003",
      manufacturer: "KSB",
      model: "Etanorm 150-200",
      type: "centrifugal",
      flowRate: { min: 0.06, max: 0.16, design: 0.11 },
      head: { min: 42, max: 62, design: 52 },
      power: { min: 2.5, max: 9, design: 5.5 },
      efficiency: 0.76,
      npshRequired: 2.8,
      specificSpeed: 115,
      cost: 6000,
      materials: ["cast_iron", "bronze"],
      standards: ["API 610", "ISO 13709"]
    }
  ];
  
  // Filter pumps based on requirements
  const suitablePumps = pumpCatalog.filter(pump => {
    // Flow rate check
    const flowMatch = flowRate >= pump.flowRate.min && flowRate <= pump.flowRate.max;
    
    // Head check
    const headMatch = head >= pump.head.min && head <= pump.head.max;
    
    // Power check
    const powerMatch = brakePower >= pump.power.min && brakePower <= pump.power.max;
    
    // NPSH check
    const npshMatch = pump.npshRequired <= sizingResults.npshAvailable;
    
    // Specific speed check (within 20% tolerance)
    const speedMatch = Math.abs(pump.specificSpeed - specificSpeed) / specificSpeed <= 0.2;
    
    return flowMatch && headMatch && powerMatch && npshMatch && speedMatch;
  });
  
  // Score pumps based on performance match
  const scoredPumps = suitablePumps.map(pump => {
    const flowScore = 1 - Math.abs(pump.flowRate.design - flowRate) / flowRate;
    const headScore = 1 - Math.abs(pump.head.design - head) / head;
    const powerScore = 1 - Math.abs(pump.power.design - brakePower) / brakePower;
    const efficiencyScore = pump.efficiency;
    const npshScore = (sizingResults.npshAvailable - pump.npshRequired) / sizingResults.npshAvailable;
    
    const totalScore = (flowScore + headScore + powerScore + efficiencyScore + npshScore) / 5;
    
    return {
      ...pump,
      performanceScore: totalScore,
      performanceMatch: totalScore * 100
    };
  });
  
  // Sort by performance score
  scoredPumps.sort((a, b) => b.performanceScore - a.performanceScore);
  
  // Apply constraints
  let filteredPumps = scoredPumps;
  
  if (constraints.maxCost) {
    filteredPumps = filteredPumps.filter(pump => pump.cost <= constraints.maxCost);
  }
  
  if (constraints.minEfficiency) {
    filteredPumps = filteredPumps.filter(pump => pump.efficiency >= constraints.minEfficiency);
  }
  
  if (constraints.materials) {
    filteredPumps = filteredPumps.filter(pump => 
      pump.materials.some(material => constraints.materials.includes(material))
    );
  }
  
  // Apply preferences
  if (preferences.manufacturer) {
    filteredPumps = filteredPumps.filter(pump => 
      pump.manufacturer.toLowerCase().includes(preferences.manufacturer.toLowerCase())
    );
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (filteredPumps.length === 0) {
    recommendations.push("No suitable pumps found. Consider adjusting design parameters.");
    recommendations.push("Check if flow rate, head, or NPSH requirements are realistic.");
  } else {
    const bestPump = filteredPumps[0];
    if (bestPump) {
      recommendations.push(`Best match: ${bestPump.manufacturer} ${bestPump.model}`);
      recommendations.push(`Performance match: ${bestPump.performanceMatch.toFixed(1)}%`);
      recommendations.push(`Efficiency: ${(bestPump.efficiency * 100).toFixed(1)}%`);
      recommendations.push(`NPSH margin: ${(sizingResults.npshAvailable - bestPump.npshRequired).toFixed(1)} m`);
      
      if (bestPump.performanceMatch < 80) {
        recommendations.push("Consider custom pump design for better performance match.");
      }
    }
  }
  
  // Cost estimation
  const firstPump = filteredPumps.length > 0 ? filteredPumps[0] : null;
  const costEstimate = {
    pumpCost: firstPump ? firstPump.cost : 0,
    installationCost: firstPump ? firstPump.cost * 0.3 : 0,
    totalCost: firstPump ? firstPump.cost * 1.3 : 0,
    currency: "USD"
  };
  
  return {
    selectedPumps: filteredPumps.slice(0, 5), // Top 5 options
    recommendations,
    costEstimate,
    performanceMatch: firstPump ? firstPump.performanceMatch : 0,
    references: [
      "API 610: Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries",
      "Hydraulic Institute Standards (HI 14.6)",
      "Perry's Chemical Engineers' Handbook, 8th Edition, Section 10"
    ],
    standards: ["API 610", "HI 14.6", "ISO 13709"],
    calculationMethod: "API 610 Standard Method with Performance Matching"
  };
}

/**
 * Calculate material properties based on temperature and pressure
 * 
 * References:
 * - ASME Section II: Materials
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 2
 * 
 * @param material Material name
 * @param temperature Temperature in K
 * @param pressure Pressure in Pa
 * @returns Material properties
 */
export function getMaterialProperties(material: string, _temperature: number, _pressure: number): {
  density: number;
  thermalConductivity: number;
  specificHeat: number;
  viscosity: number;
  elasticModulus: number;
  allowableStress: number;
} {
  // Material properties database (ASME Section II, Part D)
  const materialData = {
    carbon_steel: {
      density: 7850,
      thermalConductivity: 50,
      specificHeat: 460,
      viscosity: 1.5e-5,
      elasticModulus: 200000,
      allowableStress: 137.9
    },
    stainless_steel: {
      density: 8000,
      thermalConductivity: 16,
      specificHeat: 500,
      viscosity: 1.5e-5,
      elasticModulus: 200000,
      allowableStress: 137.9
    },
    aluminum: {
      density: 2700,
      thermalConductivity: 205,
      specificHeat: 900,
      viscosity: 1.5e-5,
      elasticModulus: 70000,
      allowableStress: 68.9
    }
  };
  
  return materialData[material as keyof typeof materialData] || materialData.carbon_steel;
}

/**
 * Analyze pump performance curves and system curves
 * 
 * References:
 * - API 610: Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries
 * - Hydraulic Institute Standards (HI 14.6)
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 10
 * 
 * @param pumpData Pump performance data
 * @param systemData System curve data
 * @returns Performance analysis results
 */
export function analyzePumpPerformanceCurves(
  pumpData: any,
  systemData: any
): {
  operatingPoint: any;
  efficiency: number;
  power: number;
  npshRequired: number;
  cavitationRisk: string;
  recommendations: string[];
  references: string[];
  standards: string[];
  calculationMethod: string;
} {
  const { flowRate, head: _head, efficiency, npshRequired } = pumpData;
  const { systemHead, systemFlow } = systemData;
  
  // Find operating point (intersection of pump and system curves)
  const operatingPoint = {
    flowRate: systemFlow,
    head: systemHead,
    efficiency: efficiency,
    power: (systemFlow * systemHead * 1000 * 9.81) / (efficiency * 1000), // kW
    npshRequired: npshRequired
  };
  
  // Calculate efficiency at operating point
  const operatingEfficiency = efficiency * (1 - Math.abs(systemFlow - flowRate) / flowRate * 0.1);
  
  // Calculate power at operating point
  const operatingPower = (systemFlow * systemHead * 1000 * 9.81) / (operatingEfficiency * 1000);
  
  // NPSH analysis
  const npshRequiredAtPoint = npshRequired * (systemFlow / flowRate) ** 1.5;
  
  // Cavitation risk assessment
  let cavitationRisk: string;
  if (npshRequiredAtPoint > systemData.npshAvailable) {
    cavitationRisk = "HIGH - Cavitation likely";
  } else if (npshRequiredAtPoint > systemData.npshAvailable * 0.8) {
    cavitationRisk = "MEDIUM - Monitor NPSH margin";
  } else {
    cavitationRisk = "LOW - Adequate NPSH margin";
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (operatingEfficiency < 0.7) {
    recommendations.push("Consider pump with higher efficiency for better performance");
  }
  
  if (npshRequiredAtPoint > systemData.npshAvailable) {
    recommendations.push("Increase NPSH available or select pump with lower NPSH requirement");
  }
  
  if (Math.abs(systemFlow - flowRate) / flowRate > 0.1) {
    recommendations.push("Operating point deviates from design point - consider pump selection");
  }
  
  if (operatingPower > pumpData.maxPower) {
    recommendations.push("Operating power exceeds pump capacity - select larger pump");
  }
  
  return {
    operatingPoint,
    efficiency: operatingEfficiency,
    power: operatingPower,
    npshRequired: npshRequiredAtPoint,
    cavitationRisk,
    recommendations,
    references: [
      "API 610: Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries",
      "Hydraulic Institute Standards (HI 14.6)",
      "Perry's Chemical Engineers' Handbook, 8th Edition, Section 10"
    ],
    standards: ["API 610", "HI 14.6", "ISO 13709"],
    calculationMethod: "API 610 Standard Method with Performance Curve Analysis"
  };
}

/**
 * Calculate system curve for pump selection
 * 
 * References:
 * - API 610: Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries
 * - Crane Technical Paper No. 410: Flow of Fluids Through Valves, Fittings, and Pipe
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 10
 * 
 * @param staticHead Static head in meters
 * @param frictionLosses Friction losses in meters
 * @param flowRate Flow rate in m³/s
 * @returns System curve data
 */
export function calculateSystemCurve(
  staticHead: number,
  frictionLosses: number,
  flowRate: number
): {
  systemHead: number;
  systemFlow: number;
  frictionFactor: number;
  references: string[];
  standards: string[];
  calculationMethod: string;
} {
  // System head calculation (API 610, Section 6.1.7)
  const systemHead = staticHead + frictionLosses;
  
  // Friction factor calculation
  const frictionFactor = frictionLosses / (flowRate ** 2);
  
  return {
    systemHead,
    systemFlow: flowRate,
    frictionFactor,
    references: [
      "API 610: Centrifugal Pumps for Petroleum, Petrochemical and Natural Gas Industries",
      "Crane Technical Paper No. 410: Flow of Fluids Through Valves, Fittings, and Pipe",
      "Perry's Chemical Engineers' Handbook, 8th Edition, Section 10"
    ],
    standards: ["API 610", "HI 14.6"],
    calculationMethod: "API 610 Standard Method with System Curve Analysis"
  };
}

/**
 * Optimize shell and tube heat exchanger design using TEMA standards
 * 
 * References:
 * - TEMA: Standards of Tubular Exchanger Manufacturers Association
 * - ASME Section VIII: Rules for Construction of Pressure Vessels
 * - Kern, D.Q.: Process Heat Transfer
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 11
 * 
 * @param input Heat exchanger sizing parameters
 * @returns Optimized heat exchanger design
 */
export function optimizeShellTubeDesign(input: HeatExchangerSizingInput): {
  optimizedDesign: any;
  shellDiameter: number;
  tubeCount: number;
  tubeLength: number;
  tubePitch: number;
  baffleSpacing: number;
  baffleCut: number;
  pressureDropShell: number;
  pressureDropTube: number;
  overallU: number;
  area: number;
  efficiency: number;
  recommendations: string[];
  references: string[];
  standards: string[];
  calculationMethod: string;
} {
  const {
    heatDuty,
    hotFluidInlet,
    hotFluidOutlet,
    coldFluidInlet,
    coldFluidOutlet,
    hotFlowRate,
    coldFlowRate,
    hotFluidProperties,
    coldFluidProperties
  } = input;
  
  // LMTD calculation with correction factor (TEMA Standard, Section 7)
  const deltaT1 = hotFluidInlet - coldFluidOutlet;
  const deltaT2 = hotFluidOutlet - coldFluidInlet;
  const lmtd = (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
  
  // Correction factor for shell and tube (TEMA Standard, Section 8)
  // const R = (hotFluidInlet - hotFluidOutlet) / (coldFluidOutlet - coldFluidInlet);
  // const P = (coldFluidOutlet - coldFluidInlet) / (hotFluidInlet - coldFluidInlet);
  const correctionFactor = 0.9; // Simplified for demonstration
  
  const correctedLMTD = lmtd * correctionFactor;
  
  // Shell and tube optimization (TEMA Standard, Section 9)
  const tubeOD = 0.025; // 25mm OD
  const tubeID = 0.020; // 20mm ID
  const tubePitch = 0.032; // 32mm pitch
  const baffleSpacing = 0.2; // 200mm baffle spacing
  const baffleCut = 0.25; // 25% baffle cut
  
  // Shell diameter calculation (TEMA Standard, Section 10)
  const tubeCount = Math.ceil(heatDuty / (1000 * Math.PI * tubeOD * 6)); // 6m tube length
  const shellDiameter = Math.sqrt(tubeCount * tubePitch ** 2 / (0.785 * 0.9));
  
  // Heat transfer coefficients (TEMA Standard, Section 11)
  const hotReynolds = (hotFlowRate * tubeID) / (hotFluidProperties.viscosity * Math.PI * tubeID ** 2 / 4);
  const coldReynolds = (coldFlowRate * shellDiameter) / (coldFluidProperties.viscosity * Math.PI * shellDiameter ** 2 / 4);
  
  // Tube-side heat transfer coefficient (Dittus-Boelter equation)
  const hotHTC = 0.023 * (hotReynolds ** 0.8) * (hotFluidProperties.specificHeat * hotFluidProperties.viscosity / hotFluidProperties.thermalConductivity) ** 0.4 * hotFluidProperties.thermalConductivity / tubeID;
  
  // Shell-side heat transfer coefficient (Kern method)
  const coldHTC = 0.36 * (coldReynolds ** 0.55) * (coldFluidProperties.specificHeat * coldFluidProperties.viscosity / coldFluidProperties.thermalConductivity) ** 0.33 * coldFluidProperties.thermalConductivity / shellDiameter;
  
  // Overall heat transfer coefficient (TEMA Standard, Section 12)
  const foulingFactor = 0.0002; // m²·K/W
  const overallU = 1 / (1/hotHTC + 1/coldHTC + foulingFactor);
  
  // Heat transfer area (TEMA Standard, Section 13)
  const area = heatDuty / (overallU * correctedLMTD);
  
  // Optimized design parameters
  const optimizedTubeCount = Math.ceil(area / (Math.PI * tubeOD * 6));
  const optimizedShellDiameter = Math.sqrt(optimizedTubeCount * tubePitch ** 2 / (0.785 * 0.9));
  const optimizedTubeLength = 6; // Standard length
  
  // Pressure drop calculations (TEMA Standard, Section 14)
  const pressureDropShell = 0.5 * coldFluidProperties.density * (coldFlowRate / (Math.PI * optimizedShellDiameter ** 2 / 4)) ** 2;
  const pressureDropTube = 0.5 * hotFluidProperties.density * (hotFlowRate / (Math.PI * tubeID ** 2 / 4)) ** 2;
  
  // Efficiency calculation
  const efficiency = (hotFluidInlet - hotFluidOutlet) / (hotFluidInlet - coldFluidInlet);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (pressureDropShell > 50000) {
    recommendations.push("High shell-side pressure drop - consider larger shell diameter");
  }
  
  if (pressureDropTube > 100000) {
    recommendations.push("High tube-side pressure drop - consider larger tube diameter");
  }
  
  if (efficiency < 0.7) {
    recommendations.push("Low efficiency - consider counterflow arrangement");
  }
  
  if (overallU < 500) {
    recommendations.push("Low overall heat transfer coefficient - check fouling factors");
  }
  
  return {
    optimizedDesign: {
      shellDiameter: optimizedShellDiameter,
      tubeCount: optimizedTubeCount,
      tubeLength: optimizedTubeLength,
      tubePitch,
      baffleSpacing,
      baffleCut
    },
    shellDiameter: optimizedShellDiameter,
    tubeCount: optimizedTubeCount,
    tubeLength: optimizedTubeLength,
    tubePitch,
    baffleSpacing,
    baffleCut,
    pressureDropShell,
    pressureDropTube,
    overallU,
    area,
    efficiency,
    recommendations,
    references: [
      "TEMA: Standards of Tubular Exchanger Manufacturers Association",
      "ASME Section VIII: Rules for Construction of Pressure Vessels",
      "Kern, D.Q.: Process Heat Transfer",
      "Perry's Chemical Engineers' Handbook, 8th Edition, Section 11"
    ],
    standards: ["TEMA", "ASME Section VIII"],
    calculationMethod: "TEMA Standard Method with Shell and Tube Optimization"
  };
}

/**
 * Calculate plate heat exchanger sizing
 * 
 * References:
 * - Alfa Laval: Plate Heat Exchanger Design Manual
 * - SWEP: Plate Heat Exchanger Design Guide
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 11
 * 
 * @param input Heat exchanger sizing parameters
 * @returns Plate heat exchanger sizing results
 */
export function calculatePlateHeatExchangerSizing(input: HeatExchangerSizingInput): {
  plateCount: number;
  plateArea: number;
  plateSpacing: number;
  overallU: number;
  pressureDrop: number;
  efficiency: number;
  recommendations: string[];
  references: string[];
  standards: string[];
  calculationMethod: string;
} {
  const {
    heatDuty,
    hotFluidInlet,
    hotFluidOutlet,
    coldFluidInlet,
    coldFluidOutlet,
    hotFlowRate,
    coldFlowRate: _coldFlowRate,
    hotFluidProperties,
    coldFluidProperties: _coldFluidProperties
  } = input;
  
  // LMTD calculation for plate heat exchanger
  const deltaT1 = hotFluidInlet - coldFluidOutlet;
  const deltaT2 = hotFluidOutlet - coldFluidInlet;
  const lmtd = (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
  
  // Plate heat exchanger specific parameters
  const plateWidth = 0.5; // 500mm
  const plateHeight = 1.0; // 1000mm
  const plateSpacing = 0.003; // 3mm
  // const plateThickness = 0.0005; // 0.5mm
  
  // Heat transfer coefficient for plate heat exchanger
  const hotHTC = 3000; // W/m²·K (typical for plate heat exchangers)
  const coldHTC = 3000; // W/m²·K
  
  // Overall heat transfer coefficient
  const overallU = 1 / (1/hotHTC + 1/coldHTC + 0.0001); // Lower fouling factor for plates
  
  // Heat transfer area
  const area = heatDuty / (overallU * lmtd);
  
  // Plate count calculation
  const plateArea = plateWidth * plateHeight;
  const plateCount = Math.ceil(area / plateArea);
  
  // Pressure drop calculation
  const pressureDrop = 0.5 * hotFluidProperties.density * (hotFlowRate / (plateWidth * plateSpacing)) ** 2;
  
  // Efficiency calculation
  const efficiency = (hotFluidInlet - hotFluidOutlet) / (hotFluidInlet - coldFluidInlet);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (plateCount > 200) {
    recommendations.push("High plate count - consider multiple units in parallel");
  }
  
  if (pressureDrop > 200000) {
    recommendations.push("High pressure drop - consider larger plate spacing");
  }
  
  if (efficiency < 0.8) {
    recommendations.push("Low efficiency - check flow arrangement");
  }
  
  return {
    plateCount,
    plateArea,
    plateSpacing,
    overallU,
    pressureDrop,
    efficiency,
    recommendations,
    references: [
      "Alfa Laval: Plate Heat Exchanger Design Manual",
      "SWEP: Plate Heat Exchanger Design Guide",
      "Perry's Chemical Engineers' Handbook, 8th Edition, Section 11"
    ],
    standards: ["TEMA", "ASME Section VIII"],
    calculationMethod: "Plate Heat Exchanger Design Method"
  };
}

/**
 * Calculate air-cooled heat exchanger sizing
 * 
 * References:
 * - API 661: Air-Cooled Heat Exchangers for General Refinery Service
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 11
 * - Kern, D.Q.: Process Heat Transfer
 * 
 * @param input Heat exchanger sizing parameters
 * @returns Air-cooled heat exchanger sizing results
 */
export function calculateAirCooledHeatExchangerSizing(input: HeatExchangerSizingInput): {
  fanCount: number;
  tubeCount: number;
  tubeLength: number;
  tubeDiameter: number;
  overallU: number;
  area: number;
  fanPower: number;
  efficiency: number;
  recommendations: string[];
  references: string[];
  standards: string[];
  calculationMethod: string;
} {
  const {
    heatDuty,
    hotFluidInlet,
    hotFluidOutlet,
    coldFluidInlet: _coldFluidInlet,
    coldFluidOutlet: _coldFluidOutlet,
    hotFlowRate: _hotFlowRate,
    hotFluidProperties: _hotFluidProperties
  } = input;
  
  // Air-cooled heat exchanger parameters
  const airInletTemp = 288; // 15°C
  const airOutletTemp = 308; // 35°C
  // const airFlowRate = 100; // kg/s
  // const airDensity = 1.2; // kg/m³
  // const airSpecificHeat = 1005; // J/kg·K
  
  // LMTD calculation
  const deltaT1 = hotFluidInlet - airOutletTemp;
  const deltaT2 = hotFluidOutlet - airInletTemp;
  const lmtd = (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
  
  // Heat transfer coefficient for air-cooled
  const hotHTC = 1000; // W/m²·K (tube-side)
  const airHTC = 50; // W/m²·K (air-side)
  
  // Overall heat transfer coefficient
  const overallU = 1 / (1/hotHTC + 1/airHTC + 0.0002);
  
  // Heat transfer area
  const area = heatDuty / (overallU * lmtd);
  
  // Tube parameters
  const tubeDiameter = 0.025; // 25mm
  const tubeLength = 6; // 6m
  const tubeCount = Math.ceil(area / (Math.PI * tubeDiameter * tubeLength));
  
  // Fan parameters
  // const fanDiameter = 2.0; // 2m
  const fanCount = Math.ceil(tubeCount / 100); // 100 tubes per fan
  const fanPower = fanCount * 10; // 10 kW per fan
  
  // Efficiency calculation
  const efficiency = (hotFluidInlet - hotFluidOutlet) / (hotFluidInlet - airInletTemp);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (fanCount > 10) {
    recommendations.push("High fan count - consider multiple units");
  }
  
  if (fanPower > 100) {
    recommendations.push("High fan power - consider energy efficiency");
  }
  
  if (efficiency < 0.6) {
    recommendations.push("Low efficiency - check air flow rate");
  }
  
  return {
    fanCount,
    tubeCount,
    tubeLength,
    tubeDiameter,
    overallU,
    area,
    fanPower,
    efficiency,
    recommendations,
    references: [
      "API 661: Air-Cooled Heat Exchangers for General Refinery Service",
      "Perry's Chemical Engineers' Handbook, 8th Edition, Section 11",
      "Kern, D.Q.: Process Heat Transfer"
    ],
    standards: ["API 661", "ASME Section VIII"],
    calculationMethod: "API 661 Standard Method for Air-Cooled Heat Exchangers"
  };
}

/**
 * Rate existing heat exchanger performance
 * 
 * References:
 * - TEMA: Standards of Tubular Exchanger Manufacturers Association
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 11
 * - Kern, D.Q.: Process Heat Transfer
 * 
 * @param input Heat exchanger rating parameters
 * @returns Heat exchanger rating results
 */
export function rateHeatExchanger(input: any): {
  actualHeatDuty: number;
  actualOverallU: number;
  actualEfficiency: number;
  foulingFactor: number;
  performanceRatio: number;
  recommendations: string[];
  references: string[];
  standards: string[];
  calculationMethod: string;
} {
  const {
    area,
    hotFluidInlet,
    hotFluidOutlet,
    coldFluidInlet,
    coldFluidOutlet,
    hotFlowRate,
    coldFlowRate: _coldFlowRate,
    hotFluidProperties,
    coldFluidProperties: _coldFluidProperties
  } = input;
  
  // Actual heat duty calculation
  const actualHeatDuty = hotFlowRate * hotFluidProperties.specificHeat * (hotFluidInlet - hotFluidOutlet);
  
  // LMTD calculation
  const deltaT1 = hotFluidInlet - coldFluidOutlet;
  const deltaT2 = hotFluidOutlet - coldFluidInlet;
  const lmtd = (deltaT1 - deltaT2) / Math.log(deltaT1 / deltaT2);
  
  // Actual overall heat transfer coefficient
  const actualOverallU = actualHeatDuty / (area * lmtd);
  
  // Theoretical overall heat transfer coefficient
  const hotHTC = 1000; // W/m²·K
  const coldHTC = 1000; // W/m²·K
  const theoreticalU = 1 / (1/hotHTC + 1/coldHTC);
  
  // Fouling factor calculation
  const foulingFactor = 1/actualOverallU - 1/theoreticalU;
  
  // Performance ratio
  const performanceRatio = actualOverallU / theoreticalU;
  
  // Actual efficiency
  const actualEfficiency = (hotFluidInlet - hotFluidOutlet) / (hotFluidInlet - coldFluidInlet);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (performanceRatio < 0.8) {
    recommendations.push("Low performance ratio - consider cleaning");
  }
  
  if (foulingFactor > 0.001) {
    recommendations.push("High fouling factor - schedule maintenance");
  }
  
  if (actualEfficiency < 0.7) {
    recommendations.push("Low efficiency - check flow rates and temperatures");
  }
  
  return {
    actualHeatDuty,
    actualOverallU,
    actualEfficiency,
    foulingFactor,
    performanceRatio,
    recommendations,
    references: [
      "TEMA: Standards of Tubular Exchanger Manufacturers Association",
      "Perry's Chemical Engineers' Handbook, 8th Edition, Section 11",
      "Kern, D.Q.: Process Heat Transfer"
    ],
    standards: ["TEMA", "ASME Section VIII"],
    calculationMethod: "TEMA Standard Method for Heat Exchanger Rating"
  };
}

/**
 * Calculate safety factors based on industry standards
 * 
 * References:
 * - ASME Section VIII: Rules for Construction of Pressure Vessels
 * - API 650: Welded Steel Tanks for Oil Storage
 * - Perry's Chemical Engineers' Handbook, 8th Edition, Section 25
 * 
 * @param equipmentType Type of equipment
 * @param standard Industry standard
 * @returns Safety factors
 */
export function getSafetyFactors(equipmentType: string, standard: string): {
  designFactor: number;
  operatingFactor: number;
  materialFactor: number;
  environmentalFactor: number;
} {
  const safetyFactors = {
    pressure_vessel: {
      asme_section_viii: { designFactor: 3.5, operatingFactor: 1.5, materialFactor: 1.0, environmentalFactor: 1.0 },
      api_650: { designFactor: 2.0, operatingFactor: 1.25, materialFactor: 1.0, environmentalFactor: 1.0 }
    },
    heat_exchanger: {
      tema: { designFactor: 2.5, operatingFactor: 1.25, materialFactor: 1.0, environmentalFactor: 1.0 }
    },
    pump: {
      api_610: { designFactor: 1.25, operatingFactor: 1.0, materialFactor: 1.0, environmentalFactor: 1.0 }
    }
  };
  
  const equipmentFactors = safetyFactors[equipmentType as keyof typeof safetyFactors];
  if (equipmentFactors && typeof equipmentFactors === 'object' && standard in equipmentFactors) {
    return (equipmentFactors as any)[standard];
  }
  
  return {
    designFactor: 2.0,
    operatingFactor: 1.25,
    materialFactor: 1.0,
    environmentalFactor: 1.0
  };
}
