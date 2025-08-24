import { calculationCache, createCacheKey } from '../utils/cache';

export interface ReynoldsNumberInputs {
  fluidDensity: number; // kg/m^3
  velocity: number; // m/s
  pipeDiameter: number; // meters
  fluidViscosity: number; // Pa.s
}

export interface ReynoldsNumberOutputs {
  reynoldsNumber: number;
}

/**
 * Calculates the Reynolds number with caching for performance.
 * @param inputs Fluid density, velocity, pipe diameter, and fluid viscosity.
 * @returns The calculated Reynolds number.
 */
export function calculateReynoldsNumber(inputs: ReynoldsNumberInputs): ReynoldsNumberOutputs {
  const { fluidDensity, velocity, pipeDiameter, fluidViscosity } = inputs;

  if (fluidViscosity <= 0 || pipeDiameter <= 0) {
    return { reynoldsNumber: Infinity };
  }

  // Create cache key for this calculation
  const cacheKey = createCacheKey('reynolds', { fluidDensity, velocity, pipeDiameter, fluidViscosity });
  
  // Check cache first
  const cached = calculationCache.get(cacheKey);
  if (cached !== null) {
    return { reynoldsNumber: cached };
  }

  const reynoldsNumber = (fluidDensity * velocity * pipeDiameter) / fluidViscosity;

  // Cache the result
  calculationCache.set(cacheKey, reynoldsNumber);

  return { reynoldsNumber };
}

export interface FrictionFactorInputs {
  reynoldsNumber: number;
  roughness: number; // meters
  pipeDiameter: number; // meters
}

export interface FrictionFactorOutputs {
  frictionFactor: number;
}

/**
 * Calculates the Darcy friction factor using the Churchill equation with caching.
 * Valid for laminar, transition, and turbulent flow.
 * @param inputs Reynolds number, roughness, and pipe diameter.
 * @returns The calculated Darcy friction factor.
 */
export function calculateFrictionFactor(inputs: FrictionFactorInputs): FrictionFactorOutputs {
  const { reynoldsNumber, roughness, pipeDiameter } = inputs;

  if (pipeDiameter <= 0) {
    return { frictionFactor: NaN };
  }

  if (reynoldsNumber === 0) {
    return { frictionFactor: 0 }; // No friction for zero flow
  }

  if (reynoldsNumber < 0) {
    // Friction factor is typically for positive Reynolds number. Use absolute value.
    return calculateFrictionFactor({ reynoldsNumber: Math.abs(reynoldsNumber), roughness, pipeDiameter });
  }

  // Create cache key for this calculation
  const cacheKey = createCacheKey('friction', { reynoldsNumber, roughness, pipeDiameter });
  
  // Check cache first
  const cached = calculationCache.get(cacheKey);
  if (cached !== null) {
    return { frictionFactor: cached };
  }

  const relativeRoughness = roughness / pipeDiameter;

  // Churchill Equation components
  const term1 = Math.pow(8 / reynoldsNumber, 12);
  const termA = Math.pow(2.457 * Math.log(Math.pow(7 / reynoldsNumber, 0.9) + 0.27 * relativeRoughness), 16);
  const termB = Math.pow(37530 / reynoldsNumber, 16);

  const frictionFactor = 8 * Math.pow(term1 + Math.pow(termA + termB, -1.5), 1 / 12);

  // Cache the result
  calculationCache.set(cacheKey, frictionFactor);

  return { frictionFactor };
}