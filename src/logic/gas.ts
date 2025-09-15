import { Quantity } from '@/schemas/common';
import { convert } from '@/utils/units';
import { Warning } from '@/utils/guardrails';
import { reynolds, churchillF } from './friction';

export interface GasProperties {
  density: Quantity; // kg/m³ (at inlet conditions)
  viscosity: Quantity; // Pa·s
  molecularWeight: Quantity; // kg/kmol
  specificHeatRatio?: number; // γ (gamma) - required for adiabatic calculations
  compressibilityFactor?: number; // Z - compressibility factor
}

export interface PipeGeometry {
  diameter: Quantity; // m
  length: Quantity; // m
  roughness: Quantity; // m
}

export interface GasFlowInput {
  gas: GasProperties;
  pipe: PipeGeometry;
  inletPressure: Quantity; // Pa
  outletPressure?: Quantity; // Pa (optional, will be calculated if not provided)
  massFlowRate: Quantity; // kg/s
  temperature: Quantity; // K
  model: 'isothermal' | 'adiabatic';
}

export interface GasFlowResult {
  inletPressure: Quantity; // Pa
  outletPressure: Quantity; // Pa
  pressureDrop: Quantity; // Pa
  pressureDropPercent: number; // %
  velocity: Quantity; // m/s
  machNumber: number;
  isChoked: boolean;
  frictionFactor: number;
  reynoldsNumber: number;
  warnings: (string | Warning)[];
  metadata: {
    input: GasFlowInput;
    calculations: {
      model: 'isothermal' | 'adiabatic';
      compressibilityFactor: number;
      specificHeatRatio?: number;
      sonicVelocity: number;
      relativeRoughness: number;
    };
  };
}

// Universal gas constant
const R = 8314.46; // J/(kmol·K)

// Specific heat ratio for common gases (if not provided)
const SPECIFIC_HEAT_RATIOS = {
  air: 1.4,
  nitrogen: 1.4,
  oxygen: 1.4,
  hydrogen: 1.4,
  methane: 1.32,
  ethane: 1.18,
  propane: 1.13,
  carbon_dioxide: 1.29,
  helium: 1.67,
  argon: 1.67,
} as const;

/**
 * Calculate Mach number
 * M = V / a
 * @param velocity - Flow velocity (m/s)
 * @param sonicVelocity - Sonic velocity (m/s)
 * @returns Mach number
 */
export function machNumber(velocity: number, sonicVelocity: number): number {
  if (sonicVelocity <= 0) {
    throw new Error('Sonic velocity must be positive');
  }
  return velocity / sonicVelocity;
}

/**
 * Calculate sonic velocity for isothermal flow
 * a = sqrt(Z * R * T / M)
 * @param compressibilityFactor - Z factor
 * @param temperature - Temperature (K)
 * @param molecularWeight - Molecular weight (kg/kmol)
 * @returns Sonic velocity (m/s)
 */
export function isothermalSonicVelocity(
  compressibilityFactor: number,
  temperature: number,
  molecularWeight: number
): number {
  if (compressibilityFactor <= 0 || temperature <= 0 || molecularWeight <= 0) {
    throw new Error('All parameters must be positive');
  }
  return Math.sqrt((compressibilityFactor * R * temperature) / molecularWeight);
}

/**
 * Calculate sonic velocity for adiabatic flow
 * a = sqrt(γ * Z * R * T / M)
 * @param specificHeatRatio - γ (gamma)
 * @param compressibilityFactor - Z factor
 * @param temperature - Temperature (K)
 * @param molecularWeight - Molecular weight (kg/kmol)
 * @returns Sonic velocity (m/s)
 */
export function adiabaticSonicVelocity(
  specificHeatRatio: number,
  compressibilityFactor: number,
  temperature: number,
  molecularWeight: number
): number {
  if (
    specificHeatRatio <= 1 ||
    compressibilityFactor <= 0 ||
    temperature <= 0 ||
    molecularWeight <= 0
  ) {
    throw new Error('All parameters must be positive and γ > 1');
  }
  return Math.sqrt(
    (specificHeatRatio * compressibilityFactor * R * temperature) /
      molecularWeight
  );
}

/**
 * Calculate isothermal pressure drop using Weymouth equation
 * P₂² = P₁² - (f * L * ṁ² * Z * R * T) / (π² * D⁵ * M)
 * @param inletPressure - Inlet pressure (Pa)
 * @param massFlowRate - Mass flow rate (kg/s)
 * @param pipeLength - Pipe length (m)
 * @param pipeDiameter - Pipe diameter (m)
 * @param frictionFactor - Darcy friction factor
 * @param compressibilityFactor - Z factor
 * @param temperature - Temperature (K)
 * @param molecularWeight - Molecular weight (kg/kmol)
 * @returns Outlet pressure (Pa)
 */
export function isothermalPressureDrop(
  inletPressure: number,
  massFlowRate: number,
  pipeLength: number,
  pipeDiameter: number,
  frictionFactor: number,
  compressibilityFactor: number,
  temperature: number,
  molecularWeight: number
): { outletPressure: number; pressureDrop: number } {
  if (
    inletPressure <= 0 ||
    massFlowRate <= 0 ||
    pipeLength <= 0 ||
    pipeDiameter <= 0
  ) {
    throw new Error('All input parameters must be positive');
  }

  if (
    frictionFactor <= 0 ||
    compressibilityFactor <= 0 ||
    temperature <= 0 ||
    molecularWeight <= 0
  ) {
    throw new Error('All physical parameters must be positive');
  }

  // Weymouth equation for isothermal flow
  const term =
    (frictionFactor *
      pipeLength *
      Math.pow(massFlowRate, 2) *
      compressibilityFactor *
      R *
      temperature) /
    (Math.pow(Math.PI, 2) * Math.pow(pipeDiameter, 5) * molecularWeight);

  const outletPressureSquared = Math.pow(inletPressure, 2) - term;

  if (outletPressureSquared <= 0) {
    // Flow is choked
    return { outletPressure: 0, pressureDrop: inletPressure };
  }

  const outletPressure = Math.sqrt(outletPressureSquared);
  const pressureDrop = inletPressure - outletPressure;

  return { outletPressure, pressureDrop };
}

/**
 * Calculate adiabatic pressure drop using modified Weymouth equation
 * @param inletPressure - Inlet pressure (Pa)
 * @param massFlowRate - Mass flow rate (kg/s)
 * @param pipeLength - Pipe length (m)
 * @param pipeDiameter - Pipe diameter (m)
 * @param frictionFactor - Darcy friction factor
 * @param specificHeatRatio - γ (gamma)
 * @param compressibilityFactor - Z factor
 * @param temperature - Temperature (K)
 * @param molecularWeight - Molecular weight (kg/kmol)
 * @returns Outlet pressure (Pa)
 */
export function adiabaticPressureDrop(
  inletPressure: number,
  massFlowRate: number,
  pipeLength: number,
  pipeDiameter: number,
  frictionFactor: number,
  specificHeatRatio: number,
  compressibilityFactor: number,
  temperature: number,
  molecularWeight: number
): { outletPressure: number; pressureDrop: number } {
  if (
    inletPressure <= 0 ||
    massFlowRate <= 0 ||
    pipeLength <= 0 ||
    pipeDiameter <= 0
  ) {
    throw new Error('All input parameters must be positive');
  }

  if (
    frictionFactor <= 0 ||
    specificHeatRatio <= 1 ||
    compressibilityFactor <= 0 ||
    temperature <= 0 ||
    molecularWeight <= 0
  ) {
    throw new Error('All physical parameters must be positive and γ > 1');
  }

  // Adiabatic flow equation (simplified)
  // For adiabatic flow, we use a modified form that accounts for temperature changes
  const gamma = specificHeatRatio;
  const term =
    (frictionFactor *
      pipeLength *
      Math.pow(massFlowRate, 2) *
      compressibilityFactor *
      R *
      temperature) /
    (Math.pow(Math.PI, 2) * Math.pow(pipeDiameter, 5) * molecularWeight);

  // Adiabatic correction factor
  const adiabaticCorrection = (2 * gamma) / (gamma + 1);

  const outletPressureSquared =
    Math.pow(inletPressure, 2) - term * adiabaticCorrection;

  if (outletPressureSquared <= 0) {
    // Flow is choked
    return { outletPressure: 0, pressureDrop: inletPressure };
  }

  const outletPressure = Math.sqrt(outletPressureSquared);
  const pressureDrop = inletPressure - outletPressure;

  return { outletPressure, pressureDrop };
}

/**
 * Calculate gas flow with pressure drop
 * @param input - Gas flow input parameters
 * @returns Gas flow result
 */
export function calculateGasFlow(input: GasFlowInput): GasFlowResult {
  const warnings: (string | Warning)[] = [];

  // Convert input parameters to SI units
  const gasDensity = convert(input.gas.density, 'kg/m³').value;
  const gasViscosity = convert(input.gas.viscosity, 'Pa·s').value;
  const molecularWeight = convert(input.gas.molecularWeight, 'kg/kmol').value;
  const pipeDiameter = convert(input.pipe.diameter, 'm').value;
  const pipeLength = convert(input.pipe.length, 'm').value;
  const pipeRoughness = convert(input.pipe.roughness, 'm').value;
  const inletPressure = convert(input.inletPressure, 'Pa').value;
  const massFlowRate = convert(input.massFlowRate, 'kg/s').value;
  const temperature = convert(input.temperature, 'K').value;

  // Validate inputs
  if (gasDensity <= 0 || gasViscosity <= 0 || molecularWeight <= 0) {
    throw new Error('Gas properties must be positive');
  }

  if (pipeDiameter <= 0 || pipeLength <= 0 || pipeRoughness < 0) {
    throw new Error('Pipe geometry must be positive');
  }

  if (inletPressure <= 0 || massFlowRate <= 0 || temperature <= 0) {
    throw new Error('Flow conditions must be positive');
  }

  // Get compressibility factor (default to 1.0 if not provided)
  const compressibilityFactor = input.gas.compressibilityFactor ?? 1.0;

  if (compressibilityFactor <= 0) {
    throw new Error('Compressibility factor must be positive');
  }

  // Calculate pipe area and velocity
  const pipeArea = (Math.PI * Math.pow(pipeDiameter, 2)) / 4;
  const velocity = massFlowRate / (gasDensity * pipeArea);

  // Calculate Reynolds number and friction factor
  const reynoldsNumber = reynolds(
    gasDensity,
    velocity,
    pipeDiameter,
    gasViscosity
  );
  const relativeRoughness = pipeRoughness / pipeDiameter;
  const frictionFactor = churchillF(reynoldsNumber, relativeRoughness);

  // Calculate sonic velocity based on model
  let sonicVelocity: number;
  let specificHeatRatio: number | undefined;

  if (input.model === 'isothermal') {
    sonicVelocity = isothermalSonicVelocity(
      compressibilityFactor,
      temperature,
      molecularWeight
    );
  } else {
    // Adiabatic model
    specificHeatRatio = input.gas.specificHeatRatio;

    if (!specificHeatRatio) {
      // Try to estimate from molecular weight (rough approximation)
      if (molecularWeight < 5) {
        specificHeatRatio = 1.67; // Helium-like
      } else if (molecularWeight < 20) {
        specificHeatRatio = 1.4; // Air-like
      } else if (molecularWeight < 50) {
        specificHeatRatio = 1.3; // Methane-like
      } else {
        specificHeatRatio = 1.1; // Heavy hydrocarbons
      }

      warnings.push({
        type: 'general',
        message: `Specific heat ratio not provided, estimated as ${specificHeatRatio} based on molecular weight`,
        severity: 'medium',
      });
    }

    if (specificHeatRatio <= 1) {
      throw new Error(
        'Specific heat ratio must be greater than 1 for adiabatic flow'
      );
    }

    sonicVelocity = adiabaticSonicVelocity(
      specificHeatRatio,
      compressibilityFactor,
      temperature,
      molecularWeight
    );
  }

  // Calculate Mach number
  const machNumberValue = machNumber(velocity, sonicVelocity);

  // Calculate pressure drop based on model
  let outletPressure: number;
  let pressureDrop: number;

  if (input.model === 'isothermal') {
    const result = isothermalPressureDrop(
      inletPressure,
      massFlowRate,
      pipeLength,
      pipeDiameter,
      frictionFactor,
      compressibilityFactor,
      temperature,
      molecularWeight
    );
    outletPressure = result.outletPressure;
    pressureDrop = result.pressureDrop;
  } else {
    const result = adiabaticPressureDrop(
      inletPressure,
      massFlowRate,
      pipeLength,
      pipeDiameter,
      frictionFactor,
      specificHeatRatio!,
      compressibilityFactor,
      temperature,
      molecularWeight
    );
    outletPressure = result.outletPressure;
    pressureDrop = result.pressureDrop;
  }

  // Check for choked flow
  const isChoked = outletPressure === 0;

  // Calculate pressure drop percentage
  const pressureDropPercent = (pressureDrop / inletPressure) * 100;

  // Add warnings
  if (machNumberValue > 0.3) {
    warnings.push({
      type: 'general',
      message: `High Mach number (${machNumberValue.toFixed(3)}): Compressible flow effects are significant`,
      severity: 'high',
    });
  }

  if (machNumberValue > 0.8) {
    warnings.push({
      type: 'general',
      message: `Very high Mach number (${machNumberValue.toFixed(3)}): Approaching sonic conditions`,
      severity: 'high',
    });
  }

  if (isChoked) {
    warnings.push({
      type: 'general',
      message: 'Flow is choked: Maximum mass flow rate reached',
      severity: 'high',
    });
  }

  if (pressureDropPercent > 20) {
    warnings.push({
      type: 'general',
      message: `Large pressure drop (${pressureDropPercent.toFixed(1)}%): Verify inlet conditions`,
      severity: 'medium',
    });
  }

  if (compressibilityFactor < 0.8 || compressibilityFactor > 1.2) {
    warnings.push({
      type: 'general',
      message: `Unusual compressibility factor (${compressibilityFactor.toFixed(3)}): Verify gas properties`,
      severity: 'medium',
    });
  }

  return {
    inletPressure: { value: inletPressure, unit: 'Pa' },
    outletPressure: { value: outletPressure, unit: 'Pa' },
    pressureDrop: { value: pressureDrop, unit: 'Pa' },
    pressureDropPercent,
    velocity: { value: velocity, unit: 'm/s' },
    machNumber: machNumberValue,
    isChoked,
    frictionFactor,
    reynoldsNumber,
    warnings,
    metadata: {
      input,
      calculations: {
        model: input.model,
        compressibilityFactor,
        specificHeatRatio,
        sonicVelocity,
        relativeRoughness,
      },
    },
  };
}

/**
 * Get default specific heat ratio for common gases
 * @param gasName - Name of the gas
 * @returns Specific heat ratio or undefined if not found
 */
export function getDefaultSpecificHeatRatio(
  gasName: string
): number | undefined {
  const normalizedName = gasName.toLowerCase().replace(/[^a-z]/g, '_');
  return SPECIFIC_HEAT_RATIOS[
    normalizedName as keyof typeof SPECIFIC_HEAT_RATIOS
  ];
}

/**
 * Estimate compressibility factor using simplified correlation
 * @param pressure - Pressure (Pa)
 * @param temperature - Temperature (K)
 * @param molecularWeight - Molecular weight (kg/kmol)
 * @returns Estimated compressibility factor
 */
export function estimateCompressibilityFactor(
  pressure: number,
  temperature: number,
  molecularWeight: number
): number {
  if (pressure <= 0 || temperature <= 0 || molecularWeight <= 0) {
    throw new Error('All parameters must be positive');
  }

  // Simplified correlation based on reduced pressure and temperature
  // This is a rough approximation - for accurate results, use proper Z-factor correlations

  const criticalPressure = 3.77e6; // Pa (typical for natural gas)
  const criticalTemperature = 190; // K (typical for natural gas)

  const reducedPressure = pressure / criticalPressure;
  const reducedTemperature = temperature / criticalTemperature;

  // Simple correlation (very approximate)
  if (reducedPressure < 0.1 && reducedTemperature > 1.5) {
    return 1.0; // Near ideal gas conditions
  } else if (reducedPressure < 0.5) {
    return 0.95 + 0.05 * Math.exp(-reducedPressure);
  } else {
    return 0.9 + 0.1 * Math.exp(-reducedPressure / 2);
  }
}

export interface GasState {
  pressure: number; // Pa
  temperature: number; // K
  density: number; // kg/m³
  velocity: number; // m/s
  machNumber: number;
  stagnationPressure: number; // Pa
  stagnationTemperature: number; // K
}

export interface FannoLineInput {
  state0: GasState;
  length: Quantity; // m
  diameter: Quantity; // m
  frictionFactor: number;
  specificHeatRatio: number;
  molecularWeight: Quantity; // kg/kmol
}

export interface RayleighLineInput {
  state0: GasState;
  heatTransferRate: Quantity; // W/m² (heat flux)
  diameter: Quantity; // m
  specificHeatRatio: number;
  molecularWeight: Quantity; // kg/kmol
}

export interface DuctFlowResult {
  states: GasState[];
  maxLength?: number; // m (for Fanno line - length to sonic condition)
  maxHeatTransfer?: number; // W/m² (for Rayleigh line - heat transfer to sonic condition)
  isChoked: boolean;
  warnings: (string | Warning)[];
  metadata: {
    input: FannoLineInput | RayleighLineInput;
    calculations: {
      type: 'fanno' | 'rayleigh';
      specificHeatRatio: number;
      molecularWeight: number;
      sonicConditions?: GasState;
    };
  };
}

/**
 * Calculate gas properties at a given Mach number using isentropic relations
 * @param machNumber - Mach number
 * @param specificHeatRatio - γ (gamma)
 * @param stagnationPressure - Stagnation pressure (Pa)
 * @param stagnationTemperature - Stagnation temperature (K)
 * @param molecularWeight - Molecular weight (kg/kmol)
 * @returns Gas state at the given Mach number
 */
export function gasStateAtMach(
  machNumber: number,
  specificHeatRatio: number,
  stagnationPressure: number,
  stagnationTemperature: number,
  molecularWeight: number
): GasState {
  if (
    machNumber < 0 ||
    specificHeatRatio <= 1 ||
    stagnationPressure <= 0 ||
    stagnationTemperature <= 0 ||
    molecularWeight <= 0
  ) {
    throw new Error('Invalid input parameters');
  }

  const gamma = specificHeatRatio;
  const M = machNumber;
  const M2 = M * M;

  // Isentropic relations
  const pressureRatio = Math.pow(
    1 + ((gamma - 1) * M2) / 2,
    -gamma / (gamma - 1)
  );
  const temperatureRatio = Math.pow(1 + ((gamma - 1) * M2) / 2, -1);

  const pressure = stagnationPressure * pressureRatio;
  const temperature = stagnationTemperature * temperatureRatio;
  const density = (pressure * molecularWeight) / (R * temperature);
  const velocity = M * Math.sqrt((gamma * R * temperature) / molecularWeight);

  return {
    pressure,
    temperature,
    density,
    velocity,
    machNumber: M,
    stagnationPressure,
    stagnationTemperature,
  };
}

/**
 * Calculate Fanno line - gas properties along a duct with friction
 * @param input - Fanno line input parameters
 * @returns Duct flow result with states along the line
 */
export function fannoLine(input: FannoLineInput): DuctFlowResult {
  const warnings: (string | Warning)[] = [];

  // Convert input parameters to SI units
  const length = convert(input.length, 'm').value;
  const diameter = convert(input.diameter, 'm').value;
  const molecularWeight = convert(input.molecularWeight, 'kg/kmol').value;

  // Validate inputs
  if (
    length <= 0 ||
    diameter <= 0 ||
    input.frictionFactor <= 0 ||
    input.specificHeatRatio <= 1 ||
    molecularWeight <= 0
  ) {
    throw new Error('All input parameters must be positive and γ > 1');
  }

  const { state0 } = input;
  const gamma = input.specificHeatRatio;
  const f = input.frictionFactor;
  const D = diameter;

  // Calculate initial Mach number if not provided
  let M0 = state0.machNumber;
  if (M0 <= 0) {
    // Calculate from velocity and temperature
    const sonicVelocity = Math.sqrt(
      (gamma * R * state0.temperature) / molecularWeight
    );
    M0 = state0.velocity / sonicVelocity;
  }

  if (M0 >= 1) {
    throw new Error(
      'Initial Mach number must be subsonic for Fanno line analysis'
    );
  }

  // Calculate maximum length to sonic condition (L*)
  const maxLength =
    (D / (4 * f)) *
    ((1 - M0 * M0) / (gamma * M0 * M0) +
      ((gamma + 1) / (2 * gamma)) *
        Math.log(((gamma + 1) * M0 * M0) / (2 + (gamma - 1) * M0 * M0)));

  // Generate states along the Fanno line
  const states: GasState[] = [];
  const numPoints = 50;

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    // Calculate Mach number at current length using Fanno relations
    // Use the Fanno line equation: fL*/D = (1-M²)/(γM²) + (γ+1)/(2γ) * ln((γ+1)M²/(2+(γ-1)M²))
    // For simplicity, use a linear interpolation of Mach number
    // In a real implementation, this would require solving the Fanno equation iteratively
    const M = M0 + fraction * (0.99 - M0); // Linear interpolation to near-sonic

    // Calculate gas state at this Mach number
    const state = gasStateAtMach(
      M,
      gamma,
      state0.stagnationPressure,
      state0.stagnationTemperature,
      molecularWeight
    );

    states.push(state);
  }

  // Check if flow becomes choked (use a more conservative threshold)
  const isChoked = length >= maxLength * 0.95; // Allow some tolerance

  if (isChoked) {
    warnings.push({
      type: 'general',
      message: 'Flow becomes choked before reaching the specified length',
      severity: 'high',
    });
  }

  // Add warnings for property trends
  if (states.length > 1) {
    const pressures = states.map(s => s.pressure);
    const temperatures = states.map(s => s.temperature);
    const velocities = states.map(s => s.velocity);
    const machNumbers = states.map(s => s.machNumber);

    // Check monotonic trends
    const pressureDecreasing = pressures.every(
      (p, i) => i === 0 || p <= pressures[i - 1]
    );
    const temperatureDecreasing = temperatures.every(
      (t, i) => i === 0 || t <= temperatures[i - 1]
    );
    const velocityIncreasing = velocities.every(
      (v, i) => i === 0 || v >= velocities[i - 1]
    );
    const machIncreasing = machNumbers.every(
      (m, i) => i === 0 || m >= machNumbers[i - 1]
    );

    if (!pressureDecreasing) {
      warnings.push({
        type: 'general',
        message: 'Pressure should decrease along Fanno line',
        severity: 'medium',
      });
    }

    if (!temperatureDecreasing) {
      warnings.push({
        type: 'general',
        message: 'Temperature should decrease along Fanno line',
        severity: 'medium',
      });
    }

    if (!velocityIncreasing) {
      warnings.push({
        type: 'general',
        message: 'Velocity should increase along Fanno line',
        severity: 'medium',
      });
    }

    if (!machIncreasing) {
      warnings.push({
        type: 'general',
        message: 'Mach number should increase along Fanno line',
        severity: 'medium',
      });
    }
  }

  return {
    states,
    maxLength,
    isChoked,
    warnings,
    metadata: {
      input,
      calculations: {
        type: 'fanno',
        specificHeatRatio: gamma,
        molecularWeight,
        sonicConditions: isChoked ? states[states.length - 1] : undefined,
      },
    },
  };
}

/**
 * Calculate Rayleigh line - gas properties along a duct with heat transfer
 * @param input - Rayleigh line input parameters
 * @returns Duct flow result with states along the line
 */
export function rayleighLine(input: RayleighLineInput): DuctFlowResult {
  const warnings: (string | Warning)[] = [];

  // Convert input parameters to SI units
  const heatTransferRate = convert(input.heatTransferRate, 'W/m²').value;
  const diameter = convert(input.diameter, 'm').value;
  const molecularWeight = convert(input.molecularWeight, 'kg/kmol').value;

  // Validate inputs
  if (diameter <= 0 || input.specificHeatRatio <= 1 || molecularWeight <= 0) {
    throw new Error('All input parameters must be positive and γ > 1');
  }

  const { state0 } = input;
  const gamma = input.specificHeatRatio;
  const q = heatTransferRate;

  // Calculate initial Mach number if not provided
  let M0 = state0.machNumber;
  if (M0 <= 0) {
    // Calculate from velocity and temperature
    const sonicVelocity = Math.sqrt(
      (gamma * R * state0.temperature) / molecularWeight
    );
    M0 = state0.velocity / sonicVelocity;
  }

  // Calculate maximum heat transfer to sonic condition (q*)
  const cp = (gamma * R) / ((gamma - 1) * molecularWeight);
  const maxHeatTransfer =
    (cp * state0.temperature * (1 - M0 * M0)) / (2 * M0 * M0);

  // Generate states along the Rayleigh line
  const states: GasState[] = [];
  const numPoints = 50;

  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;

    // Calculate Mach number at current heat transfer using Rayleigh relations
    // For simplicity, use a linear interpolation based on heat transfer direction
    let M: number;
    if (q > 0) {
      // Heat addition - Mach number decreases for subsonic flow
      M = M0 * (1 - fraction * 0.3); // Decrease Mach number
    } else {
      // Heat removal - Mach number increases for subsonic flow
      M = M0 * (1 + fraction * 0.3); // Increase Mach number
    }

    // Ensure Mach number stays within reasonable bounds
    M = Math.max(0.1, Math.min(M, 5.0));

    // Calculate gas state at this Mach number
    const state = gasStateAtMach(
      M,
      gamma,
      state0.stagnationPressure,
      state0.stagnationTemperature,
      molecularWeight
    );

    states.push(state);
  }

  // Check if flow becomes choked
  const isChoked = Math.abs(q) >= Math.abs(maxHeatTransfer);

  if (isChoked) {
    warnings.push({
      type: 'general',
      message: 'Flow becomes choked due to heat transfer',
      severity: 'high',
    });
  }

  // Add warnings for property trends
  if (states.length > 1) {
    const pressures = states.map(s => s.pressure);
    const temperatures = states.map(s => s.temperature);

    // Check monotonic trends based on heat transfer direction
    if (q > 0) {
      // Heat addition
      const pressureDecreasing = pressures.every(
        (p, i) => i === 0 || p <= pressures[i - 1]
      );
      const temperatureIncreasing = temperatures.every(
        (t, i) => i === 0 || t >= temperatures[i - 1]
      );

      if (!pressureDecreasing) {
        warnings.push({
          type: 'general',
          message:
            'Pressure should decrease with heat addition in Rayleigh flow',
          severity: 'medium',
        });
      }

      if (!temperatureIncreasing) {
        warnings.push({
          type: 'general',
          message:
            'Temperature should increase with heat addition in Rayleigh flow',
          severity: 'medium',
        });
      }
    } else {
      // Heat removal
      const pressureIncreasing = pressures.every(
        (p, i) => i === 0 || p >= pressures[i - 1]
      );
      const temperatureDecreasing = temperatures.every(
        (t, i) => i === 0 || t <= temperatures[i - 1]
      );

      if (!pressureIncreasing) {
        warnings.push({
          type: 'general',
          message:
            'Pressure should increase with heat removal in Rayleigh flow',
          severity: 'medium',
        });
      }

      if (!temperatureDecreasing) {
        warnings.push({
          type: 'general',
          message:
            'Temperature should decrease with heat removal in Rayleigh flow',
          severity: 'medium',
        });
      }
    }
  }

  return {
    states,
    maxHeatTransfer,
    isChoked,
    warnings,
    metadata: {
      input,
      calculations: {
        type: 'rayleigh',
        specificHeatRatio: gamma,
        molecularWeight,
        sonicConditions: isChoked ? states[states.length - 1] : undefined,
      },
    },
  };
}
