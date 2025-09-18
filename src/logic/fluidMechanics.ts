/**
 * Fluid Mechanics Calculations
 * 
 * This module provides comprehensive fluid mechanics calculations including:
 * - Open channel flow (Manning's equation, critical depth, hydraulic jump)
 * - Compressible flow (isentropic relations, shock waves, nozzle flow)
 * - Boundary layer analysis (laminar/turbulent, drag calculations)
 * - External flow (flow over cylinders, spheres, airfoils)
 * - Gas dynamics (normal/oblique shocks, Prandtl-Meyer expansion)
 */

export interface OpenChannelFlowInput {
  flowRate: number;          // Flow rate in m³/s
  channelWidth: number;      // Channel width in m
  channelSlope: number;      // Channel slope (dimensionless, S₀)
  manningSCoeff: number;     // Manning's roughness coefficient
  channelShape?: string;     // 'rectangular', 'trapezoidal', 'circular'
  sideSlope?: number;        // Side slope for trapezoidal (m:1)
}

export interface OpenChannelFlowResult {
  normalDepth: number;       // Normal depth in m
  criticalDepth: number;     // Critical depth in m
  velocity: number;          // Average velocity in m/s
  froudeNumber: number;      // Froude number
  flowRegime: string;        // 'subcritical', 'critical', 'supercritical'
  hydraulicRadius: number;   // Hydraulic radius in m
  wettedPerimeter: number;   // Wetted perimeter in m
  topWidth: number;          // Top width in m
}

export interface CompressibleFlowInput {
  machNumber?: number;       // Mach number (if known)
  velocity?: number;         // Velocity in m/s (if Mach unknown)
  temperature: number;       // Temperature in K
  pressure: number;          // Pressure in Pa
  gasProperties: {
    gamma: number;           // Specific heat ratio
    gasConstant: number;     // Specific gas constant in J/kg·K
    molecularWeight: number; // Molecular weight in kg/kmol
  };
  flowType?: string;         // 'isentropic', 'fanno', 'rayleigh'
}

export interface CompressibleFlowResult {
  machNumber: number;        // Mach number
  velocity: number;          // Velocity in m/s
  speedOfSound: number;      // Speed of sound in m/s
  stagnationTemperature: number; // Stagnation temperature in K
  stagnationPressure: number;    // Stagnation pressure in Pa
  density: number;           // Density in kg/m³
  flowRegime: string;        // 'subsonic', 'sonic', 'supersonic'
  pressureRatio: number;     // p/p₀
  temperatureRatio: number;  // T/T₀
  densityRatio: number;      // ρ/ρ₀
}

export interface BoundaryLayerInput {
  velocity: number;          // Free stream velocity in m/s
  distance: number;          // Distance from leading edge in m
  fluidProperties: {
    density: number;         // Density in kg/m³
    viscosity: number;       // Dynamic viscosity in Pa·s
    kinematicViscosity: number; // Kinematic viscosity in m²/s
  };
  surfaceRoughness?: number; // Surface roughness in m
  plateLength?: number;      // Total plate length in m
}

export interface BoundaryLayerResult {
  reynoldsNumber: number;    // Reynolds number based on distance
  boundaryLayerThickness: number; // Boundary layer thickness in m
  displacementThickness: number;  // Displacement thickness in m
  momentumThickness: number;      // Momentum thickness in m
  skinFrictionCoefficient: number; // Local skin friction coefficient
  wallShearStress: number;        // Wall shear stress in Pa
  flowRegime: string;            // 'laminar', 'transitional', 'turbulent'
}

export interface ExternalFlowInput {
  velocity: number;          // Free stream velocity in m/s
  characteristicLength: number; // Characteristic length in m
  fluidProperties: {
    density: number;         // Density in kg/m³
    viscosity: number;       // Dynamic viscosity in Pa·s
  };
  geometry: string;          // 'sphere', 'cylinder', 'flat_plate', 'airfoil'
  angleOfAttack?: number;    // Angle of attack in degrees (for airfoil)
}

export interface ExternalFlowResult {
  reynoldsNumber: number;    // Reynolds number
  dragCoefficient: number;   // Drag coefficient
  liftCoefficient?: number;  // Lift coefficient (if applicable)
  dragForce: number;         // Drag force in N
  liftForce?: number;        // Lift force in N (if applicable)
  pressureCoefficient: number; // Pressure coefficient
}

/**
 * Calculate open channel flow using Manning's equation
 */
export function calculateOpenChannelFlow(input: OpenChannelFlowInput): OpenChannelFlowResult {
  const { flowRate, channelWidth, channelSlope, manningSCoeff, channelShape = 'rectangular', sideSlope = 0 } = input;
  
  // Calculate normal depth using Manning's equation iteratively
  const normalDepth = calculateNormalDepth(flowRate, channelWidth, channelSlope, manningSCoeff, channelShape, sideSlope);
  
  // Calculate critical depth
  const criticalDepth = calculateCriticalDepth(flowRate, channelWidth, channelShape, sideSlope);
  
  // Calculate hydraulic properties at normal depth
  const hydraulicProps = calculateHydraulicProperties(normalDepth, channelWidth, channelShape, sideSlope);
  
  // Calculate velocity
  const velocity = flowRate / hydraulicProps.area;
  
  // Calculate Froude number
  const froudeNumber = velocity / Math.sqrt(9.81 * hydraulicProps.hydraulicDepth);
  
  // Determine flow regime
  let flowRegime: string;
  if (froudeNumber < 1.0) {
    flowRegime = 'subcritical';
  } else if (Math.abs(froudeNumber - 1.0) < 0.05) {
    flowRegime = 'critical';
  } else {
    flowRegime = 'supercritical';
  }
  
  return {
    normalDepth,
    criticalDepth,
    velocity,
    froudeNumber,
    flowRegime,
    hydraulicRadius: hydraulicProps.hydraulicRadius,
    wettedPerimeter: hydraulicProps.wettedPerimeter,
    topWidth: hydraulicProps.topWidth
  };
}

/**
 * Calculate normal depth using Manning's equation (iterative solution)
 */
function calculateNormalDepth(Q: number, B: number, S: number, n: number, shape: string, m: number): number {
  let depth = 1.0; // Initial guess
  let iteration = 0;
  const maxIterations = 50;
  const tolerance = 1e-6;
  
  while (iteration < maxIterations) {
    const props = calculateHydraulicProperties(depth, B, shape, m);
    const calculatedQ = (1/n) * props.area * Math.pow(props.hydraulicRadius, 2/3) * Math.sqrt(S);
    
    const error = Math.abs(calculatedQ - Q) / Q;
    if (error < tolerance) {
      break;
    }
    
    // Newton-Raphson iteration
    const deltaDepth = 0.001;
    const propsPlus = calculateHydraulicProperties(depth + deltaDepth, B, shape, m);
    const qPlus = (1/n) * propsPlus.area * Math.pow(propsPlus.hydraulicRadius, 2/3) * Math.sqrt(S);
    
    const dQdY = (qPlus - calculatedQ) / deltaDepth;
    depth = depth + (Q - calculatedQ) / dQdY;
    
    iteration++;
  }
  
  return depth;
}

/**
 * Calculate critical depth for open channel flow
 */
function calculateCriticalDepth(Q: number, B: number, shape: string, m: number): number {
  if (shape === 'rectangular') {
    // For rectangular channel: yc = (Q²/(g·B²))^(1/3)
    return Math.pow((Q * Q) / (9.81 * B * B), 1/3);
  } else {
    // For other shapes, use iterative solution
    let depth = 0.5; // Initial guess
    let iteration = 0;
    const maxIterations = 50;
    const tolerance = 1e-6;
    
    while (iteration < maxIterations) {
      const props = calculateHydraulicProperties(depth, B, shape, m);
      const criticalQ = Math.sqrt(9.81 * Math.pow(props.area, 3) / props.topWidth);
      
      const error = Math.abs(criticalQ - Q) / Q;
      if (error < tolerance) {
        break;
      }
      
      // Simple iteration
      depth = depth * Math.pow(Q / criticalQ, 0.4);
      iteration++;
    }
    
    return depth;
  }
}

/**
 * Calculate hydraulic properties for different channel shapes
 */
function calculateHydraulicProperties(depth: number, width: number, shape: string, sideSlope: number = 0) {
  let area: number, wettedPerimeter: number, topWidth: number;
  
  switch (shape.toLowerCase()) {
    case 'rectangular':
      area = width * depth;
      wettedPerimeter = width + 2 * depth;
      topWidth = width;
      break;
      
    case 'trapezoidal':
      area = depth * (width + sideSlope * depth);
      wettedPerimeter = width + 2 * depth * Math.sqrt(1 + sideSlope * sideSlope);
      topWidth = width + 2 * sideSlope * depth;
      break;
      
    case 'circular':
      const radius = width / 2; // width is diameter
      const theta = 2 * Math.acos((radius - depth) / radius);
      area = (radius * radius / 2) * (theta - Math.sin(theta));
      wettedPerimeter = radius * theta;
      topWidth = 2 * radius * Math.sin(theta / 2);
      break;
      
    default: // Default to rectangular
      area = width * depth;
      wettedPerimeter = width + 2 * depth;
      topWidth = width;
  }
  
  const hydraulicRadius = area / wettedPerimeter;
  const hydraulicDepth = area / topWidth;
  
  return {
    area,
    wettedPerimeter,
    topWidth,
    hydraulicRadius,
    hydraulicDepth
  };
}

/**
 * Calculate compressible flow properties
 */
export function calculateCompressibleFlow(input: CompressibleFlowInput): CompressibleFlowResult {
  const { temperature, pressure, gasProperties } = input;
  const { gamma, gasConstant } = gasProperties;
  
  // Calculate speed of sound
  const speedOfSound = Math.sqrt(gamma * gasConstant * temperature);
  
  // Determine Mach number
  let machNumber: number;
  if (input.machNumber !== undefined) {
    machNumber = input.machNumber;
  } else if (input.velocity !== undefined) {
    machNumber = input.velocity / speedOfSound;
  } else {
    throw new Error('Either machNumber or velocity must be provided');
  }
  
  const velocity = machNumber * speedOfSound;
  
  // Calculate isentropic relations
  const temperatureFactor = 1 + ((gamma - 1) / 2) * machNumber * machNumber;
  const pressureFactor = Math.pow(temperatureFactor, gamma / (gamma - 1));
  
  // Stagnation properties
  const stagnationTemperature = temperature * temperatureFactor;
  const stagnationPressure = pressure * pressureFactor;
  
  // Calculate density
  const density = pressure / (gasConstant * temperature);
  
  // Determine flow regime
  let flowRegime: string;
  if (machNumber < 0.3) {
    flowRegime = 'incompressible';
  } else if (machNumber < 1.0) {
    flowRegime = 'subsonic';
  } else if (Math.abs(machNumber - 1.0) < 0.05) {
    flowRegime = 'sonic';
  } else {
    flowRegime = 'supersonic';
  }
  
  return {
    machNumber,
    velocity,
    speedOfSound,
    stagnationTemperature,
    stagnationPressure,
    density,
    flowRegime,
    pressureRatio: pressure / stagnationPressure,
    temperatureRatio: temperature / stagnationTemperature,
    densityRatio: density / (stagnationPressure / (gasConstant * stagnationTemperature))
  };
}

/**
 * Calculate boundary layer properties
 */
export function calculateBoundaryLayer(input: BoundaryLayerInput): BoundaryLayerResult {
  const { velocity, distance, fluidProperties } = input;
  const { density, kinematicViscosity } = fluidProperties;
  
  // Calculate Reynolds number
  const reynoldsNumber = (velocity * distance) / kinematicViscosity;
  
  // Determine flow regime
  let flowRegime: string;
  const reCritical = 5e5; // Critical Reynolds number for flat plate
  
  if (reynoldsNumber < reCritical) {
    flowRegime = 'laminar';
  } else if (reynoldsNumber < 1e6) {
    flowRegime = 'transitional';
  } else {
    flowRegime = 'turbulent';
  }
  
  // Calculate boundary layer thickness
  let boundaryLayerThickness: number;
  let displacementThickness: number;
  let momentumThickness: number;
  let skinFrictionCoefficient: number;
  
  if (flowRegime === 'laminar') {
    // Laminar boundary layer (Blasius solution)
    boundaryLayerThickness = 5.0 * distance / Math.sqrt(reynoldsNumber);
    displacementThickness = 1.721 * distance / Math.sqrt(reynoldsNumber);
    momentumThickness = 0.664 * distance / Math.sqrt(reynoldsNumber);
    skinFrictionCoefficient = 0.664 / Math.sqrt(reynoldsNumber);
  } else {
    // Turbulent boundary layer
    boundaryLayerThickness = 0.37 * distance / Math.pow(reynoldsNumber, 0.2);
    displacementThickness = 0.046 * distance / Math.pow(reynoldsNumber, 0.2);
    momentumThickness = 0.036 * distance / Math.pow(reynoldsNumber, 0.2);
    skinFrictionCoefficient = 0.058 / Math.pow(reynoldsNumber, 0.2);
  }
  
  // Calculate wall shear stress
  const wallShearStress = 0.5 * density * velocity * velocity * skinFrictionCoefficient;
  
  return {
    reynoldsNumber,
    boundaryLayerThickness,
    displacementThickness,
    momentumThickness,
    skinFrictionCoefficient,
    wallShearStress,
    flowRegime
  };
}

/**
 * Calculate external flow over objects
 */
export function calculateExternalFlow(input: ExternalFlowInput): ExternalFlowResult {
  const { velocity, characteristicLength, fluidProperties, geometry, angleOfAttack = 0 } = input;
  const { density, viscosity } = fluidProperties;
  
  // Calculate Reynolds number
  const reynoldsNumber = (density * velocity * characteristicLength) / viscosity;
  
  let dragCoefficient: number;
  let liftCoefficient: number | undefined;
  let pressureCoefficient: number;
  
  switch (geometry.toLowerCase()) {
    case 'sphere':
      // Drag coefficient for sphere
      if (reynoldsNumber < 1) {
        dragCoefficient = 24 / reynoldsNumber; // Stokes flow
      } else if (reynoldsNumber < 1000) {
        dragCoefficient = 24 / reynoldsNumber * (1 + 0.15 * Math.pow(reynoldsNumber, 0.687));
      } else if (reynoldsNumber < 200000) {
        dragCoefficient = 0.44; // Newton's law region
      } else {
        dragCoefficient = 0.1; // Post-critical region
      }
      pressureCoefficient = 1 - dragCoefficient;
      break;
      
    case 'cylinder':
      // Drag coefficient for cylinder in crossflow
      if (reynoldsNumber < 1) {
        dragCoefficient = 8 * Math.PI / reynoldsNumber;
      } else if (reynoldsNumber < 40) {
        dragCoefficient = 5.8 / Math.sqrt(reynoldsNumber);
      } else if (reynoldsNumber < 1000) {
        dragCoefficient = 1.2;
      } else if (reynoldsNumber < 200000) {
        dragCoefficient = 0.3;
      } else {
        dragCoefficient = 0.7; // Post-critical
      }
      pressureCoefficient = 1.0;
      break;
      
    case 'flat_plate':
      // Drag coefficient for flat plate parallel to flow
      if (reynoldsNumber < 5e5) {
        dragCoefficient = 1.328 / Math.sqrt(reynoldsNumber); // Laminar
      } else {
        dragCoefficient = 0.074 / Math.pow(reynoldsNumber, 0.2); // Turbulent
      }
      pressureCoefficient = 0;
      break;
      
    case 'airfoil':
      // Simplified airfoil coefficients (NACA 0012 approximation)
      const alphaRad = (angleOfAttack * Math.PI) / 180;
      liftCoefficient = 2 * Math.PI * alphaRad; // Thin airfoil theory
      
      if (reynoldsNumber > 1e6) {
        dragCoefficient = 0.006 + 0.01 * alphaRad * alphaRad; // Simplified
      } else {
        dragCoefficient = 0.02 + 0.01 * alphaRad * alphaRad;
      }
      pressureCoefficient = 1 - 4 * alphaRad * alphaRad;
      break;
      
    default:
      // Default to sphere
      dragCoefficient = 0.44;
      pressureCoefficient = 0.5;
  }
  
  // Calculate forces
  const frontalArea = Math.PI * Math.pow(characteristicLength / 2, 2); // Assuming circular cross-section
  const dynamicPressure = 0.5 * density * velocity * velocity;
  
  const dragForce = dragCoefficient * dynamicPressure * frontalArea;
  const liftForce = liftCoefficient ? liftCoefficient * dynamicPressure * frontalArea : undefined;
  
  const result: ExternalFlowResult = {
    reynoldsNumber,
    dragCoefficient,
    dragForce,
    pressureCoefficient
  };
  
  if (liftCoefficient !== undefined) {
    result.liftCoefficient = liftCoefficient;
  }
  
  if (liftForce !== undefined) {
    result.liftForce = liftForce;
  }
  
  return result;
}

/**
 * Calculate normal shock wave properties
 */
export function calculateNormalShock(
  machNumber1: number,
  gamma: number = 1.4
): {
  machNumber2: number;
  pressureRatio: number;
  densityRatio: number;
  temperatureRatio: number;
  stagnationPressureRatio: number;
} {
  if (machNumber1 <= 1.0) {
    throw new Error('Normal shock requires supersonic upstream flow (M₁ > 1)');
  }
  
  const M1 = machNumber1;
  const g = gamma;
  
  // Normal shock relations
  const machNumber2Squared = (M1*M1 + 2/(g-1)) / (2*g*M1*M1/(g-1) - 1);
  const machNumber2 = Math.sqrt(machNumber2Squared);
  
  const pressureRatio = (2*g*M1*M1 - (g-1)) / (g+1);
  const densityRatio = ((g+1)*M1*M1) / ((g-1)*M1*M1 + 2);
  const temperatureRatio = pressureRatio / densityRatio;
  
  // Stagnation pressure ratio (entropy increase)
  const factor1 = Math.pow(((g+1)*M1*M1) / ((g-1)*M1*M1 + 2), g/(g-1));
  const factor2 = Math.pow((g+1) / (2*g*M1*M1 - (g-1)), 1/(g-1));
  const stagnationPressureRatio = factor1 * factor2;
  
  return {
    machNumber2,
    pressureRatio,
    densityRatio,
    temperatureRatio,
    stagnationPressureRatio
  };
}

/**
 * Calculate critical flow properties (choked flow)
 */
export function calculateChokedFlow(
  stagnationTemperature: number,
  stagnationPressure: number,
  gamma: number = 1.4,
  gasConstant: number = 287
): {
  criticalTemperature: number;
  criticalPressure: number;
  criticalDensity: number;
  criticalVelocity: number;
  massFlowRate: number; // per unit area
} {
  // Critical conditions (M = 1)
  const criticalTemperature = stagnationTemperature * 2 / (gamma + 1);
  const criticalPressure = stagnationPressure * Math.pow(2 / (gamma + 1), gamma / (gamma - 1));
  const criticalDensity = criticalPressure / (gasConstant * criticalTemperature);
  const criticalVelocity = Math.sqrt(gamma * gasConstant * criticalTemperature);
  
  // Mass flow rate per unit area
  const massFlowRate = criticalDensity * criticalVelocity;
  
  return {
    criticalTemperature,
    criticalPressure,
    criticalDensity,
    criticalVelocity,
    massFlowRate
  };
}
