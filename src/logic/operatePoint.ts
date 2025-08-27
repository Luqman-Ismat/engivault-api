import { Quantity } from '@/schemas/common';
import { interpolateCurve, scaleByAffinity, PumpCurve } from './pumps';
import { Warning } from '@/utils/guardrails';

export interface PumpData {
  id: string;
  curve: { q: number; h: number }[];
  speed?: number;
}

export interface SystemData {
  staticHead: number; // m
  k: number; // m/(m³/s)² for quadratic system curve
  polynomial?: number[]; // coefficients for custom polynomial: a₀ + a₁Q + a₂Q² + ...
}

export interface OperatingPointResult {
  flow: Quantity;
  head: Quantity;
  pumpHead: Quantity;
  systemHead: Quantity;
  meta: {
    iterations: number;
    residual: number;
    convergence: boolean;
    method: string;
  };
  warnings: (string | Warning)[];
}

export interface PumpCombinationResult {
  aggregateCurve: (q: number) => number;
  arrangement: 'single' | 'parallel' | 'series';
  pumpCount: number;
  speedApplied: number;
  warnings?: (string | Warning)[];
}

/**
 * Combine multiple pump curves based on arrangement
 * @param curves Array of pump data
 * @param arrangement 'single', 'parallel', or 'series'
 * @param speed Speed ratio to apply to all pumps
 * @returns Aggregate head function
 */
export function combinePumps(
  curves: PumpData[],
  arrangement: 'single' | 'parallel' | 'series',
  speed: number = 1
): PumpCombinationResult {
  if (curves.length === 0) {
    throw new Error('At least one pump curve is required');
  }
  if (speed <= 0) {
    throw new Error('Speed must be positive');
  }

  const warnings: (string | Warning)[] = [];

  // Apply speed scaling to all pumps
  const scaledCurves = curves.map(pump => {
    const pumpCurve: PumpCurve = {
      points: pump.curve.map(p => ({ q: p.q, h: p.h })),
    };

    const scaled = scaleByAffinity(pumpCurve, speed);
    return {
      id: pump.id,
      interpolator: interpolateCurve(scaled.curve.points),
    };
  });

  let aggregateCurve: (q: number) => number;

  switch (arrangement) {
    case 'single':
      if (curves.length > 1) {
        warnings.push(
          'Multiple pumps specified for single arrangement, using first pump only'
        );
      }
      aggregateCurve = scaledCurves[0]!.interpolator;
      break;

    case 'parallel':
      // Parallel: same head, flows add up
      aggregateCurve = (q: number) => {
        // For parallel pumps, we need to find the head at which total flow equals q
        // Use bisection to find the head that gives the desired total flow
        let hMin = 0;
        let hMax = Math.max(
          ...scaledCurves.map(pump => {
            // Find shutoff head (flow = 0)
            return pump.interpolator(0);
          })
        );

        const tolerance = 1e-6;
        let iterations = 0;
        const maxIterations = 100;

        while (iterations < maxIterations) {
          const h = (hMin + hMax) / 2;

          // Calculate total flow at this head
          let totalQ = 0;
          for (const pump of scaledCurves) {
            // Find flow at this head by inverting the curve
            const flow = findFlowAtHead(pump.interpolator, h, 0, 1);
            totalQ += flow;
          }

          if (Math.abs(totalQ - q) < tolerance) {
            return h;
          }

          if (totalQ < q) {
            hMax = h;
          } else {
            hMin = h;
          }

          iterations++;
        }

        // Fallback: return average head
        return (hMin + hMax) / 2;
      };
      break;

    case 'series':
      // Series: same flow, heads add up
      aggregateCurve = (q: number) => {
        let totalHead = 0;
        for (const pump of scaledCurves) {
          totalHead += pump.interpolator(q);
        }
        return totalHead;
      };
      break;

    default:
      throw new Error(`Invalid arrangement: ${arrangement}`);
  }

  return {
    aggregateCurve,
    arrangement,
    pumpCount: curves.length,
    speedApplied: speed,
    warnings,
  };
}

/**
 * Calculate system head at given flow rate
 * @param q Flow rate (m³/s)
 * @param system System parameters
 * @returns System head (m)
 */
export function systemHead(q: number, system: SystemData): number {
  if (system.polynomial && system.polynomial.length > 0) {
    // Use custom polynomial: a₀ + a₁Q + a₂Q² + ...
    let head = 0;
    for (let i = 0; i < system.polynomial!.length; i++) {
      head += system.polynomial![i] * Math.pow(q, i);
    }
    return head;
  } else {
    // Use standard quadratic system curve: H = H_static + k Q²
    return system.staticHead + system.k * q * q;
  }
}

/**
 * Find flow rate at a given head by inverting the pump curve
 * @param pumpCurve Pump curve function
 * @param targetHead Target head
 * @param qMin Minimum flow rate
 * @param qMax Maximum flow rate
 * @returns Flow rate at target head
 */
function findFlowAtHead(
  pumpCurve: (q: number) => number,
  targetHead: number,
  qMin: number,
  qMax: number
): number {
  const tolerance = 1e-6;
  let iterations = 0;
  const maxIterations = 50;

  while (iterations < maxIterations) {
    const q = (qMin + qMax) / 2;
    const head = pumpCurve(q);

    if (Math.abs(head - targetHead) < tolerance) {
      return q;
    }

    if (head > targetHead) {
      qMin = q;
    } else {
      qMax = q;
    }

    iterations++;
  }

  return (qMin + qMax) / 2;
}

/**
 * Solve for operating point using robust bracket and bisection
 * @param pumpCurve Aggregate pump curve function
 * @param systemCurve System curve function
 * @param qMin Minimum flow rate to search
 * @param qMax Maximum flow rate to search
 * @returns Operating point with convergence info
 */
export function solveIntersection(
  pumpCurve: (q: number) => number,
  systemCurve: (q: number) => number,
  qMin: number = 0,
  qMax: number = 1
): {
  q: number;
  h: number;
  iterations: number;
  residual: number;
  convergence: boolean;
} {
  if (qMin >= qMax) {
    throw new Error('qMin must be less than qMax');
  }

  const tolerance = 1e-6;
  const maxIterations = 100;
  let iterations = 0;

  // Define the function to find zero crossing: f(Q) = H_pump(Q) - H_system(Q)
  const f = (q: number) => pumpCurve(q) - systemCurve(q);

  // Find initial bracket
  let a = qMin;
  let b = qMax;
  let fa = f(a);
  let fb = f(b);

  // Check if we have a valid bracket
  if (fa * fb > 0) {
    // Try to find a valid bracket by expanding the search
    const expansionFactor = 2;

    while (fa * fb > 0 && iterations < 20) {
      if (Math.abs(fa) < Math.abs(fb)) {
        a = Math.max(0, a - (b - a) * expansionFactor);
        fa = f(a);
      } else {
        b = b + (b - a) * expansionFactor;
        fb = f(b);
      }
      iterations++;
    }

    if (fa * fb > 0) {
      // Still no valid bracket, return best estimate
      const q = (a + b) / 2;
      const h = pumpCurve(q);
      return {
        q,
        h,
        iterations,
        residual: Math.abs(fa),
        convergence: false,
      };
    }
  }

  // Bisection method
  while (b - a > tolerance && iterations < maxIterations) {
    const c = (a + b) / 2;
    const fc = f(c);

    if (Math.abs(fc) < tolerance) {
      return {
        q: c,
        h: pumpCurve(c),
        iterations,
        residual: Math.abs(fc),
        convergence: true,
      };
    }

    if (fa * fc < 0) {
      b = c;
      fb = fc;
    } else {
      a = c;
      fa = fc;
    }

    iterations++;
  }

  const q = (a + b) / 2;
  const h = pumpCurve(q);
  const residual = Math.abs(f(q));

  return {
    q,
    h,
    iterations,
    residual,
    convergence: residual < tolerance * 100, // More relaxed convergence check
  };
}

/**
 * Calculate operating point for pump system
 * @param pumps Pump data array
 * @param arrangement Pump arrangement
 * @param system System parameters
 * @param speed Speed ratio (optional)
 * @returns Operating point result
 */
export function calculateOperatingPoint(
  pumps: PumpData[],
  arrangement: 'single' | 'parallel' | 'series',
  system: SystemData,
  speed: number = 1
): OperatingPointResult {
  const warnings: (string | Warning)[] = [];

  // Validate inputs
  if (pumps.length === 0) {
    throw new Error('At least one pump is required');
  }

  // Check for valid pump curves
  for (const pump of pumps) {
    if (pump.curve.length < 2) {
      warnings.push(`Pump ${pump.id}: Curve must have at least 2 points`);
    }
  }

  // Combine pump curves
  let combination;
  try {
    combination = combinePumps(pumps, arrangement, speed);
    if (combination.warnings) {
      warnings.push(...combination.warnings);
    }
  } catch (error) {
    if (error instanceof Error) {
      warnings.push(error.message);
    }
    throw error;
  }

  // Define system curve
  const systemCurve = (q: number) => systemHead(q, system);

  // Find operating point
  const qMax =
    Math.max(...pumps.flatMap(p => p.curve.map(point => point.q))) * 2;
  const result = solveIntersection(
    combination.aggregateCurve,
    systemCurve,
    0,
    qMax
  );

  // Calculate heads
  const pumpHead = combination.aggregateCurve(result.q);
  const systemHeadValue = systemCurve(result.q);

  // Add warnings for convergence issues
  if (!result.convergence) {
    warnings.push(
      `Operating point calculation did not converge (residual: ${result.residual.toFixed(6)})`
    );
  }

  if (result.iterations > 50) {
    warnings.push(
      `Operating point calculation required many iterations (${result.iterations})`
    );
  }

  // Check for operating point validity
  if (result.q < 0) {
    warnings.push('Operating point has negative flow rate');
  }

  if (pumpHead < 0) {
    warnings.push('Operating point has negative pump head');
  }

  return {
    flow: { value: result.q, unit: 'm³/s' },
    head: { value: result.h, unit: 'm' },
    pumpHead: { value: pumpHead, unit: 'm' },
    systemHead: { value: systemHeadValue, unit: 'm' },
    meta: {
      iterations: result.iterations,
      residual: result.residual,
      convergence: result.convergence,
      method: 'bisection',
    },
    warnings,
  };
}

/**
 * Validate pump operating point inputs
 * @param pumps Pump data
 * @param arrangement Arrangement type
 * @param system System data
 * @returns Validation result
 */
export function validateOperatingPointInputs(
  pumps: PumpData[],
  arrangement: 'single' | 'parallel' | 'series',
  system: SystemData
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (pumps.length === 0) {
    errors.push('At least one pump is required');
  }

  for (let i = 0; i < pumps.length; i++) {
    const pump = pumps[i];
    if (!pump?.id) {
      errors.push(`Pump ${i}: ID is required`);
    }
    if (!pump?.curve || pump.curve.length < 2) {
      errors.push(`Pump ${pump?.id || i}: Curve must have at least 2 points`);
    }
    if (pump?.speed !== undefined && pump.speed <= 0) {
      errors.push(`Pump ${pump?.id || i}: Speed must be positive`);
    }
  }

  if (!['single', 'parallel', 'series'].includes(arrangement)) {
    errors.push('Invalid arrangement type');
  }

  if (system.staticHead < 0) {
    errors.push('Static head cannot be negative');
  }

  if (system.k < 0) {
    errors.push('System coefficient k cannot be negative');
  }

  if (system.polynomial && system.polynomial.length > 0) {
    // Validate polynomial coefficients
    for (let i = 0; i < system.polynomial.length; i++) {
      if (typeof system.polynomial[i] !== 'number') {
        errors.push(`Polynomial coefficient ${i} must be a number`);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}
