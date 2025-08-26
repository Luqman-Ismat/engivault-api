import { Quantity } from '@/schemas/common';
import { convert } from '@/utils/units';
import { Warning } from '@/utils/guardrails';
import { reynolds, churchillF } from './friction';

export interface HXGeometry {
  // Tube side geometry
  tubeDiameter: Quantity; // m (inner diameter)
  tubeLength: Quantity; // m
  numberOfTubes: number;
  tubePitch: Quantity; // m (center-to-center distance)
  tubeThickness: Quantity; // m (wall thickness)
  
  // Shell side geometry
  shellDiameter: Quantity; // m
  baffleSpacing: Quantity; // m
  baffleCut: number; // % (percentage of shell diameter)
  
  // Common geometry
  tubeLayout: 'triangular' | 'square' | 'rotated-square';
}

export interface HXPressureDropInput {
  geometry: HXGeometry;
  passes: number; // Number of tube passes
  massFlux: Quantity; // kg/(m²·s)
  fluidSide: 'tube' | 'shell';
  fluidProperties: {
    density: Quantity; // kg/m³
    viscosity: Quantity; // Pa·s
  };
  roughness?: Quantity; // m (optional, defaults to standard values)
}

export interface HXPressureDropResult {
  pressureDrop: Quantity; // Pa
  pressureDropPercent: number; // %
  velocity: Quantity; // m/s
  reynoldsNumber: number;
  frictionFactor: number;
  flowArea: Quantity; // m²
  equivalentDiameter: Quantity; // m
  flowLength: Quantity; // m
  numberOfCrossings: number; // For shell side
  baffleSpacing: Quantity; // m (for shell side)
  warnings: (string | Warning)[];
  metadata: {
    input: HXPressureDropInput;
    calculations: {
      correlation: string;
      flowRegime: 'laminar' | 'turbulent' | 'transition';
      parameters: Record<string, number>;
    };
  };
}

// Standard roughness values (m)
const STANDARD_ROUGHNESS = {
  'drawn-tube': 0.0000015, // Drawn tubing
  'commercial-steel': 0.000045, // Commercial steel pipe
  'galvanized-steel': 0.00015, // Galvanized steel
  'cast-iron': 0.00026, // Cast iron
  'concrete': 0.0003, // Concrete
  'riveted-steel': 0.0009, // Riveted steel
} as const;

/**
 * Calculate tube side pressure drop using Bell-Delaware method
 * Based on Bell, K.J. and Mueller, A.C. (2001) - "Wolverine Heat Transfer Data Book"
 * 
 * Pressure drop components:
 * 1. Friction loss in straight tubes
 * 2. Entrance and exit losses
 * 3. Return bend losses
 * 
 * @param input - Heat exchanger pressure drop input parameters
 * @returns Tube side pressure drop result
 */
export function hxPressureDrop(input: HXPressureDropInput): HXPressureDropResult {
  const warnings: (string | Warning)[] = [];
  
  // Convert input parameters to SI units
  const tubeDiameter = convert(input.geometry.tubeDiameter, 'm').value;
  const tubeLength = convert(input.geometry.tubeLength, 'm').value;
  const tubePitch = convert(input.geometry.tubePitch, 'm').value;
  const tubeThickness = convert(input.geometry.tubeThickness, 'm').value;
  const shellDiameter = convert(input.geometry.shellDiameter, 'm').value;
  const baffleSpacing = convert(input.geometry.baffleSpacing, 'm').value;
  const massFlux = convert(input.massFlux, 'kg/(m²·s)').value;
  const density = convert(input.fluidProperties.density, 'kg/m³').value;
  const viscosity = convert(input.fluidProperties.viscosity, 'Pa·s').value;
  
  // Use provided roughness or default to drawn tube
  const roughness = input.roughness 
    ? convert(input.roughness, 'm').value 
    : STANDARD_ROUGHNESS['drawn-tube'];
  
  // Validate inputs
  if (tubeDiameter <= 0 || tubeLength <= 0 || input.geometry.numberOfTubes <= 0) {
    throw new Error('Tube diameter, length, and number of tubes must be positive');
  }
  
  if (massFlux <= 0 || density <= 0 || viscosity <= 0) {
    throw new Error('Mass flux, density, and viscosity must be positive');
  }
  
  if (input.passes <= 0) {
    throw new Error('Number of passes must be positive');
  }
  
  if (input.fluidSide === 'tube') {
    return calculateTubeSidePressureDrop(input, warnings);
  } else {
    return calculateShellSidePressureDrop(input, warnings);
  }
}

/**
 * Calculate tube side pressure drop
 * @param input - Input parameters
 * @param warnings - Warning array to populate
 * @returns Tube side pressure drop result
 */
function calculateTubeSidePressureDrop(
  input: HXPressureDropInput, 
  warnings: (string | Warning)[]
): HXPressureDropResult {
  const tubeDiameter = convert(input.geometry.tubeDiameter, 'm').value;
  const tubeLength = convert(input.geometry.tubeLength, 'm').value;
  const massFlux = convert(input.massFlux, 'kg/(m²·s)').value;
  const density = convert(input.fluidProperties.density, 'kg/m³').value;
  const viscosity = convert(input.fluidProperties.viscosity, 'Pa·s').value;
  const roughness = input.roughness 
    ? convert(input.roughness, 'm').value 
    : STANDARD_ROUGHNESS['drawn-tube'];
  
  // Calculate flow area (single tube)
  const flowArea = (Math.PI * Math.pow(tubeDiameter, 2)) / 4;
  
  // Calculate velocity
  const velocity = massFlux / density;
  
  // Calculate Reynolds number
  const reynoldsNumber = reynolds(density, velocity, tubeDiameter, viscosity);
  
  // Determine flow regime
  let flowRegime: 'laminar' | 'turbulent' | 'transition';
  if (reynoldsNumber < 2300) {
    flowRegime = 'laminar';
  } else if (reynoldsNumber > 4000) {
    flowRegime = 'turbulent';
  } else {
    flowRegime = 'transition';
    warnings.push({
      type: 'general',
      message: 'Flow is in transition region (2300 < Re < 4000), results may be uncertain',
      severity: 'medium'
    });
  }
  
  // Calculate friction factor
  const relativeRoughness = roughness / tubeDiameter;
  const frictionFactor = churchillF(reynoldsNumber, relativeRoughness);
  
  // Calculate equivalent length for return bends
  // Based on Crane Technical Paper 410
  const returnBendEquivalentLength = 30 * tubeDiameter; // 30 diameters per return bend
  
  // Total equivalent length
  const totalLength = tubeLength * input.passes + returnBendEquivalentLength * (input.passes - 1);
  
  // Calculate pressure drop using Darcy-Weisbach equation
  const pressureDrop = (frictionFactor * totalLength * density * Math.pow(velocity, 2)) / (2 * tubeDiameter);
  
  // Calculate pressure drop percentage (relative to atmospheric pressure)
  const pressureDropPercent = (pressureDrop / 101325) * 100;
  
  // Add warnings for extreme conditions
  if (reynoldsNumber < 1000) {
    warnings.push({
      type: 'general',
      message: 'Very low Reynolds number, laminar flow correlations may not be accurate',
      severity: 'medium'
    });
  }
  
  if (velocity > 3) {
    warnings.push({
      type: 'general',
      message: 'High velocity may cause erosion concerns',
      severity: 'medium'
    });
  }
  
  return {
    pressureDrop: { value: pressureDrop, unit: 'Pa' },
    pressureDropPercent,
    velocity: { value: velocity, unit: 'm/s' },
    reynoldsNumber,
    frictionFactor,
    flowArea: { value: flowArea, unit: 'm²' },
    equivalentDiameter: { value: tubeDiameter, unit: 'm' },
    flowLength: { value: totalLength, unit: 'm' },
    numberOfCrossings: 0, // Not applicable for tube side
    baffleSpacing: { value: 0, unit: 'm' }, // Not applicable for tube side
    warnings,
    metadata: {
      input,
      calculations: {
        correlation: 'Darcy-Weisbach with Churchill friction factor',
        flowRegime,
        parameters: {
          relativeRoughness,
          returnBendEquivalentLength: returnBendEquivalentLength,
          totalLength,
          singleTubeLength: tubeLength,
          numberOfPasses: input.passes
        }
      }
    }
  };
}

/**
 * Calculate shell side pressure drop using Bell-Delaware method
 * Based on Bell, K.J. (1983) - "Final Report of the Cooperative Research Program on Shell and Tube Heat Exchangers"
 * 
 * Pressure drop components:
 * 1. Cross-flow pressure drop
 * 2. Window-flow pressure drop
 * 3. Entrance and exit pressure drop
 * 
 * @param input - Input parameters
 * @param warnings - Warning array to populate
 * @returns Shell side pressure drop result
 */
function calculateShellSidePressureDrop(
  input: HXPressureDropInput, 
  warnings: (string | Warning)[]
): HXPressureDropResult {
  const tubeDiameter = convert(input.geometry.tubeDiameter, 'm').value;
  const tubeLength = convert(input.geometry.tubeLength, 'm').value;
  const tubePitch = convert(input.geometry.tubePitch, 'm').value;
  const tubeThickness = convert(input.geometry.tubeThickness, 'm').value;
  const shellDiameter = convert(input.geometry.shellDiameter, 'm').value;
  const baffleSpacing = convert(input.geometry.baffleSpacing, 'm').value;
  const massFlux = convert(input.massFlux, 'kg/(m²·s)').value;
  const density = convert(input.fluidProperties.density, 'kg/m³').value;
  const viscosity = convert(input.fluidProperties.viscosity, 'Pa·s').value;
  
  // Calculate tube bundle parameters
  const tubeOuterDiameter = tubeDiameter + 2 * tubeThickness;
  const clearance = tubePitch - tubeOuterDiameter;
  
  // Calculate flow areas
  const bundleDiameter = shellDiameter - 0.025; // Typical clearance
  const bundleArea = (Math.PI * Math.pow(bundleDiameter, 2)) / 4;
  const tubeArea = (Math.PI * Math.pow(tubeOuterDiameter, 2) / 4) * input.geometry.numberOfTubes;
  const crossFlowArea = bundleArea - tubeArea;
  
  // Calculate equivalent diameter for shell side
  // Based on Bell-Delaware method
  let equivalentDiameter: number;
  if (input.geometry.tubeLayout === 'triangular') {
    equivalentDiameter = 4 * (Math.pow(tubePitch, 2) * Math.sqrt(3) / 4 - Math.PI * Math.pow(tubeOuterDiameter, 2) / 8) / 
                        (Math.PI * tubeOuterDiameter / 2);
  } else {
    // Square layout
    equivalentDiameter = 4 * (Math.pow(tubePitch, 2) - Math.PI * Math.pow(tubeOuterDiameter, 2) / 4) / 
                        (Math.PI * tubeOuterDiameter);
  }
  
  // Calculate velocity
  const velocity = massFlux / density;
  
  // Calculate Reynolds number
  const reynoldsNumber = reynolds(density, velocity, equivalentDiameter, viscosity);
  
  // Determine flow regime
  let flowRegime: 'laminar' | 'turbulent' | 'transition';
  if (reynoldsNumber < 2300) {
    flowRegime = 'laminar';
  } else if (reynoldsNumber > 4000) {
    flowRegime = 'turbulent';
  } else {
    flowRegime = 'transition';
    warnings.push({
      type: 'general',
      message: 'Flow is in transition region (2300 < Re < 4000), results may be uncertain',
      severity: 'medium'
    });
  }
  
  // Calculate friction factor for shell side
  // Bell-Delaware correlation
  let frictionFactor: number;
  if (reynoldsNumber < 100) {
    frictionFactor = 72 / reynoldsNumber; // Laminar
  } else {
    frictionFactor = 0.25 * Math.pow(reynoldsNumber, -0.15); // Turbulent
  }
  
  // Calculate number of baffle crossings
  const numberOfCrossings = Math.floor(tubeLength / baffleSpacing) - 1;
  
  // Calculate pressure drop components
  
  // 1. Cross-flow pressure drop
  const crossFlowPressureDrop = frictionFactor * numberOfCrossings * density * Math.pow(velocity, 2) / 2;
  
  // 2. Window-flow pressure drop (simplified)
  const windowPressureDrop = 0.5 * density * Math.pow(velocity, 2) * numberOfCrossings;
  
  // 3. Entrance and exit pressure drop
  const entranceExitPressureDrop = 1.5 * density * Math.pow(velocity, 2);
  
  // Total pressure drop
  const pressureDrop = crossFlowPressureDrop + windowPressureDrop + entranceExitPressureDrop;
  
  // Calculate pressure drop percentage
  const pressureDropPercent = (pressureDrop / 101325) * 100;
  
  // Add warnings for extreme conditions
  if (reynoldsNumber < 1000) {
    warnings.push({
      type: 'general',
      message: 'Very low Reynolds number, laminar flow correlations may not be accurate',
      severity: 'medium'
    });
  }
  
  if (velocity > 2) {
    warnings.push({
      type: 'general',
      message: 'High shell-side velocity may cause vibration concerns',
      severity: 'medium'
    });
  }
  
  if (clearance < 0.001) {
    warnings.push({
      type: 'general',
      message: 'Very small tube clearance may cause flow maldistribution',
      severity: 'high'
    });
  }
  
  return {
    pressureDrop: { value: pressureDrop, unit: 'Pa' },
    pressureDropPercent,
    velocity: { value: velocity, unit: 'm/s' },
    reynoldsNumber,
    frictionFactor,
    flowArea: { value: crossFlowArea, unit: 'm²' },
    equivalentDiameter: { value: equivalentDiameter, unit: 'm' },
    flowLength: { value: tubeLength, unit: 'm' },
    numberOfCrossings,
    baffleSpacing: { value: baffleSpacing, unit: 'm' },
    warnings,
    metadata: {
      input,
      calculations: {
        correlation: 'Bell-Delaware method',
        flowRegime,
        parameters: {
          bundleDiameter,
          tubeOuterDiameter,
          clearance,
          crossFlowArea,
          windowPressureDrop,
          entranceExitPressureDrop,
          crossFlowPressureDrop
        }
      }
    }
  };
}

/**
 * Get standard roughness values
 * @returns Object with standard roughness values
 */
export function getStandardRoughness(): typeof STANDARD_ROUGHNESS {
  return STANDARD_ROUGHNESS;
}

/**
 * Calculate heat exchanger geometry scaling factors
 * @param geometry - Heat exchanger geometry
 * @returns Scaling factors for different parameters
 */
export function calculateHXScalingFactors(geometry: HXGeometry): {
  tubeAreaScaling: number;
  shellAreaScaling: number;
  velocityScaling: number;
  pressureDropScaling: number;
} {
  const tubeDiameter = convert(geometry.tubeDiameter, 'm').value;
  const tubeLength = convert(geometry.tubeLength, 'm').value;
  const numberOfTubes = geometry.numberOfTubes;
  const shellDiameter = convert(geometry.shellDiameter, 'm').value;
  
  // Tube area scaling (proportional to number of tubes and length)
  const tubeAreaScaling = numberOfTubes * tubeLength;
  
  // Shell area scaling (proportional to shell diameter squared)
  const shellAreaScaling = Math.pow(shellDiameter, 2);
  
  // Velocity scaling (inversely proportional to flow area)
  const velocityScaling = 1 / tubeAreaScaling;
  
  // Pressure drop scaling (proportional to length and inversely to diameter)
  const pressureDropScaling = tubeLength / Math.pow(tubeDiameter, 5);
  
  return {
    tubeAreaScaling,
    shellAreaScaling,
    velocityScaling,
    pressureDropScaling
  };
}
