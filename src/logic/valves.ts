import { Quantity } from '@/schemas/common';
import { convert } from '@/utils/units';
import { Warning } from '@/utils/guardrails';

export interface ValveTrimCharacteristic {
  type: 'linear' | 'equal-percentage' | 'quick-opening' | 'modified-parabolic';
  description?: string;
}

export interface ValveSizingInput {
  flow: Quantity;
  pressureDrop: Quantity;
  specificGravity: number;
  trimCharacteristic: ValveTrimCharacteristic;
  pressureRecoveryFactor?: number; // FL (default 0.9 for most valves)
  upstreamPressure?: Quantity; // For choked flow analysis
  downstreamPressure?: Quantity; // For choked flow analysis
  temperature?: Quantity; // For vapor pressure calculation
  fluidName?: string; // For vapor pressure lookup
}

export interface ValveSizingResult {
  cv: Quantity; // US units (gpm/psi^0.5)
  kv: Quantity; // SI units (m³/h/bar^0.5)
  valveAuthority: number; // 0-1
  chokedFlow: {
    isChoked: boolean;
    likelihood: 'none' | 'low' | 'medium' | 'high';
    criticalPressureDrop: Quantity;
    actualPressureDrop: Quantity;
  };
  warnings: (string | Warning)[];
  metadata: {
    input: ValveSizingInput;
    calculations: {
      flowRate: Quantity;
      pressureDrop: Quantity;
      specificGravity: number;
    };
  };
}

export interface ValveAuthorityInput {
  valvePressureDrop: Quantity;
  systemPressureDrop: Quantity;
}

export interface ChokedFlowAnalysis {
  isChoked: boolean;
  likelihood: 'none' | 'low' | 'medium' | 'high';
  criticalPressureDrop: { value: number; unit: string };
  actualPressureDrop: { value: number; unit: string };
}

/**
 * Calculate required Cv for liquid flow
 * @param Q Flow rate (gpm)
 * @param deltaP Pressure drop (psi)
 * @param SG Specific gravity
 * @returns Required Cv
 */
export function requiredCvLiquid(
  Q: number,
  deltaP: number,
  SG: number
): number {
  if (deltaP <= 0) {
    throw new Error('Pressure drop must be positive');
  }

  if (SG <= 0) {
    throw new Error('Specific gravity must be positive');
  }

  if (Q <= 0) {
    throw new Error('Flow rate must be positive');
  }

  // Cv = Q * sqrt(SG / ΔP)
  return Q * Math.sqrt(SG / deltaP);
}

/**
 * Convert Cv to Kv
 * @param cv Cv value (gpm/psi^0.5)
 * @returns Kv value (m³/h/bar^0.5)
 */
export function cvToKv(cv: number): number {
  // Kv = Cv / 1.156
  return cv / 1.156;
}

/**
 * Convert Kv to Cv
 * @param kv Kv value (m³/h/bar^0.5)
 * @returns Cv value (gpm/psi^0.5)
 */
export function kvToCv(kv: number): number {
  // Cv = Kv * 1.156
  return kv * 1.156;
}

/**
 * Calculate critical pressure drop for choked flow (simplified IEC 60534)
 * @param FL Pressure recovery factor (typically 0.9 for most valves)
 * @param P1 Upstream pressure (Pa)
 * @param Pv Vapor pressure (Pa)
 * @returns Critical pressure drop (Pa)
 */
export function criticalPressureDrop(
  FL: number,
  P1: number,
  Pv: number
): number {
  if (FL <= 0 || FL > 1) {
    throw new Error('Pressure recovery factor must be between 0 and 1');
  }

  if (P1 <= 0) {
    throw new Error('Upstream pressure must be positive');
  }

  if (Pv < 0) {
    throw new Error('Vapor pressure cannot be negative');
  }

  // ΔPc = FL² * (P1 - Pv)
  return FL * FL * (P1 - Pv);
}

/**
 * Check for choked flow likelihood
 * @param actualDeltaP Actual pressure drop (Pa)
 * @param criticalDeltaP Critical pressure drop (Pa)
 * @returns Choked flow analysis result
 */
export function checkChokedFlow(
  actualDeltaP: number,
  criticalDeltaP: number
): ChokedFlowAnalysis {
  if (actualDeltaP <= 0 || criticalDeltaP <= 0) {
    return {
      isChoked: false,
      likelihood: 'none',
      criticalPressureDrop: { value: 0, unit: 'Pa' },
      actualPressureDrop: { value: 0, unit: 'Pa' },
    };
  }

  const ratio = actualDeltaP / criticalDeltaP;

  if (ratio >= 1.0) {
    return {
      isChoked: true,
      likelihood: 'high',
      criticalPressureDrop: { value: criticalDeltaP, unit: 'Pa' },
      actualPressureDrop: { value: actualDeltaP, unit: 'Pa' },
    };
  } else if (ratio >= 0.8) {
    return {
      isChoked: false,
      likelihood: 'high',
      criticalPressureDrop: { value: criticalDeltaP, unit: 'Pa' },
      actualPressureDrop: { value: actualDeltaP, unit: 'Pa' },
    };
  } else if (ratio >= 0.6) {
    return {
      isChoked: false,
      likelihood: 'medium',
      criticalPressureDrop: { value: criticalDeltaP, unit: 'Pa' },
      actualPressureDrop: { value: actualDeltaP, unit: 'Pa' },
    };
  } else if (ratio >= 0.4) {
    return {
      isChoked: false,
      likelihood: 'low',
      criticalPressureDrop: { value: criticalDeltaP, unit: 'Pa' },
      actualPressureDrop: { value: actualDeltaP, unit: 'Pa' },
    };
  } else {
    return {
      isChoked: false,
      likelihood: 'none',
      criticalPressureDrop: { value: criticalDeltaP, unit: 'Pa' },
      actualPressureDrop: { value: actualDeltaP, unit: 'Pa' },
    };
  }
}

/**
 * Calculate valve authority
 * @param valvePressureDrop Valve pressure drop
 * @param systemPressureDrop Total system pressure drop
 * @returns Valve authority (0-1)
 */
export function calculateValveAuthority(
  valvePressureDrop: number,
  systemPressureDrop: number
): number {
  if (valvePressureDrop <= 0) {
    throw new Error('Valve pressure drop must be positive');
  }

  if (systemPressureDrop <= 0) {
    throw new Error('System pressure drop must be positive');
  }

  if (valvePressureDrop > systemPressureDrop) {
    throw new Error('Valve pressure drop cannot exceed system pressure drop');
  }

  // Authority = ΔP_valve / (ΔP_valve + ΔP_rest)
  // where ΔP_rest = ΔP_system - ΔP_valve
  const restPressureDrop = systemPressureDrop - valvePressureDrop;
  return valvePressureDrop / (valvePressureDrop + restPressureDrop);
}

/**
 * Get default pressure recovery factor for valve type
 * @param trimCharacteristic Valve trim characteristic
 * @returns Default FL value
 */
export function getDefaultPressureRecoveryFactor(
  trimCharacteristic: ValveTrimCharacteristic
): number {
  switch (trimCharacteristic.type) {
    case 'linear':
      return 0.9; // Typical for linear trim
    case 'equal-percentage':
      return 0.85; // Slightly lower for equal percentage
    case 'quick-opening':
      return 0.95; // Higher for quick opening
    case 'modified-parabolic':
      return 0.88; // Intermediate value
    default:
      return 0.9; // Conservative default
  }
}

/**
 * Get vapor pressure for common fluids (simplified)
 * @param fluidName Fluid name
 * @param temperature Temperature (K)
 * @returns Vapor pressure (Pa)
 */
export function getVaporPressure(
  fluidName: string,
  temperature: number
): number {
  // Simplified vapor pressure correlations
  switch (fluidName.toLowerCase()) {
    case 'water':
      // Antoine equation for water (simplified)
      const T_C = temperature - 273.15;
      if (T_C >= 0 && T_C <= 100) {
        // P_vap = 10^(8.07131 - 1730.63/(233.426 + T_C)) mmHg
        const P_vap_mmHg = Math.pow(10, 8.07131 - 1730.63 / (233.426 + T_C));
        return P_vap_mmHg * 133.322; // Convert mmHg to Pa
      }
      return 0; // Default for out-of-range temperatures

    case 'ethanol':
      // Simplified for ethanol
      const T_C_ethanol = temperature - 273.15;
      if (T_C_ethanol >= 0 && T_C_ethanol <= 100) {
        const P_vap_mmHg = Math.pow(
          10,
          8.20417 - 1642.89 / (230.3 + T_C_ethanol)
        );
        return P_vap_mmHg * 133.322;
      }
      return 0;

    default:
      return 0; // Unknown fluid, assume non-volatile
  }
}

/**
 * Size valve for liquid flow
 * @param input Valve sizing input parameters
 * @returns Valve sizing result
 */
export function sizeValve(input: ValveSizingInput): ValveSizingResult {
  const warnings: (string | Warning)[] = [];

  // Extract and convert input values
  const Q_gpm = convert(input.flow, 'gpm').value;
  const deltaP_psi = convert(input.pressureDrop, 'psi').value;
  const SG = input.specificGravity;

  // Validate inputs
  if (SG <= 0) {
    throw new Error('Specific gravity must be positive');
  }

  if (SG > 2.0) {
    warnings.push('Specific gravity above 2.0 - verify fluid properties');
  }

  if (SG < 0.5) {
    warnings.push('Specific gravity below 0.5 - verify fluid properties');
  }

  // Calculate required Cv
  const cv = requiredCvLiquid(Q_gpm, deltaP_psi, SG);
  const kv = cvToKv(cv);

  // Calculate valve authority (assuming valve pressure drop is the specified pressure drop)
  let valveAuthority = 0.5; // Default assumption
  if (input.upstreamPressure && input.downstreamPressure) {
    const P1 = convert(input.upstreamPressure, 'Pa').value;
    const P2 = convert(input.downstreamPressure, 'Pa').value;
    const systemDeltaP = P1 - P2;
    const valveDeltaP = convert(input.pressureDrop, 'Pa').value;

    if (systemDeltaP > 0 && valveDeltaP > 0 && valveDeltaP <= systemDeltaP) {
      valveAuthority = calculateValveAuthority(valveDeltaP, systemDeltaP);
    }
  }

  // Choked flow analysis
  let chokedFlow: ChokedFlowAnalysis = {
    isChoked: false,
    likelihood: 'none',
    criticalPressureDrop: { value: 0, unit: 'Pa' },
    actualPressureDrop: input.pressureDrop,
  };

  if (input.upstreamPressure) {
    const FL =
      input.pressureRecoveryFactor ||
      getDefaultPressureRecoveryFactor(input.trimCharacteristic);
    const P1 = convert(input.upstreamPressure, 'Pa').value;

    // Get vapor pressure
    let Pv = 0;
    if (input.fluidName && input.temperature) {
      const T = convert(input.temperature, 'K').value;
      Pv = getVaporPressure(input.fluidName, T);
    }

    const criticalDeltaP = criticalPressureDrop(FL, P1, Pv);
    const actualDeltaP = convert(input.pressureDrop, 'Pa').value;

    const chokedAnalysis = checkChokedFlow(actualDeltaP, criticalDeltaP);

    chokedFlow = {
      isChoked: chokedAnalysis.isChoked,
      likelihood: chokedAnalysis.likelihood,
      criticalPressureDrop: {
        value: chokedAnalysis.criticalPressureDrop.value,
        unit: 'Pa',
      },
      actualPressureDrop: {
        value: chokedAnalysis.actualPressureDrop.value,
        unit: 'Pa',
      },
    };

    // Generate warnings based on choked flow likelihood
    if (chokedAnalysis.likelihood === 'high') {
      warnings.push(
        'High likelihood of choked flow - consider larger valve or higher upstream pressure'
      );
    } else if (chokedAnalysis.likelihood === 'medium') {
      warnings.push(
        'Medium likelihood of choked flow - monitor valve performance'
      );
    }
  }

  // Generate warnings for valve authority
  if (valveAuthority < 0.2) {
    warnings.push(
      'Low valve authority (< 0.2) - poor control characteristics expected'
    );
  } else if (valveAuthority > 0.8) {
    warnings.push(
      'High valve authority (> 0.8) - valve dominates system pressure drop'
    );
  }

  // Generate warnings for Cv size
  if (cv < 1) {
    warnings.push(
      'Very small Cv (< 1) - consider smaller valve or higher pressure drop'
    );
  } else if (cv > 1000) {
    warnings.push(
      'Very large Cv (> 1000) - consider larger valve or lower pressure drop'
    );
  }

  // Generate warnings for pressure drop
  if (deltaP_psi < 1) {
    warnings.push('Low pressure drop (< 1 psi) - may result in poor control');
  } else if (deltaP_psi > 100) {
    warnings.push(
      'High pressure drop (> 100 psi) - verify valve rating and system design'
    );
  }

  return {
    cv: { value: cv, unit: 'gpm/psi^0.5' },
    kv: { value: kv, unit: 'm³/h/bar^0.5' },
    valveAuthority,
    chokedFlow,
    warnings,
    metadata: {
      input,
      calculations: {
        flowRate: input.flow,
        pressureDrop: input.pressureDrop,
        specificGravity: SG,
      },
    },
  };
}

/**
 * Validate valve sizing inputs
 * @param input Valve sizing input
 * @returns Validation result
 */
export function validateValveSizingInputs(input: ValveSizingInput): {
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

  if (input.specificGravity <= 0) {
    errors.push('Specific gravity must be positive');
  }

  if (!input.trimCharacteristic || !input.trimCharacteristic.type) {
    errors.push('Trim characteristic type is required');
  }

  // Check pressure recovery factor
  if (input.pressureRecoveryFactor !== undefined) {
    if (input.pressureRecoveryFactor <= 0 || input.pressureRecoveryFactor > 1) {
      errors.push('Pressure recovery factor must be between 0 and 1');
    }
  }

  // Check pressure consistency
  if (input.upstreamPressure && input.downstreamPressure) {
    const P1 = convert(input.upstreamPressure, 'Pa').value;
    const P2 = convert(input.downstreamPressure, 'Pa').value;

    if (P1 <= P2) {
      errors.push('Upstream pressure must be greater than downstream pressure');
    }

    if (input.pressureDrop) {
      const deltaP = convert(input.pressureDrop, 'Pa').value;
      const actualDeltaP = P1 - P2;

      if (deltaP > actualDeltaP) {
        errors.push(
          'Specified pressure drop cannot exceed actual pressure drop'
        );
      }
    }
  }

  // Check temperature range
  if (input.temperature) {
    const T = convert(input.temperature, 'K').value;
    if (T < 200 || T > 600) {
      errors.push('Temperature should be between 200K and 600K');
    }
  }

  return { isValid: errors.length === 0, errors };
}
