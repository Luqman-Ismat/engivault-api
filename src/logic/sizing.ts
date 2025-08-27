import { convert } from '@/utils/units';
import { reynolds, churchillF } from './friction';

export interface PipeSizingInput {
  flow: { value: number; unit: string };
  target: 'velocity' | 'dP';
  value: { value: number; unit: string };
  roughness?: { value: number; unit: string };
  fluid: {
    density: { value: number; unit: string };
    viscosity: { value: number; unit: string };
  };
  length: { value: number; unit: string };
}

export interface PipeSizingResult {
  diameter: { value: number; unit: 'm' };
  velocity: { value: number; unit: 'm/s' };
  pressureDrop: { value: number; unit: 'Pa' };
  reynoldsNumber: number;
  frictionFactor: number;
  warnings: Array<{
    type: 'transition' | 'mach' | 'correlation' | 'general';
    message: string;
  }>;
  metadata: {
    input: PipeSizingInput;
    calculations: {
      method: string;
      iterations: number;
      convergenceTolerance: number;
      finalTolerance: number;
    };
  };
}

const DEFAULT_ROUGHNESS = { value: 0.000045, unit: 'm' }; // Steel pipe
const MAX_ITERATIONS = 50;
const CONVERGENCE_TOLERANCE = 1e-6;

/**
 * Calculate pressure drop for a given diameter using Darcy-Weisbach equation
 */
function calculatePressureDrop(
  flow: number,
  diameter: number,
  length: number,
  roughness: number,
  density: number,
  viscosity: number
): {
  pressureDrop: number;
  velocity: number;
  reynoldsNumber: number;
  frictionFactor: number;
} {
  const area = (Math.PI * diameter * diameter) / 4;
  const velocity = flow / area;
  const reynoldsNumber = reynolds(density, velocity, diameter, viscosity);
  const frictionFactor = churchillF(reynoldsNumber, roughness / diameter);
  const pressureDrop =
    (frictionFactor * (length / diameter) * density * velocity * velocity) / 2;

  return { pressureDrop, velocity, reynoldsNumber, frictionFactor };
}

/**
 * Calculate required diameter for target velocity
 */
function sizeForVelocity(
  flow: number,
  targetVelocity: number,
  length: number,
  roughness: number,
  density: number,
  viscosity: number
): {
  diameter: number;
  pressureDrop: number;
  velocity: number;
  reynoldsNumber: number;
  frictionFactor: number;
  iterations: number;
} {
  // Initial estimate based on continuity equation
  let diameter = Math.sqrt((4 * flow) / (Math.PI * targetVelocity));
  let iterations = 0;
  let tolerance = 1;

  while (iterations < MAX_ITERATIONS && tolerance > CONVERGENCE_TOLERANCE) {
    const result = calculatePressureDrop(
      flow,
      diameter,
      length,
      roughness,
      density,
      viscosity
    );
    const velocityError =
      Math.abs(result.velocity - targetVelocity) / targetVelocity;

    if (velocityError < CONVERGENCE_TOLERANCE) {
      return { ...result, diameter, iterations };
    }

    // Adjust diameter based on velocity error
    const adjustmentFactor = Math.sqrt(targetVelocity / result.velocity);
    diameter *= adjustmentFactor;
    tolerance = velocityError;
    iterations++;
  }

  // Return final result even if not fully converged
  const result = calculatePressureDrop(
    flow,
    diameter,
    length,
    roughness,
    density,
    viscosity
  );
  return { ...result, diameter, iterations };
}

/**
 * Calculate required diameter for target pressure drop
 */
function sizeForPressureDrop(
  flow: number,
  targetPressureDrop: number,
  length: number,
  roughness: number,
  density: number,
  viscosity: number
): {
  diameter: number;
  pressureDrop: number;
  velocity: number;
  reynoldsNumber: number;
  frictionFactor: number;
  iterations: number;
} {
  // Try multiple initial estimates and pick the best one
  const estimates = [
    // Estimate 1: Based on velocity (assume 2 m/s)
    Math.sqrt((4 * flow) / (Math.PI * 2)),
    // Estimate 2: Based on simplified Darcy-Weisbach
    Math.pow(
      (0.02 * length * density * flow * flow) /
        (Math.PI * Math.PI * targetPressureDrop),
      0.2
    ),
    // Estimate 3: Based on typical pipe sizes
    0.1,
  ];

  let bestDiameter = estimates[0];
  let bestError = Infinity;

  // Test each estimate
  for (const estimate of estimates) {
    const diameter = Math.max(0.01, Math.min(1.0, estimate));
    const result = calculatePressureDrop(
      flow,
      diameter,
      length,
      roughness,
      density,
      viscosity
    );

    if (!isNaN(result.pressureDrop) && result.pressureDrop > 0) {
      const error =
        Math.abs(result.pressureDrop - targetPressureDrop) / targetPressureDrop;
      if (error < bestError) {
        bestError = error;
        bestDiameter = diameter;
      }
    }
  }

  let diameter = bestDiameter || 0.1; // Fallback to 0.1 if all estimates fail
  const assumedFrictionFactor = 0.02;

  // Simple iteration with bounds checking
  for (let i = 0; i < 20; i++) {
    const result = calculatePressureDrop(
      flow,
      diameter,
      length,
      roughness,
      density,
      viscosity
    );

    // Check if we have a valid result
    if (isNaN(result.pressureDrop) || result.pressureDrop <= 0) {
      // If calculation failed, use a simpler approach
      const velocity = flow / ((Math.PI * diameter * diameter) / 4);
      const pressureDrop =
        (assumedFrictionFactor *
          (length / diameter) *
          density *
          velocity *
          velocity) /
        2;
      return {
        diameter,
        pressureDrop,
        velocity,
        reynoldsNumber: (density * velocity * diameter) / viscosity,
        frictionFactor: assumedFrictionFactor,
        iterations: i + 1,
      };
    }

    const pressureError =
      Math.abs(result.pressureDrop - targetPressureDrop) / targetPressureDrop;

    if (pressureError < 0.01) {
      // 1% tolerance
      return { ...result, diameter, iterations: i + 1 };
    }

    // Adjust diameter based on pressure drop error
    // Use a more conservative adjustment to prevent divergence
    const adjustmentFactor = Math.pow(
      targetPressureDrop / result.pressureDrop,
      0.05
    );
    diameter *= adjustmentFactor;

    // Bounds checking - more conservative bounds
    if (diameter <= 0.001 || diameter > 2.0) {
      break;
    }
  }

  // Return final result
  const result = calculatePressureDrop(
    flow,
    diameter,
    length,
    roughness,
    density,
    viscosity
  );
  return { ...result, diameter, iterations: 20 };
}

/**
 * Size pipe for target velocity or pressure drop
 */
export function sizePipeForTarget(input: PipeSizingInput): PipeSizingResult {
  const warnings: Array<{
    type: 'transition' | 'mach' | 'correlation' | 'general';
    message: string;
  }> = [];

  // Validate inputs first
  if (input.flow.value <= 0) {
    throw new Error('Flow rate must be positive');
  }
  if (input.value.value <= 0) {
    throw new Error('Target value must be positive');
  }
  if (input.length.value <= 0) {
    throw new Error('Pipe length must be positive');
  }
  if (input.fluid.density.value <= 0) {
    throw new Error('Fluid density must be positive');
  }
  if (input.fluid.viscosity.value <= 0) {
    throw new Error('Fluid viscosity must be positive');
  }

  // Convert all inputs to SI units
  const flow = convert(input.flow, 'm³/s').value;
  const targetValue = convert(
    input.value,
    input.target === 'velocity' ? 'm/s' : 'Pa'
  ).value;
  const roughness = convert(input.roughness ?? DEFAULT_ROUGHNESS, 'm').value;
  const density = convert(input.fluid.density, 'kg/m³').value;
  const viscosity = convert(input.fluid.viscosity, 'Pa·s').value;
  const length = convert(input.length, 'm').value;

  let result: {
    diameter: number;
    pressureDrop: number;
    velocity: number;
    reynoldsNumber: number;
    frictionFactor: number;
    iterations: number;
  };
  let finalTolerance = 0;

  if (input.target === 'velocity') {
    result = sizeForVelocity(
      flow,
      targetValue,
      length,
      roughness,
      density,
      viscosity
    );
    finalTolerance = Math.abs(result.velocity - targetValue) / targetValue;
  } else {
    result = sizeForPressureDrop(
      flow,
      targetValue,
      length,
      roughness,
      density,
      viscosity
    );
    finalTolerance = Math.abs(result.pressureDrop - targetValue) / targetValue;
  }

  // Generate warnings
  if (result.reynoldsNumber < 2300) {
    warnings.push({
      type: 'transition',
      message:
        'Flow is laminar (Re < 2300). Consider using different correlations for laminar flow.',
    });
  } else if (result.reynoldsNumber < 4000) {
    warnings.push({
      type: 'transition',
      message:
        'Flow is in transition region (2300 < Re < 4000). Results may be uncertain.',
    });
  }

  if (result.velocity > 3) {
    warnings.push({
      type: 'general',
      message:
        'High velocity detected (> 3 m/s). Consider erosion and noise implications.',
    });
  }

  if (result.diameter < 0.01) {
    warnings.push({
      type: 'general',
      message:
        'Very small diameter calculated (< 10 mm). Verify practical feasibility.',
    });
  } else if (result.diameter > 1) {
    warnings.push({
      type: 'general',
      message:
        'Large diameter calculated (> 1 m). Verify practical feasibility.',
    });
  }

  return {
    diameter: { value: result.diameter, unit: 'm' },
    velocity: { value: result.velocity, unit: 'm/s' },
    pressureDrop: { value: result.pressureDrop, unit: 'Pa' },
    reynoldsNumber: result.reynoldsNumber,
    frictionFactor: result.frictionFactor,
    warnings,
    metadata: {
      input,
      calculations: {
        method:
          input.target === 'velocity'
            ? 'Velocity-based sizing'
            : 'Pressure drop-based sizing',
        iterations: result.iterations,
        convergenceTolerance: CONVERGENCE_TOLERANCE,
        finalTolerance,
      },
    },
  };
}
