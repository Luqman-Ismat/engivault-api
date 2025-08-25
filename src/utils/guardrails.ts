import { Quantity } from '@/schemas/common';

// Warning types for different engineering checks
export interface Warning {
  type: 'transition' | 'mach' | 'correlation' | 'general';
  message: string;
  severity: 'low' | 'medium' | 'high';
  context?: Record<string, unknown>;
}

// Warning for Reynolds number in transition region (1800 < Re < 4000)
export function warnTransition(Re: number): Warning | null {
  if (Re > 1800 && Re < 4000) {
    return {
      type: 'transition',
      message: `Reynolds number (${Re.toFixed(0)}) is in the transition region (1800-4000). Flow regime may be uncertain.`,
      severity: 'medium',
      context: {
        reynoldsNumber: Re,
        lowerBound: 1800,
        upperBound: 4000,
      },
    };
  }
  return null;
}

// Warning for Mach number approaching compressible flow (M > 0.3)
export function warnMach(M: number): Warning | null {
  if (M > 0.3) {
    return {
      type: 'mach',
      message: `Mach number (${M.toFixed(3)}) exceeds 0.3. Incompressible flow assumptions may not be valid.`,
      severity: 'high',
      context: {
        machNumber: M,
        threshold: 0.3,
      },
    };
  }
  return null;
}

// Warning for correlation range validity
export function warnCorrelationRange(
  name: string,
  ok: boolean,
  context: Record<string, unknown> = {}
): Warning | null {
  if (!ok) {
    return {
      type: 'correlation',
      message: `Correlation '${name}' may be outside its valid range. Results should be used with caution.`,
      severity: 'medium',
      context: {
        correlationName: name,
        ...context,
      },
    };
  }
  return null;
}

// General warning function for custom warnings
export function warnGeneral(
  message: string,
  severity: 'low' | 'medium' | 'high' = 'medium',
  context: Record<string, unknown> = {}
): Warning {
  return {
    type: 'general',
    message,
    severity,
    context,
  };
}

// Accumulate multiple warnings into a single array
export function accumulateWarnings(...warnings: (Warning | null)[]): Warning[] {
  return warnings.filter((warning): warning is Warning => warning !== null);
}

// Utility function to check Reynolds number from flow parameters
export function calculateReynoldsNumber(
  velocity: Quantity,
  diameter: Quantity,
  density: Quantity,
  viscosity: Quantity
): number {
  // Convert all to SI units first
  const v = velocity.value; // m/s
  const d = diameter.value; // m
  const rho = density.value; // kg/m³
  const mu = viscosity.value; // Pa·s

  return (rho * v * d) / mu;
}

// Utility function to check Mach number from velocity and speed of sound
export function calculateMachNumber(
  velocity: Quantity,
  speedOfSound: Quantity
): number {
  // Convert to SI units
  const v = velocity.value; // m/s
  const a = speedOfSound.value; // m/s

  return v / a;
}

// Comprehensive warning check for fluid flow calculations
export function checkFlowWarnings(
  velocity: Quantity,
  diameter: Quantity,
  density: Quantity,
  viscosity: Quantity,
  speedOfSound?: Quantity
): Warning[] {
  const warnings: (Warning | null)[] = [];

  // Calculate Reynolds number
  const Re = calculateReynoldsNumber(velocity, diameter, density, viscosity);
  warnings.push(warnTransition(Re));

  // Calculate Mach number if speed of sound is provided
  if (speedOfSound) {
    const M = calculateMachNumber(velocity, speedOfSound);
    warnings.push(warnMach(M));
  }

  return accumulateWarnings(...warnings);
}

// Warning for temperature range validity
export function warnTemperatureRange(
  temperature: Quantity,
  minTemp: number,
  maxTemp: number,
  correlationName: string
): Warning | null {
  const T = temperature.value;
  const unit = temperature.unit;

  if (T < minTemp || T > maxTemp) {
    return {
      type: 'correlation',
      message: `Temperature (${T} ${unit}) is outside the valid range (${minTemp}-${maxTemp} ${unit}) for correlation '${correlationName}'.`,
      severity: 'medium',
      context: {
        correlationName,
        temperature: T,
        unit,
        minTemp,
        maxTemp,
      },
    };
  }
  return null;
}

// Warning for pressure range validity
export function warnPressureRange(
  pressure: Quantity,
  minPressure: number,
  maxPressure: number,
  correlationName: string
): Warning | null {
  const P = pressure.value;
  const unit = pressure.unit;

  if (P < minPressure || P > maxPressure) {
    return {
      type: 'correlation',
      message: `Pressure (${P} ${unit}) is outside the valid range (${minPressure}-${maxPressure} ${unit}) for correlation '${correlationName}'.`,
      severity: 'medium',
      context: {
        correlationName,
        pressure: P,
        unit,
        minPressure,
        maxPressure,
      },
    };
  }
  return null;
}

// Export types for external use
export type { Warning };
