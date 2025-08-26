import { Quantity } from '@/schemas/common';
import { convert } from '@/utils/units';
import { Warning } from '@/utils/guardrails';

export interface PipeProperties {
  elasticModulus?: Quantity; // Pa (Young's modulus of pipe material)
  wallThickness?: Quantity; // m
  diameter?: Quantity; // m
  waveSpeed?: Quantity; // m/s (if directly provided)
}

export interface FluidProperties {
  density: Quantity; // kg/m³
  bulkModulus?: Quantity; // Pa (if not provided, uses default for water)
}

export interface JoukowskyInput {
  fluid: FluidProperties;
  pipe: PipeProperties;
  velocityChange: Quantity; // m/s (positive for deceleration, negative for acceleration)
  pipeRating?: Quantity; // Pa (optional pipe pressure rating for comparison)
}

export interface JoukowskyResult {
  pressureSurge: Quantity; // Pa
  waveSpeed: Quantity; // m/s
  comparison?: {
    pipeRating: Quantity;
    safetyFactor: number; // pressureSurge / pipeRating
    isWithinRating: boolean;
  };
  warnings: (string | Warning)[];
  metadata: {
    input: JoukowskyInput;
    calculations: {
      fluidDensity: number;
      velocityChange: number;
      waveSpeed: number;
    };
  };
}

// Default fluid properties
const DEFAULT_WATER_BULK_MODULUS = 2.2e9; // Pa (water at 20°C)
const DEFAULT_WATER_DENSITY = 998; // kg/m³

// Common pipe material properties
const PIPE_MATERIALS = {
  steel: {
    elasticModulus: 200e9, // Pa
    name: 'Steel'
  },
  'stainless-steel': {
    elasticModulus: 193e9, // Pa
    name: 'Stainless Steel'
  },
  'ductile-iron': {
    elasticModulus: 170e9, // Pa
    name: 'Ductile Iron'
  },
  pvc: {
    elasticModulus: 3.3e9, // Pa
    name: 'PVC'
  },
  hdpe: {
    elasticModulus: 0.9e9, // Pa
    name: 'HDPE'
  },
  pe: {
    elasticModulus: 0.8e9, // Pa
    name: 'PE'
  }
} as const;

/**
 * Calculate wave speed in a pipe using the elastic theory
 * a = sqrt(K/ρ) / sqrt(1 + (K/E) * (D/e))
 * where:
 * - K = fluid bulk modulus (Pa)
 * - ρ = fluid density (kg/m³)
 * - E = pipe elastic modulus (Pa)
 * - D = pipe diameter (m)
 * - e = pipe wall thickness (m)
 * 
 * @param fluidDensity - Fluid density (kg/m³)
 * @param fluidBulkModulus - Fluid bulk modulus (Pa)
 * @param pipeElasticModulus - Pipe elastic modulus (Pa)
 * @param pipeDiameter - Pipe diameter (m)
 * @param wallThickness - Pipe wall thickness (m)
 * @returns Wave speed (m/s)
 */
export function calculateWaveSpeed(
  fluidDensity: number,
  fluidBulkModulus: number,
  pipeElasticModulus: number,
  pipeDiameter: number,
  wallThickness: number
): number {
  if (fluidDensity <= 0) {
    throw new Error('Fluid density must be positive');
  }
  
  if (fluidBulkModulus <= 0) {
    throw new Error('Fluid bulk modulus must be positive');
  }
  
  if (pipeElasticModulus <= 0) {
    throw new Error('Pipe elastic modulus must be positive');
  }
  
  if (pipeDiameter <= 0) {
    throw new Error('Pipe diameter must be positive');
  }
  
  if (wallThickness <= 0) {
    throw new Error('Wall thickness must be positive');
  }
  
  if (wallThickness >= pipeDiameter / 2) {
    throw new Error('Wall thickness must be less than pipe radius');
  }
  
  // Calculate wave speed using elastic theory
  const term1 = Math.sqrt(fluidBulkModulus / fluidDensity);
  const term2 = Math.sqrt(1 + (fluidBulkModulus / pipeElasticModulus) * (pipeDiameter / wallThickness));
  
  return term1 / term2;
}

/**
 * Calculate pressure surge using Joukowsky equation
 * ΔP = ρ * a * ΔV
 * where:
 * - ρ = fluid density (kg/m³)
 * - a = wave speed (m/s)
 * - ΔV = velocity change (m/s)
 * 
 * @param fluidDensity - Fluid density (kg/m³)
 * @param waveSpeed - Wave speed (m/s)
 * @param velocityChange - Velocity change (m/s)
 * @returns Pressure surge (Pa)
 */
export function pressureSurge(
  fluidDensity: number,
  waveSpeed: number,
  velocityChange: number
): number {
  if (fluidDensity <= 0) {
    throw new Error('Fluid density must be positive');
  }
  
  if (waveSpeed <= 0) {
    throw new Error('Wave speed must be positive');
  }
  
  return fluidDensity * waveSpeed * velocityChange;
}

/**
 * Calculate pressure surge using Joukowsky equation with comprehensive input validation
 * @param input - Input parameters for Joukowsky calculation
 * @returns Joukowsky calculation result
 */
export function joukowskySurge(input: JoukowskyInput): JoukowskyResult {
  const warnings: (string | Warning)[] = [];
  
  // Convert fluid properties to SI units
  const fluidDensity = convert(input.fluid.density, 'kg/m³').value;
  const fluidBulkModulus = input.fluid.bulkModulus 
    ? convert(input.fluid.bulkModulus, 'Pa').value 
    : DEFAULT_WATER_BULK_MODULUS;
  
  // Convert velocity change to SI units
  const velocityChange = convert(input.velocityChange, 'm/s').value;
  
  let waveSpeed: number;
  
  // Determine wave speed
  if (input.pipe.waveSpeed) {
    // Use provided wave speed
    waveSpeed = convert(input.pipe.waveSpeed, 'm/s').value;
    warnings.push('Using provided wave speed - pipe properties ignored');
  } else if (input.pipe.elasticModulus && input.pipe.wallThickness && input.pipe.diameter) {
    // Calculate wave speed from pipe properties
    const pipeElasticModulus = convert(input.pipe.elasticModulus, 'Pa').value;
    const wallThickness = convert(input.pipe.wallThickness, 'm').value;
    const pipeDiameter = convert(input.pipe.diameter, 'm').value;
    
    waveSpeed = calculateWaveSpeed(
      fluidDensity,
      fluidBulkModulus,
      pipeElasticModulus,
      pipeDiameter,
      wallThickness
    );
  } else {
    throw new Error('Either wave speed or complete pipe properties (elastic modulus, wall thickness, diameter) must be provided');
  }
  
  // Calculate pressure surge
  const surgePressure = pressureSurge(fluidDensity, waveSpeed, velocityChange);
  
  // Prepare result
  const result: JoukowskyResult = {
    pressureSurge: { value: surgePressure, unit: 'Pa' },
    waveSpeed: { value: waveSpeed, unit: 'm/s' },
    warnings,
    metadata: {
      input,
      calculations: {
        fluidDensity,
        velocityChange,
        waveSpeed
      }
    }
  };
  
  // Add pipe rating comparison if provided
  if (input.pipeRating) {
    const pipeRating = convert(input.pipeRating, 'Pa').value;
    const safetyFactor = Math.abs(surgePressure) / pipeRating;
    const isWithinRating = Math.abs(surgePressure) <= pipeRating;
    
    result.comparison = {
      pipeRating: { value: pipeRating, unit: 'Pa' },
      safetyFactor,
      isWithinRating
    };
    
    if (!isWithinRating) {
      warnings.push({
        type: 'warning',
        message: `Pressure surge (${Math.abs(surgePressure).toFixed(0)} Pa) exceeds pipe rating (${pipeRating.toFixed(0)} Pa)`,
        severity: 'high'
      });
    } else if (safetyFactor > 0.8) {
      warnings.push({
        type: 'warning',
        message: `Pressure surge is ${(safetyFactor * 100).toFixed(1)}% of pipe rating - consider safety margin`,
        severity: 'medium'
      });
    }
  }
  
  // Add validation warnings
  if (Math.abs(velocityChange) > 10) {
    warnings.push({
      type: 'warning',
      message: 'Large velocity change detected - verify input values',
      severity: 'medium'
    });
  }
  
  if (waveSpeed > 1500) {
    warnings.push({
      type: 'warning',
      message: 'Unusually high wave speed detected - verify pipe properties',
      severity: 'medium'
    });
  }
  
  return result;
}

/**
 * Get pipe material properties by name
 * @param materialName - Name of the pipe material
 * @returns Pipe material properties
 */
export function getPipeMaterial(materialName: keyof typeof PIPE_MATERIALS) {
  return PIPE_MATERIALS[materialName];
}

/**
 * List available pipe materials
 * @returns Array of available pipe material names
 */
export function getAvailablePipeMaterials(): string[] {
  return Object.keys(PIPE_MATERIALS);
}

/**
 * Calculate wave speed for common pipe materials
 * @param materialName - Name of the pipe material
 * @param diameter - Pipe diameter (m)
 * @param wallThickness - Pipe wall thickness (m)
 * @param fluidDensity - Fluid density (kg/m³)
 * @param fluidBulkModulus - Fluid bulk modulus (Pa)
 * @returns Wave speed (m/s)
 */
export function calculateWaveSpeedForMaterial(
  materialName: keyof typeof PIPE_MATERIALS,
  diameter: number,
  wallThickness: number,
  fluidDensity: number = DEFAULT_WATER_DENSITY,
  fluidBulkModulus: number = DEFAULT_WATER_BULK_MODULUS
): number {
  const material = getPipeMaterial(materialName);
  return calculateWaveSpeed(
    fluidDensity,
    fluidBulkModulus,
    material.elasticModulus,
    diameter,
    wallThickness
  );
}
