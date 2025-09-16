import { PressureDropInput, PumpPerformanceInput, NPSHInput } from '@/types';

// Pressure Drop Calculation (Darcy-Weisbach equation)
export function calculatePressureDrop(input: PressureDropInput): {
  pressureDrop: number;
  reynoldsNumber: number;
  frictionFactor: number;
  velocity: number;
} {
  const { flowRate, pipeDiameter, pipeLength, fluidDensity, fluidViscosity } = input;
  
  // Calculate velocity
  const pipeArea = Math.PI * Math.pow(pipeDiameter / 2, 2);
  const velocity = flowRate / pipeArea;
  
  // Calculate Reynolds number
  const reynoldsNumber = (fluidDensity * velocity * pipeDiameter) / fluidViscosity;
  
  // Calculate friction factor using Colebrook-White equation (simplified)
  let frictionFactor: number;
  if (reynoldsNumber < 2300) {
    // Laminar flow
    frictionFactor = 64 / reynoldsNumber;
  } else {
    // Turbulent flow - simplified calculation
    frictionFactor = 0.316 / Math.pow(reynoldsNumber, 0.25);
  }
  
  // Calculate pressure drop using Darcy-Weisbach equation
  const pressureDrop = (frictionFactor * pipeLength * fluidDensity * Math.pow(velocity, 2)) / (2 * pipeDiameter);
  
  return {
    pressureDrop,
    reynoldsNumber,
    frictionFactor,
    velocity,
  };
}

// Pump Performance Calculation
export function calculatePumpPerformance(input: PumpPerformanceInput): {
  hydraulicPower: number;
  brakePower: number;
  specificSpeed: number;
  efficiency: number;
} {
  const { flowRate, head, efficiency, power } = input;
  
  // Hydraulic power (kW)
  const hydraulicPower = (flowRate * head * 9.81) / 1000;
  
  // Brake power (kW)
  const brakePower = hydraulicPower / efficiency;
  
  // Specific speed (dimensionless)
  const specificSpeed = (flowRate * Math.pow(head, 0.75)) / Math.pow(power, 0.5);
  
  return {
    hydraulicPower,
    brakePower,
    specificSpeed,
    efficiency,
  };
}

// NPSH Calculation
export function calculateNPSH(input: NPSHInput): {
  npshAvailable: number;
  npshRequired: number;
  margin: number;
  isCavitationRisk: boolean;
} {
  const { suctionPressure, vaporPressure, fluidDensity, suctionVelocity, suctionLosses } = input;
  
  // NPSH Available
  const npshAvailable = (suctionPressure - vaporPressure) / (fluidDensity * 9.81) - suctionLosses;
  
  // NPSH Required (simplified calculation)
  const npshRequired = Math.pow(suctionVelocity, 2) / (2 * 9.81) + 0.5;
  
  // Margin
  const margin = npshAvailable - npshRequired;
  
  // Cavitation risk
  const isCavitationRisk = margin < 0.5;
  
  return {
    npshAvailable,
    npshRequired,
    margin,
    isCavitationRisk,
  };
}

// Flow Rate Calculation
export function calculateFlowRate(
  pressureDrop: number,
  pipeDiameter: number,
  pipeLength: number,
  fluidDensity: number,
  fluidViscosity: number,
  _pipeRoughness: number = 0.00015
): {
  flowRate: number;
  velocity: number;
  reynoldsNumber: number;
} {
  // Iterative calculation for flow rate
  let flowRate = 0.1; // Initial guess
  let error = 1;
  const tolerance = 0.001;
  let iterations = 0;
  const maxIterations = 100;
  
  while (error > tolerance && iterations < maxIterations) {
    const pipeArea = Math.PI * Math.pow(pipeDiameter / 2, 2);
    const velocity = flowRate / pipeArea;
    const reynoldsNumber = (fluidDensity * velocity * pipeDiameter) / fluidViscosity;
    
    let frictionFactor: number;
    if (reynoldsNumber < 2300) {
      frictionFactor = 64 / reynoldsNumber;
    } else {
      frictionFactor = 0.316 / Math.pow(reynoldsNumber, 0.25);
    }
    
    const calculatedPressureDrop = (frictionFactor * pipeLength * fluidDensity * Math.pow(velocity, 2)) / (2 * pipeDiameter);
    
    error = Math.abs(calculatedPressureDrop - pressureDrop) / pressureDrop;
    
    if (error > tolerance) {
      flowRate = flowRate * Math.sqrt(pressureDrop / calculatedPressureDrop);
    }
    
    iterations++;
  }
  
  const pipeArea = Math.PI * Math.pow(pipeDiameter / 2, 2);
  const velocity = flowRate / pipeArea;
  const reynoldsNumber = (fluidDensity * velocity * pipeDiameter) / fluidViscosity;
  
  return {
    flowRate,
    velocity,
    reynoldsNumber,
  };
}
