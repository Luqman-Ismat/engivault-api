import { Quantity } from '@/schemas/common';

export interface PumpCurvePoint {
  q: number; // flow rate (m³/s)
  h: number; // head (m)
  efficiency?: number; // efficiency (0-1)
}

export interface PumpCurve {
  points: PumpCurvePoint[];
  name?: string;
  units?: {
    flow: string;
    head: string;
    efficiency?: string;
  };
}

export interface AffinityScalingResult {
  curve: PumpCurve;
  speedRatio: number;
  impellerRatio?: number;
  scalingApplied: {
    speed: boolean;
    impeller: boolean;
  };
}

export interface BEPResult {
  bepPoint: PumpCurvePoint;
  distance: number; // distance from current point to BEP
  bepIndex: number; // index of BEP point in curve
  method: 'efficiency' | 'midpoint';
}

/**
 * Interpolate pump curve using monotone cubic interpolation or linear piecewise
 * @param curve Array of {q, h} points
 * @returns Function that takes flow rate and returns head
 */
export function interpolateCurve(curve: { q: number; h: number }[]): (q: number) => number {
  if (curve.length < 2) {
    throw new Error('Curve must have at least 2 points');
  }

  // Sort curve by flow rate
  const sortedCurve = [...curve].sort((a, b) => a.q - b.q);

  // Check for duplicate flow rates
  for (let i = 1; i < sortedCurve.length; i++) {
    if (Math.abs(sortedCurve[i].q - sortedCurve[i - 1].q) < 1e-10) {
      throw new Error('Curve contains duplicate flow rates');
    }
  }

  // Use monotone cubic interpolation for smooth curves
  return (q: number): number => {
    // Handle extrapolation
    if (q <= sortedCurve[0].q) {
      return sortedCurve[0].h;
    }
    if (q >= sortedCurve[sortedCurve.length - 1].q) {
      return sortedCurve[sortedCurve.length - 1].h;
    }

    // Find the segment containing q
    let i = 0;
    for (i = 0; i < sortedCurve.length - 1; i++) {
      if (q >= sortedCurve[i].q && q <= sortedCurve[i + 1].q) {
        break;
      }
    }

    const x0 = sortedCurve[i].q;
    const y0 = sortedCurve[i].h;
    const x1 = sortedCurve[i + 1].q;
    const y1 = sortedCurve[i + 1].h;

    // Linear interpolation within segment
    const t = (q - x0) / (x1 - x0);
    return y0 + t * (y1 - y0);
  };
}

/**
 * Scale pump curve by affinity laws
 * @param curve Original pump curve
 * @param speedRatio Speed ratio (new speed / original speed)
 * @param impellerRatio Impeller diameter ratio (new diameter / original diameter)
 * @returns Scaled curve
 */
export function scaleByAffinity(
  curve: PumpCurve,
  speedRatio: number,
  impellerRatio?: number
): AffinityScalingResult {
  if (speedRatio <= 0) {
    throw new Error('Speed ratio must be positive');
  }
  if (impellerRatio !== undefined && impellerRatio <= 0) {
    throw new Error('Impeller ratio must be positive');
  }

  const scaledPoints: PumpCurvePoint[] = curve.points.map(point => {
    let newQ = point.q * speedRatio;
    let newH = point.h * speedRatio * speedRatio;

    // Apply impeller scaling if provided
    if (impellerRatio !== undefined) {
      newQ = newQ * impellerRatio * impellerRatio * impellerRatio; // Q ~ d³
      newH = newH * impellerRatio * impellerRatio; // H ~ d²
    }

    const scaledPoint: PumpCurvePoint = {
      q: newQ,
      h: newH,
    };

    // Scale efficiency if available (efficiency typically doesn't change significantly with speed/impeller)
    if (point.efficiency !== undefined) {
      scaledPoint.efficiency = point.efficiency;
    }

    return scaledPoint;
  });

  return {
    curve: {
      ...curve,
      points: scaledPoints,
    },
    speedRatio,
    impellerRatio,
    scalingApplied: {
      speed: true,
      impeller: impellerRatio !== undefined,
    },
  };
}

/**
 * Calculate distance to Best Efficiency Point (BEP)
 * @param q Current flow rate
 * @param h Current head
 * @param curve Pump curve with efficiency data or use midpoint
 * @returns BEP information and distance
 */
export function bepc(q: number, h: number, curve: PumpCurve): BEPResult {
  if (curve.points.length === 0) {
    throw new Error('Curve must have at least one point');
  }

  let bepPoint: PumpCurvePoint;
  let bepIndex: number;
  let method: 'efficiency' | 'midpoint';

  // Check if efficiency data is available
  const hasEfficiency = curve.points.some(point => point.efficiency !== undefined);

  if (hasEfficiency) {
    // Find point with maximum efficiency
    let maxEfficiency = -1;
    bepIndex = 0;

    for (let i = 0; i < curve.points.length; i++) {
      const efficiency = curve.points[i].efficiency;
      if (efficiency !== undefined && efficiency > maxEfficiency) {
        maxEfficiency = efficiency;
        bepIndex = i;
      }
    }

    bepPoint = curve.points[bepIndex];
    method = 'efficiency';
  } else {
    // Use midpoint of curve
    bepIndex = Math.floor(curve.points.length / 2);
    bepPoint = curve.points[bepIndex];
    method = 'midpoint';
  }

  // Calculate distance using Euclidean distance in (q, h) space
  const dq = q - bepPoint.q;
  const dh = h - bepPoint.h;
  const distance = Math.sqrt(dq * dq + dh * dh);

  return {
    bepPoint,
    distance,
    bepIndex,
    method,
  };
}

/**
 * Calculate pump power based on flow, head, and efficiency
 * @param q Flow rate (m³/s)
 * @param h Head (m)
 * @param efficiency Pump efficiency (0-1)
 * @param rho Fluid density (kg/m³)
 * @returns Power (W)
 */
export function calculatePumpPower(q: number, h: number, efficiency: number, rho: number = 1000): number {
  if (efficiency <= 0 || efficiency > 1) {
    throw new Error('Efficiency must be between 0 and 1');
  }
  if (rho <= 0) {
    throw new Error('Density must be positive');
  }

  const g = 9.81; // m/s²
  const hydraulicPower = rho * g * q * h; // W
  return hydraulicPower / efficiency; // W
}

/**
 * Find operating point where pump curve intersects system curve
 * @param pumpCurve Pump curve function (q -> h)
 * @param systemCurve System curve function (q -> h)
 * @param qMin Minimum flow rate to search
 * @param qMax Maximum flow rate to search
 * @param tolerance Convergence tolerance
 * @returns Operating point {q, h}
 */
export function findOperatingPoint(
  pumpCurve: (q: number) => number,
  systemCurve: (q: number) => number,
  qMin: number,
  qMax: number,
  tolerance: number = 1e-6
): { q: number; h: number } {
  if (qMin >= qMax) {
    throw new Error('qMin must be less than qMax');
  }

  // Use bisection method to find intersection
  let a = qMin;
  let b = qMax;
  let fa = pumpCurve(a) - systemCurve(a);
  let fb = pumpCurve(b) - systemCurve(b);

  if (fa * fb > 0) {
    throw new Error('No intersection found in the specified range');
  }

  while (b - a > tolerance) {
    const c = (a + b) / 2;
    const fc = pumpCurve(c) - systemCurve(c);

    if (Math.abs(fc) < tolerance) {
      return { q: c, h: pumpCurve(c) };
    }

    if (fa * fc < 0) {
      b = c;
      fb = fc;
    } else {
      a = c;
      fa = fc;
    }
  }

  const q = (a + b) / 2;
  return { q, h: pumpCurve(q) };
}

/**
 * Validate pump curve data
 * @param curve Pump curve to validate
 * @returns Validation result
 */
export function validatePumpCurve(curve: PumpCurve): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!curve.points || curve.points.length === 0) {
    errors.push('Curve must have at least one point');
    return { isValid: false, errors };
  }

  if (curve.points.length < 2) {
    errors.push('Curve must have at least 2 points for interpolation');
  }

  // Check for negative values
  for (let i = 0; i < curve.points.length; i++) {
    const point = curve.points[i];
    if (point.q < 0) {
      errors.push(`Point ${i}: Flow rate cannot be negative`);
    }
    if (point.h < 0) {
      errors.push(`Point ${i}: Head cannot be negative`);
    }
    if (point.efficiency !== undefined && (point.efficiency < 0 || point.efficiency > 1)) {
      errors.push(`Point ${i}: Efficiency must be between 0 and 1`);
    }
  }

  // Check for duplicate flow rates
  const flowRates = curve.points.map(p => p.q).sort((a, b) => a - b);
  for (let i = 1; i < flowRates.length; i++) {
    if (Math.abs(flowRates[i] - flowRates[i - 1]) < 1e-10) {
      errors.push('Curve contains duplicate flow rates');
      break;
    }
  }

  return { isValid: errors.length === 0, errors };
}
