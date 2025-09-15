import { convert } from '../utils/units';
import { Quantity } from '@/schemas/common';

// Types for relief valve sizing
export interface ReliefValveInput {
  fluidType: 'liquid' | 'gas';
  flow: Quantity;
  pressureDrop: Quantity;
  specificGravity?: number; // For liquids
  molecularWeight?: number; // For gases
  temperature?: Quantity; // For gases
  backPressure?: Quantity; // For gases
  dischargeCoefficient?: number; // K_d, default 0.65
  backPressureCorrection?: number; // K_b, default 1.0
  compressibilityFactor?: number; // Z, default 1.0
  specificHeatRatio?: number; // k, default 1.4
}

export interface ReliefValveResult {
  requiredArea: Quantity;
  flowRegime: 'liquid' | 'choked-gas' | 'non-choked-gas';
  criticalPressureRatio?: number;
  backPressureCorrection?: number;
  warnings: (string | Warning)[];
  metadata: {
    input: ReliefValveInput;
    calculations: {
      flowRate: Quantity;
      pressureDrop: Quantity;
      dischargeCoefficient: number;
      assumptions: string[];
    };
  };
}

export interface Warning {
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Calculate required relief valve area for liquid flow
 * Based on API 520/ASME Section VIII Div 1 Appendix M
 *
 * Assumptions:
 * - Incompressible flow
 * - No flashing (single-phase liquid)
 * - Constant density
 * - No significant elevation effects
 * - Discharge coefficient K_d accounts for all losses
 *
 * @param Q Flow rate (gpm)
 * @param deltaP Pressure drop (psi)
 * @param SG Specific gravity
 * @param Kd Discharge coefficient (default 0.65)
 * @returns Required area (in²)
 */
export function liquidReliefArea(
  Q: number,
  deltaP: number,
  SG: number,
  Kd: number = 0.65
): number {
  if (Q <= 0 || deltaP <= 0 || SG <= 0 || Kd <= 0) {
    throw new Error('All parameters must be positive');
  }

  // API 520 liquid flow equation: A = Q * sqrt(SG / ΔP) / (K_d * 38)
  // Where 38 is the conversion factor for gpm, psi, in²
  const area = (Q * Math.sqrt(SG / deltaP)) / (Kd * 38);

  return area;
}

/**
 * Calculate critical pressure ratio for gas flow
 * Based on isentropic flow relations
 *
 * @param k Specific heat ratio (default 1.4 for air)
 * @returns Critical pressure ratio P_critical / P_upstream
 */
export function criticalPressureRatio(k: number = 1.4): number {
  if (k <= 1) {
    throw new Error('Specific heat ratio must be greater than 1');
  }

  // Critical pressure ratio = (2/(k+1))^(k/(k-1))
  return Math.pow(2 / (k + 1), k / (k - 1));
}

/**
 * Calculate back pressure correction factor K_b for gas flow
 * Based on API 520/ASME Section VIII
 *
 * Assumptions:
 * - Isentropic flow
 * - Constant specific heat ratio
 * - No significant heat transfer
 *
 * @param backPressureRatio P_back / P_upstream
 * @param k Specific heat ratio
 * @returns Back pressure correction factor
 */
export function backPressureCorrection(
  backPressureRatio: number,
  k: number = 1.4
): number {
  if (backPressureRatio < 0 || backPressureRatio > 1) {
    throw new Error('Back pressure ratio must be between 0 and 1');
  }

  if (k <= 1) {
    throw new Error('Specific heat ratio must be greater than 1');
  }

  const criticalRatio = criticalPressureRatio(k);

  if (backPressureRatio <= criticalRatio) {
    // Choked flow - K_b = 1.0
    return 1.0;
  } else {
    // Non-choked flow - simplified correlation
    // This is a simplified approach; more complex correlations exist
    const factor = Math.sqrt(1 - Math.pow(backPressureRatio, (k - 1) / k));
    return Math.max(0.5, factor); // Minimum K_b of 0.5
  }
}

/**
 * Calculate required relief valve area for gas flow
 * Based on API 520/ASME Section VIII
 *
 * Assumptions:
 * - Isentropic flow
 * - Ideal gas behavior (Z = 1 unless specified)
 * - Constant specific heat ratio
 * - No significant heat transfer
 * - Discharge coefficient accounts for all losses
 *
 * @param Q Flow rate (scfm)
 * @param upstreamPressure Upstream pressure (psia)
 * @param backPressure Back pressure (psia)
 * @param temperature Temperature (R)
 * @param molecularWeight Molecular weight (lb/lbmol)
 * @param k Specific heat ratio
 * @param Kd Discharge coefficient
 * @returns Required area (in²) and flow regime
 */
export function gasReliefArea(
  Q: number,
  upstreamPressure: number,
  backPressure: number,
  temperature: number,
  molecularWeight: number,
  k: number = 1.4,
  Kd: number = 0.65
): {
  area: number;
  regime: 'choked-gas' | 'non-choked-gas';
  criticalRatio: number;
  Kb: number;
} {
  if (
    Q <= 0 ||
    upstreamPressure <= 0 ||
    temperature <= 0 ||
    molecularWeight <= 0
  ) {
    throw new Error('All parameters must be positive');
  }

  if (backPressure >= upstreamPressure) {
    throw new Error('Back pressure must be less than upstream pressure');
  }

  const backPressureRatio = backPressure / upstreamPressure;
  const criticalRatio = criticalPressureRatio(k);
  const Kb = backPressureCorrection(backPressureRatio, k);

  let area: number;
  let regime: 'choked-gas' | 'non-choked-gas';

  if (backPressureRatio <= criticalRatio) {
    // Choked flow
    regime = 'choked-gas';
    // API 520 choked gas equation: A = Q * sqrt(T * MW / (P * K_d * K_b * C))
    // Where C is the gas constant factor
    const C = 520 * Math.sqrt(k / Math.pow(2 / (k + 1), (k + 1) / (k - 1)));
    area =
      Q *
      Math.sqrt(
        (temperature * molecularWeight) / (upstreamPressure * Kd * Kb * C)
      );
  } else {
    // Non-choked flow
    regime = 'non-choked-gas';
    // Simplified non-choked equation
    const pressureTerm = Math.sqrt(
      1 - Math.pow(backPressureRatio, (k - 1) / k)
    );
    area =
      (Q * Math.sqrt((temperature * molecularWeight) / upstreamPressure)) /
      (Kd * Kb * 520 * pressureTerm);
  }

  return { area, regime, criticalRatio, Kb };
}

/**
 * Size relief valve for given conditions
 * @param input Relief valve sizing input parameters
 * @returns Relief valve sizing result
 */
export function sizeReliefValve(input: ReliefValveInput): ReliefValveResult {
  const warnings: (string | Warning)[] = [];
  const assumptions: string[] = [];

  // Extract and convert input values
  const Q = convert(
    input.flow,
    input.fluidType === 'liquid' ? 'gpm' : 'scfm'
  ).value;
  const deltaP = convert(input.pressureDrop, 'psi').value;
  const Kd = input.dischargeCoefficient || 0.65;

  // Validate inputs
  if (Q <= 0) {
    throw new Error('Flow rate must be positive');
  }

  if (deltaP <= 0) {
    throw new Error('Pressure drop must be positive');
  }

  if (Kd <= 0 || Kd > 1) {
    throw new Error('Discharge coefficient must be between 0 and 1');
  }

  let requiredArea: number;
  let flowRegime: 'liquid' | 'choked-gas' | 'non-choked-gas';
  let criticalPressureRatio: number | undefined;
  let backPressureCorrection: number | undefined;

  if (input.fluidType === 'liquid') {
    // Liquid flow calculations
    const SG = input.specificGravity || 1.0;

    if (SG <= 0) {
      throw new Error('Specific gravity must be positive for liquid flow');
    }

    if (SG > 2.0) {
      warnings.push('Specific gravity above 2.0 - verify fluid properties');
    }

    if (SG < 0.5) {
      warnings.push('Specific gravity below 0.5 - verify fluid properties');
    }

    requiredArea = liquidReliefArea(Q, deltaP, SG, Kd);
    flowRegime = 'liquid';

    assumptions.push('Incompressible liquid flow');
    assumptions.push('No flashing (single-phase)');
    assumptions.push('Constant density');
    assumptions.push('No significant elevation effects');
  } else {
    // Gas flow calculations
    if (!input.molecularWeight || input.molecularWeight <= 0) {
      throw new Error(
        'Molecular weight must be provided and positive for gas flow'
      );
    }

    if (!input.temperature) {
      throw new Error('Temperature must be provided for gas flow');
    }

    if (!input.backPressure) {
      throw new Error('Back pressure must be provided for gas flow');
    }

    const upstreamPressure = convert(input.pressureDrop, 'psia').value;
    const backPressure = convert(input.backPressure, 'psia').value;
    const temperature = convert(input.temperature, 'R').value;
    const molecularWeight = input.molecularWeight;
    const k = input.specificHeatRatio || 1.4;
    const Z = input.compressibilityFactor || 1.0;

    if (backPressure >= upstreamPressure) {
      throw new Error('Back pressure must be less than upstream pressure');
    }

    if (temperature < 400 || temperature > 2000) {
      warnings.push(
        'Temperature outside typical range (400-2000 R) - verify conditions'
      );
    }

    if (molecularWeight < 2 || molecularWeight > 200) {
      warnings.push(
        'Molecular weight outside typical range (2-200) - verify fluid'
      );
    }

    if (k < 1.1 || k > 1.7) {
      warnings.push(
        'Specific heat ratio outside typical range (1.1-1.7) - verify fluid'
      );
    }

    if (Z < 0.5 || Z > 1.5) {
      warnings.push(
        'Compressibility factor outside typical range (0.5-1.5) - verify conditions'
      );
    }

    const gasResult = gasReliefArea(
      Q,
      upstreamPressure,
      backPressure,
      temperature,
      molecularWeight,
      k,
      Kd
    );

    requiredArea = gasResult.area;
    flowRegime = gasResult.regime;
    criticalPressureRatio = gasResult.criticalRatio;
    backPressureCorrection = gasResult.Kb;

    assumptions.push('Isentropic gas flow');
    assumptions.push('Ideal gas behavior (Z = 1 unless specified)');
    assumptions.push('Constant specific heat ratio');
    assumptions.push('No significant heat transfer');

    if (flowRegime === 'choked-gas') {
      assumptions.push('Choked flow at throat');
    }
  }

  // Generate warnings for area size
  if (requiredArea < 0.1) {
    warnings.push(
      'Very small required area (< 0.1 in²) - consider minimum valve size'
    );
  } else if (requiredArea > 100) {
    warnings.push(
      'Very large required area (> 100 in²) - consider multiple valves or verify conditions'
    );
  }

  // Generate warnings for pressure drop
  if (deltaP < 1) {
    warnings.push('Low pressure drop (< 1 psi) - verify relief conditions');
  } else if (deltaP > 1000) {
    warnings.push(
      'High pressure drop (> 1000 psi) - verify valve rating and system design'
    );
  }

  // Generate warnings for discharge coefficient
  if (Kd < 0.5) {
    warnings.push(
      'Low discharge coefficient (< 0.5) - verify valve type and conditions'
    );
  }

  return {
    requiredArea: { value: requiredArea, unit: 'in²' },
    flowRegime,
    criticalPressureRatio: criticalPressureRatio || 0,
    backPressureCorrection: backPressureCorrection || 1,
    warnings,
    metadata: {
      input,
      calculations: {
        flowRate: input.flow,
        pressureDrop: input.pressureDrop,
        dischargeCoefficient: Kd,
        assumptions,
      },
    },
  };
}

/**
 * Validate relief valve sizing inputs
 * @param input Relief valve sizing input
 * @returns Validation result
 */
export function validateReliefValveInputs(input: ReliefValveInput): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check required fields
  if (!input.flow || input.flow.value <= 0) {
    errors.push('Flow rate must be positive');
  }

  if (!input.pressureDrop || input.pressureDrop.value <= 0) {
    errors.push('Pressure drop must be positive');
  }

  if (!input.fluidType || !['liquid', 'gas'].includes(input.fluidType)) {
    errors.push('Fluid type must be either "liquid" or "gas"');
  }

  // Check fluid-specific requirements
  if (input.fluidType === 'liquid') {
    if (input.specificGravity !== undefined && input.specificGravity <= 0) {
      errors.push('Specific gravity must be positive for liquid flow');
    }
  } else if (input.fluidType === 'gas') {
    if (!input.molecularWeight || input.molecularWeight <= 0) {
      errors.push(
        'Molecular weight must be provided and positive for gas flow'
      );
    }

    if (!input.temperature) {
      errors.push('Temperature must be provided for gas flow');
    }

    if (!input.backPressure) {
      errors.push('Back pressure must be provided for gas flow');
    }

    if (input.backPressure && input.pressureDrop) {
      const backP = convert(input.backPressure, 'psi').value;
      const deltaP = convert(input.pressureDrop, 'psi').value;

      if (backP >= deltaP) {
        errors.push('Back pressure must be less than upstream pressure');
      }
    }
  }

  // Check coefficient ranges
  if (input.dischargeCoefficient !== undefined) {
    if (input.dischargeCoefficient <= 0 || input.dischargeCoefficient > 1) {
      errors.push('Discharge coefficient must be between 0 and 1');
    }
  }

  if (input.backPressureCorrection !== undefined) {
    if (input.backPressureCorrection <= 0 || input.backPressureCorrection > 1) {
      errors.push('Back pressure correction factor must be between 0 and 1');
    }
  }

  if (input.compressibilityFactor !== undefined) {
    if (input.compressibilityFactor <= 0) {
      errors.push('Compressibility factor must be positive');
    }
  }

  if (input.specificHeatRatio !== undefined) {
    if (input.specificHeatRatio <= 1) {
      errors.push('Specific heat ratio must be greater than 1');
    }
  }

  return { isValid: errors.length === 0, errors };
}
