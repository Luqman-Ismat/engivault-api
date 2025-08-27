import { Quantity } from '@/schemas/common';
import { convert } from '@/utils/units';
import { Warning } from '@/utils/guardrails';
import { reynolds, churchillF } from './friction';

export interface FluidProperties {
  density: Quantity; // kg/m³
  viscosity: Quantity; // Pa·s (at reference temperature)
  referenceTemperature: Quantity; // K
  viscosityTemperatureCoefficient?: number; // 1/K (for temperature-dependent viscosity)
}

export interface ViscosityAdjustedDropInput {
  flowRate: Quantity; // m³/s
  length: Quantity; // m
  diameter: Quantity; // m
  roughness: Quantity; // m
  fluid: FluidProperties;
  inletTemperature: Quantity; // K
  outletTemperature?: Quantity; // K (optional, will be estimated if not provided)
  maxIterations?: number; // Maximum iterations for convergence
  convergenceTolerance?: number; // Convergence tolerance for pressure drop
}

export interface ViscosityAdjustedDropResult {
  inletTemperature: Quantity; // K
  outletTemperature: Quantity; // K
  averageTemperature: Quantity; // K
  pressureDrop: Quantity; // Pa
  pressureDropPercent: number; // %
  inletViscosity: Quantity; // Pa·s
  outletViscosity: Quantity; // Pa·s
  averageViscosity: Quantity; // Pa·s
  reynoldsNumber: number;
  frictionFactor: number;
  velocity: Quantity; // m/s
  iterations: number;
  converged: boolean;
  warnings: (string | Warning)[];
  metadata: {
    input: ViscosityAdjustedDropInput;
    calculations: {
      convergenceHistory: Array<{
        iteration: number;
        pressureDrop: number;
        averageTemperature: number;
        averageViscosity: number;
        reynoldsNumber: number;
        frictionFactor: number;
      }>;
      finalTolerance: number;
    };
  };
}

// Water properties at different temperatures (simplified)
const WATER_PROPERTIES = {
  // Temperature (K) -> { density (kg/m³), viscosity (Pa·s) }
  273.15: { density: 999.8, viscosity: 1.792e-3 }, // 0°C
  283.15: { density: 999.7, viscosity: 1.307e-3 }, // 10°C
  293.15: { density: 998.2, viscosity: 1.002e-3 }, // 20°C
  303.15: { density: 995.7, viscosity: 0.798e-3 }, // 30°C
  313.15: { density: 992.2, viscosity: 0.653e-3 }, // 40°C
  323.15: { density: 988.1, viscosity: 0.547e-3 }, // 50°C
  333.15: { density: 983.2, viscosity: 0.467e-3 }, // 60°C
  343.15: { density: 977.8, viscosity: 0.404e-3 }, // 70°C
  353.15: { density: 971.8, viscosity: 0.355e-3 }, // 80°C
  363.15: { density: 965.3, viscosity: 0.315e-3 }, // 90°C
  373.15: { density: 958.4, viscosity: 0.282e-3 }, // 100°C
} as const;

/**
 * Get water properties at a given temperature
 * @param temperature - Temperature (K)
 * @returns Water properties { density, viscosity }
 */
export function waterProps(temperature: number): {
  density: number;
  viscosity: number;
} {
  if (temperature < 273.15 || temperature > 373.15) {
    throw new Error(
      'Temperature must be between 273.15K (0°C) and 373.15K (100°C) for water properties'
    );
  }

  // Find the closest temperature in our lookup table
  const temperatures = Object.keys(WATER_PROPERTIES)
    .map(Number)
    .sort((a, b) => a - b);
  let closestTemp = temperatures[0];
  let minDiff = Math.abs(temperature - closestTemp);

  for (const temp of temperatures) {
    const diff = Math.abs(temperature - temp);
    if (diff < minDiff) {
      minDiff = diff;
      closestTemp = temp;
    }
  }

  return WATER_PROPERTIES[closestTemp as keyof typeof WATER_PROPERTIES];
}

/**
 * Calculate temperature-dependent viscosity using Arrhenius equation
 * μ(T) = μ₀ * exp(E/R * (1/T - 1/T₀))
 * @param baseViscosity - Base viscosity at reference temperature (Pa·s)
 * @param referenceTemperature - Reference temperature (K)
 * @param currentTemperature - Current temperature (K)
 * @param activationEnergy - Activation energy (J/mol), default for water
 * @returns Viscosity at current temperature (Pa·s)
 */
export function temperatureDependentViscosity(
  baseViscosity: number,
  referenceTemperature: number,
  currentTemperature: number,
  activationEnergy: number = 15000 // J/mol (typical for water)
): number {
  if (
    baseViscosity <= 0 ||
    referenceTemperature <= 0 ||
    currentTemperature <= 0
  ) {
    throw new Error('All parameters must be positive');
  }

  const R = 8.314; // J/(mol·K) - Universal gas constant

  // Arrhenius equation for temperature-dependent viscosity
  const viscosityRatio = Math.exp(
    (activationEnergy / R) * (1 / currentTemperature - 1 / referenceTemperature)
  );

  return baseViscosity * viscosityRatio;
}

/**
 * Calculate average temperature along pipe length
 * @param inletTemperature - Inlet temperature (K)
 * @param outletTemperature - Outlet temperature (K)
 * @returns Average temperature (K)
 */
export function calculateAverageTemperature(
  inletTemperature: number,
  outletTemperature: number
): number {
  if (inletTemperature <= 0 || outletTemperature <= 0) {
    throw new Error('Temperatures must be positive');
  }

  // Use arithmetic mean for simplicity
  // For more accuracy, could use logarithmic mean for heat transfer applications
  return (inletTemperature + outletTemperature) / 2;
}

/**
 * Estimate outlet temperature based on heat transfer and flow conditions
 * @param inletTemperature - Inlet temperature (K)
 * @param flowRate - Volumetric flow rate (m³/s)
 * @param pipeDiameter - Pipe diameter (m)
 * @param pipeLength - Pipe length (m)
 * @param ambientTemperature - Ambient temperature (K), default 293.15K
 * @param heatTransferCoefficient - Heat transfer coefficient (W/(m²·K)), default 10
 * @returns Estimated outlet temperature (K)
 */
export function estimateOutletTemperature(
  inletTemperature: number,
  flowRate: number,
  pipeDiameter: number,
  pipeLength: number,
  ambientTemperature: number = 293.15,
  heatTransferCoefficient: number = 10
): number {
  if (
    inletTemperature <= 0 ||
    flowRate <= 0 ||
    pipeDiameter <= 0 ||
    pipeLength <= 0
  ) {
    throw new Error('All parameters must be positive');
  }

  // Simplified heat transfer calculation
  // Q = h * A * ΔT_avg
  // where A = π * D * L (pipe surface area)
  const pipeArea = Math.PI * pipeDiameter * pipeLength;
  const temperatureDifference = inletTemperature - ambientTemperature;

  // Heat loss rate (W)
  const heatLossRate =
    heatTransferCoefficient * pipeArea * temperatureDifference * 0.5; // Factor of 0.5 for average ΔT

  // Water specific heat capacity (J/(kg·K))
  const specificHeatCapacity = 4186;

  // Water density (kg/m³) - use average of inlet and ambient
  const waterDensity = 1000; // Simplified

  // Mass flow rate (kg/s)
  const massFlowRate = flowRate * waterDensity;

  // Temperature drop due to heat loss
  const temperatureDrop = heatLossRate / (massFlowRate * specificHeatCapacity);

  const outletTemperature = inletTemperature - temperatureDrop;

  // Ensure outlet temperature doesn't go below ambient
  return Math.max(outletTemperature, ambientTemperature);
}

/**
 * Calculate viscosity-adjusted pressure drop with temperature-dependent properties
 * @param input - Input parameters for viscosity-adjusted pressure drop calculation
 * @returns Viscosity-adjusted pressure drop result
 */
export function iterateViscosityAdjustedDrop(
  input: ViscosityAdjustedDropInput
): ViscosityAdjustedDropResult {
  const warnings: (string | Warning)[] = [];

  // Convert input parameters to SI units
  const flowRate = convert(input.flowRate, 'm³/s').value;
  const length = convert(input.length, 'm').value;
  const diameter = convert(input.diameter, 'm').value;
  const roughness = convert(input.roughness, 'm').value;
  const inletTemperature = convert(input.inletTemperature, 'K').value;
  const baseDensity = convert(input.fluid.density, 'kg/m³').value;
  const baseViscosity = convert(input.fluid.viscosity, 'Pa·s').value;
  const referenceTemperature = convert(
    input.fluid.referenceTemperature,
    'K'
  ).value;

  // Set default values
  const maxIterations = input.maxIterations ?? 50;
  const convergenceTolerance = input.convergenceTolerance ?? 1e-6;

  // Validate inputs
  if (flowRate <= 0 || length <= 0 || diameter <= 0 || roughness < 0) {
    throw new Error(
      'Flow rate, length, and diameter must be positive, roughness must be non-negative'
    );
  }

  if (
    inletTemperature <= 0 ||
    baseDensity <= 0 ||
    baseViscosity <= 0 ||
    referenceTemperature <= 0
  ) {
    throw new Error('All fluid properties and temperatures must be positive');
  }

  // Calculate initial outlet temperature if not provided
  let outletTemperature = input.outletTemperature
    ? convert(input.outletTemperature, 'K').value
    : estimateOutletTemperature(inletTemperature, flowRate, diameter, length);

  // Ensure outlet temperature is reasonable
  if (outletTemperature <= 0) {
    outletTemperature = inletTemperature * 0.95; // 5% drop as fallback
    warnings.push({
      type: 'warning',
      message:
        'Calculated outlet temperature was invalid, using 5% drop from inlet',
      severity: 'medium',
    });
  }

  // Initialize convergence tracking
  const convergenceHistory: Array<{
    iteration: number;
    pressureDrop: number;
    averageTemperature: number;
    averageViscosity: number;
    reynoldsNumber: number;
    frictionFactor: number;
  }> = [];

  let previousPressureDrop = 0;
  let converged = false;
  let iterations = 0;

  // Iterative calculation
  for (iterations = 0; iterations < maxIterations; iterations++) {
    // Calculate average temperature
    const averageTemperature = calculateAverageTemperature(
      inletTemperature,
      outletTemperature
    );

    // Calculate temperature-dependent viscosity
    let averageViscosity: number;
    if (input.fluid.viscosityTemperatureCoefficient) {
      // Use provided temperature coefficient
      averageViscosity = temperatureDependentViscosity(
        baseViscosity,
        referenceTemperature,
        averageTemperature,
        input.fluid.viscosityTemperatureCoefficient *
          8.314 *
          referenceTemperature // Convert to activation energy
      );
    } else {
      // Use water properties if available
      try {
        const waterProps = waterProps(averageTemperature);
        averageViscosity = waterProps.viscosity;
      } catch {
        // Fallback to base viscosity
        averageViscosity = baseViscosity;
      }
    }

    // Calculate temperature-dependent density (simplified)
    let averageDensity = baseDensity;
    try {
      const waterPropsResult = waterProps(averageTemperature);
      averageDensity = waterPropsResult.density;
    } catch {
      // Use base density if water properties not available
    }

    // Calculate flow velocity
    const pipeArea = (Math.PI * Math.pow(diameter, 2)) / 4;
    const velocity = flowRate / pipeArea;

    // Calculate Reynolds number
    const reynoldsNumber = reynolds(
      averageDensity,
      velocity,
      diameter,
      averageViscosity
    );

    // Calculate friction factor
    const relativeRoughness = roughness / diameter;
    const frictionFactor = churchillF(reynoldsNumber, relativeRoughness);

    // Calculate pressure drop using Darcy-Weisbach equation
    const pressureDrop =
      (frictionFactor * length * averageDensity * Math.pow(velocity, 2)) /
      (2 * diameter);

    // Record convergence history
    convergenceHistory.push({
      iteration: iterations + 1,
      pressureDrop,
      averageTemperature,
      averageViscosity,
      reynoldsNumber,
      frictionFactor,
    });

    // Check convergence
    if (iterations > 0) {
      const pressureDropChange = Math.abs(pressureDrop - previousPressureDrop);
      const relativeChange = pressureDropChange / Math.max(pressureDrop, 1e-6);

      if (relativeChange < convergenceTolerance) {
        converged = true;
        break;
      }
    }

    previousPressureDrop = pressureDrop;

    // Update outlet temperature based on new pressure drop (only if not provided)
    if (!input.outletTemperature) {
      // This is a simplified approach - in reality, temperature change would depend on heat transfer
      const temperatureDrop = pressureDrop / (averageDensity * 4186 * 100); // Simplified energy balance
      outletTemperature = inletTemperature - temperatureDrop;

      // Ensure outlet temperature stays reasonable
      outletTemperature = Math.max(outletTemperature, inletTemperature * 0.8);
    }
  }

  // Add warnings
  if (!converged) {
    warnings.push({
      type: 'warning',
      message: `Calculation did not converge within ${maxIterations} iterations`,
      severity: 'high',
    });
  }

  if (iterations > maxIterations * 0.8) {
    warnings.push({
      type: 'warning',
      message:
        'Calculation required many iterations, consider adjusting parameters',
      severity: 'medium',
    });
  }

  // Calculate final properties
  const finalAverageTemperature = calculateAverageTemperature(
    inletTemperature,
    outletTemperature
  );
  let finalAverageViscosity: number;

  if (input.fluid.viscosityTemperatureCoefficient) {
    finalAverageViscosity = temperatureDependentViscosity(
      baseViscosity,
      referenceTemperature,
      finalAverageTemperature,
      input.fluid.viscosityTemperatureCoefficient * 8.314 * referenceTemperature
    );
  } else {
    try {
      const waterPropsResult = waterProps(finalAverageTemperature);
      finalAverageViscosity = waterPropsResult.viscosity;
    } catch {
      finalAverageViscosity = baseViscosity;
    }
  }

  // Calculate inlet and outlet viscosities
  let inletViscosity = baseViscosity;
  let outletViscosity = baseViscosity;

  if (input.fluid.viscosityTemperatureCoefficient) {
    inletViscosity = temperatureDependentViscosity(
      baseViscosity,
      referenceTemperature,
      inletTemperature,
      input.fluid.viscosityTemperatureCoefficient * 8.314 * referenceTemperature
    );
    outletViscosity = temperatureDependentViscosity(
      baseViscosity,
      referenceTemperature,
      outletTemperature,
      input.fluid.viscosityTemperatureCoefficient * 8.314 * referenceTemperature
    );
  } else {
    try {
      const inletWaterProps = waterProps(inletTemperature);
      const outletWaterProps = waterProps(outletTemperature);
      inletViscosity = inletWaterProps.viscosity;
      outletViscosity = outletWaterProps.viscosity;
    } catch {
      // Use base viscosity if water properties not available
    }
  }

  // Calculate final velocity and Reynolds number
  const pipeArea = (Math.PI * Math.pow(diameter, 2)) / 4;
  const finalVelocity = flowRate / pipeArea;

  let finalAverageDensity = baseDensity;
  try {
    const waterPropsResult = waterProps(finalAverageTemperature);
    finalAverageDensity = waterPropsResult.density;
  } catch {
    // Use base density if water properties not available
  }

  const finalReynoldsNumber = reynolds(
    finalAverageDensity,
    finalVelocity,
    diameter,
    finalAverageViscosity
  );
  const finalFrictionFactor = churchillF(
    finalReynoldsNumber,
    roughness / diameter
  );

  // Calculate pressure drop percentage
  const pressureDropPercent = (previousPressureDrop / 101325) * 100; // Relative to atmospheric pressure

  return {
    inletTemperature: { value: inletTemperature, unit: 'K' },
    outletTemperature: { value: outletTemperature, unit: 'K' },
    averageTemperature: { value: finalAverageTemperature, unit: 'K' },
    pressureDrop: { value: previousPressureDrop, unit: 'Pa' },
    pressureDropPercent,
    inletViscosity: { value: inletViscosity, unit: 'Pa·s' },
    outletViscosity: { value: outletViscosity, unit: 'Pa·s' },
    averageViscosity: { value: finalAverageViscosity, unit: 'Pa·s' },
    reynoldsNumber: finalReynoldsNumber,
    frictionFactor: finalFrictionFactor,
    velocity: { value: finalVelocity, unit: 'm/s' },
    iterations,
    converged,
    warnings,
    metadata: {
      input,
      calculations: {
        convergenceHistory: convergenceHistory || [],
        finalTolerance:
          converged && convergenceHistory && convergenceHistory.length > 1
            ? Math.abs(
                previousPressureDrop -
                  (convergenceHistory[convergenceHistory.length - 2]
                    ?.pressureDrop ?? 0)
              ) / Math.max(previousPressureDrop, 1e-6)
            : 0,
      },
    },
  };
}
