import { getKFactor } from '@/data/k-factors';
import { getFluidDefaults } from '@/props';

export interface MinorLossItem {
  type: string;
  count: number;
  k?: number; // Optional override for K-factor
  nominalSize?: string; // For size-specific K-factors
  schedule?: string; // For size-specific K-factors
}

export interface MinorLossesInput {
  items: MinorLossItem[];
  rho: number; // Fluid density (kg/m³)
  v: number; // Flow velocity (m/s)
  D?: number; // Pipe diameter (m) - optional for equivalent length calculation
}

export interface MinorLossesResult {
  deltaP: number; // Pressure drop (Pa)
  Keq: number; // Equivalent K-factor
  equivalentLength?: number; // Equivalent length (m) if D provided
  warnings: string[];
}

/**
 * Calculate minor losses for a collection of fittings
 * @param input - Minor losses input parameters
 * @returns Minor losses calculation result
 */
export function sumMinorLosses(input: MinorLossesInput): MinorLossesResult {
  const { items, rho, v, D } = input;
  const warnings: string[] = [];
  let totalK = 0;

  // Calculate total K-factor
  for (const item of items) {
    const { type, count, k: overrideK, nominalSize, schedule } = item;

    let kFactor: number;

    if (overrideK !== undefined) {
      // Use provided K-factor override
      kFactor = overrideK;
      warnings.push(`Using provided K-factor (${overrideK}) for ${type}`);
    } else {
      // Look up K-factor from catalog
      const kFactorData = getKFactor(type, nominalSize, schedule);

      if (kFactorData) {
        kFactor = kFactorData.k;
      } else {
        // Default K-factor if not found
        kFactor = 1.0;
        warnings.push(
          `K-factor not found for ${type}, using default value of 1.0`
        );
      }
    }

    // Add to total K-factor (multiply by count)
    totalK += kFactor * count;
  }

  // Calculate pressure drop using minor loss equation
  // ΔP = K * (ρV²/2)
  const deltaP = (totalK * (rho * v * v)) / 2;

  // Calculate equivalent length if diameter is provided
  // Leq = K * D / f, where f is Darcy friction factor
  // For rough estimation, we can use f ≈ 0.02 for turbulent flow
  let equivalentLength: number | undefined;
  if (D !== undefined) {
    const f = 0.02; // Approximate Darcy friction factor for turbulent flow
    equivalentLength = (totalK * D) / f;
  }

  const result: MinorLossesResult = {
    deltaP,
    Keq: totalK,
    warnings,
  };

  if (equivalentLength !== undefined) {
    result.equivalentLength = equivalentLength;
  }

  return result;
}

/**
 * Calculate minor losses with fluid properties from fluid name
 * @param items - Array of minor loss items
 * @param fluidName - Fluid name ('water', 'air', etc.)
 * @param temperature - Temperature (K)
 * @param velocity - Flow velocity (m/s)
 * @param diameter - Pipe diameter (m)
 * @returns Minor losses calculation result
 */
export function calculateMinorLossesWithFluid(
  items: MinorLossItem[],
  fluidName: string,
  temperature: number,
  velocity: number,
  diameter?: number
): MinorLossesResult {
  try {
    const fluidProps = getFluidDefaults(fluidName, temperature);
    const rho = fluidProps.density.value;

    const input: MinorLossesInput = {
      items,
      rho,
      v: velocity,
    };

    if (diameter !== undefined) {
      input.D = diameter;
    }

    return sumMinorLosses(input);
  } catch (error) {
    return {
      deltaP: 0,
      Keq: 0,
      warnings: [`Error getting fluid properties: ${error}`],
    };
  }
}

/**
 * Calculate minor losses from flow rate and pipe diameter
 * @param items - Array of minor loss items
 * @param rho - Fluid density (kg/m³)
 * @param flowRate - Volumetric flow rate (m³/s)
 * @param diameter - Pipe diameter (m)
 * @returns Minor losses calculation result
 */
export function calculateMinorLossesFromFlow(
  items: MinorLossItem[],
  rho: number,
  flowRate: number,
  diameter: number
): MinorLossesResult {
  // Calculate velocity from flow rate
  const area = Math.PI * (diameter / 2) ** 2;
  const velocity = flowRate / area;

  return sumMinorLosses({
    items,
    rho,
    v: velocity,
    D: diameter,
  });
}

/**
 * Calculate equivalent length for a given K-factor and pipe diameter
 * @param k - K-factor
 * @param diameter - Pipe diameter (m)
 * @param frictionFactor - Darcy friction factor (default: 0.02)
 * @returns Equivalent length (m)
 */
export function calculateEquivalentLength(
  k: number,
  diameter: number,
  frictionFactor: number = 0.02
): number {
  return (k * diameter) / frictionFactor;
}

/**
 * Calculate K-factor from equivalent length
 * @param equivalentLength - Equivalent length (m)
 * @param diameter - Pipe diameter (m)
 * @param frictionFactor - Darcy friction factor (default: 0.02)
 * @returns K-factor
 */
export function calculateKFactorFromEquivalentLength(
  equivalentLength: number,
  diameter: number,
  frictionFactor: number = 0.02
): number {
  return (equivalentLength * frictionFactor) / diameter;
}

/**
 * Validate minor loss items
 * @param items - Array of minor loss items
 * @returns Validation result with warnings
 */
export function validateMinorLossItems(items: MinorLossItem[]): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!items || items.length === 0) {
    warnings.push('No minor loss items provided');
    return { isValid: false, warnings };
  }

  for (const item of items) {
    if (!item.type) {
      warnings.push('Item missing type');
    }

    if (item.count <= 0) {
      warnings.push(`Invalid count for ${item.type}: ${item.count}`);
    }

    if (item.k !== undefined && item.k < 0) {
      warnings.push(`Invalid K-factor for ${item.type}: ${item.k}`);
    }

    // Check if K-factor exists in catalog (if no override provided)
    if (item.k === undefined) {
      const kFactorData = getKFactor(
        item.type,
        item.nominalSize,
        item.schedule
      );
      if (!kFactorData) {
        warnings.push(`K-factor not found in catalog for ${item.type}`);
      }
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

/**
 * Get summary of minor losses calculation
 * @param result - Minor losses calculation result
 * @returns Summary string
 */
export function getMinorLossesSummary(result: MinorLossesResult): string {
  const { deltaP, Keq, equivalentLength, warnings } = result;

  let summary = `Minor Losses Summary:\n`;
  summary += `- Total K-factor: ${Keq.toFixed(3)}\n`;
  summary += `- Pressure drop: ${deltaP.toFixed(1)} Pa\n`;

  if (equivalentLength !== undefined) {
    summary += `- Equivalent length: ${equivalentLength.toFixed(2)} m\n`;
  }

  summary += `- Warnings: ${warnings.length}\n`;
  if (warnings.length > 0) {
    warnings.forEach(warning => {
      summary += `  * ${warning}\n`;
    });
  }

  return summary;
}
