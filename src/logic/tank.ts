import { Quantity } from '@/schemas/common';
import { convert } from '@/utils/units';
import { Warning } from '@/utils/guardrails';

export interface TankGeometry {
  area: Quantity; // m² (cross-sectional area)
  initialLevel?: Quantity; // m (initial liquid level)
  maxLevel?: Quantity; // m (maximum level)
  minLevel?: Quantity; // m (minimum level)
}

export interface InflowCurve {
  type: 'constant' | 'curve' | 'function';
  value?: Quantity; // m³/s (for constant flow)
  curve?: Array<{
    time: number; // s
    flow: Quantity; // m³/s
  }>;
  function?: string; // Mathematical expression (future enhancement)
}

export interface OutflowCurve {
  type: 'orifice' | 'pump' | 'constant';
  orifice?: {
    coefficient: number; // Discharge coefficient (0-1)
    area: Quantity; // m² (orifice area)
  };
  pump?: {
    curve: Array<{
      head: number; // m
      flow: Quantity; // m³/s
    }>;
    onOffControl?: {
      highLevel: Quantity; // m (turn off at this level)
      lowLevel: Quantity; // m (turn on at this level)
    };
  };
  constant?: {
    flow: Quantity; // m³/s
  };
}

export interface TankSimulationInput {
  tank: TankGeometry;
  inflow: InflowCurve;
  outflow: OutflowCurve;
  simulation: {
    endTime: Quantity; // s
    timeStep: Quantity; // s
  };
}

export interface TimeSeriesPoint {
  time: number; // s
  level: number; // m
  inflow: number; // m³/s
  outflow: number; // m³/s
  pumpOn: boolean; // For pump outflow
}

export interface TankSimulationResult {
  timeSeries: TimeSeriesPoint[];
  summary: {
    finalLevel: number; // m
    maxLevel: number; // m
    minLevel: number; // m
    averageInflow: number; // m³/s
    averageOutflow: number; // m³/s
    overflow: boolean;
    empty: boolean;
  };
  warnings: (string | Warning)[];
  metadata: {
    input: TankSimulationInput;
    calculations: {
      totalSteps: number;
      simulationTime: number;
    };
  };
}

/**
 * Calculate orifice flow rate using orifice equation
 * Q = C * A * sqrt(2 * g * H)
 * @param coefficient - Discharge coefficient
 * @param area - Orifice area (m²)
 * @param head - Head above orifice (m)
 * @returns Flow rate (m³/s)
 */
export function calculateOrificeFlow(
  coefficient: number,
  area: number,
  head: number
): number {
  if (coefficient <= 0 || coefficient > 1) {
    throw new Error('Discharge coefficient must be between 0 and 1');
  }
  if (area <= 0) {
    throw new Error('Orifice area must be positive');
  }
  if (head < 0) {
    return 0; // No flow if head is negative
  }

  const g = 9.81; // m/s²
  return coefficient * area * Math.sqrt(2 * g * head);
}

/**
 * Interpolate flow from curve based on time
 * @param curve - Array of {time, flow} points
 * @param time - Current time (s)
 * @returns Flow rate (m³/s)
 */
export function interpolateInflowCurve(
  curve: Array<{ time: number; flow: Quantity }>,
  time: number
): number {
  if (curve.length === 0) {
    return 0;
  }

  // Sort curve by time
  const sortedCurve = [...curve].sort((a, b) => a.time - b.time);

  // Handle extrapolation
  if (time <= sortedCurve[0].time) {
    return convert(sortedCurve[0].flow, 'm³/s').value;
  }
  if (time >= sortedCurve[sortedCurve.length - 1].time) {
    return convert(sortedCurve[sortedCurve.length - 1].flow, 'm³/s').value;
  }

  // Find the segment containing time
  let i = 0;
  for (i = 0; i < sortedCurve.length - 1; i++) {
    if (time >= sortedCurve[i].time && time <= sortedCurve[i + 1].time) {
      break;
    }
  }

  const t0 = sortedCurve[i].time;
  const q0 = convert(sortedCurve[i].flow, 'm³/s').value;
  const t1 = sortedCurve[i + 1].time;
  const q1 = convert(sortedCurve[i + 1].flow, 'm³/s').value;

  // Linear interpolation
  const t = (time - t0) / (t1 - t0);
  return q0 + t * (q1 - q0);
}

/**
 * Interpolate pump flow from curve based on head
 * @param curve - Array of {head, flow} points
 * @param head - Current head (m)
 * @returns Flow rate (m³/s)
 */
export function interpolatePumpCurve(
  curve: Array<{ head: number; flow: Quantity }>,
  head: number
): number {
  if (curve.length === 0) {
    return 0;
  }

  // Sort curve by head (descending for pump curve)
  const sortedCurve = [...curve].sort((a, b) => b.head - a.head);

  // Handle extrapolation
  if (head >= sortedCurve[0].head) {
    return convert(sortedCurve[0].flow, 'm³/s').value;
  }
  if (head <= sortedCurve[sortedCurve.length - 1].head) {
    return convert(sortedCurve[sortedCurve.length - 1].flow, 'm³/s').value;
  }

  // Find the segment containing head
  let i = 0;
  for (i = 0; i < sortedCurve.length - 1; i++) {
    if (head <= sortedCurve[i].head && head >= sortedCurve[i + 1].head) {
      break;
    }
  }

  const h0 = sortedCurve[i].head;
  const q0 = convert(sortedCurve[i].flow, 'm³/s').value;
  const h1 = sortedCurve[i + 1].head;
  const q1 = convert(sortedCurve[i + 1].flow, 'm³/s').value;

  // Linear interpolation
  const t = (head - h0) / (h1 - h0);
  return q0 + t * (q1 - q0);
}

/**
 * Calculate outflow based on current level and outflow configuration
 * @param outflow - Outflow configuration
 * @param level - Current tank level (m)
 * @param pumpOn - Current pump state
 * @returns Flow rate (m³/s)
 */
export function calculateOutflow(
  outflow: OutflowCurve,
  level: number,
  pumpOn: boolean = true
): number {
  switch (outflow.type) {
    case 'orifice':
      if (!outflow.orifice) {
        throw new Error('Orifice configuration required for orifice outflow');
      }
      const orificeArea = convert(outflow.orifice.area, 'm²').value;
      return calculateOrificeFlow(
        outflow.orifice.coefficient,
        orificeArea,
        level
      );

    case 'pump':
      if (!outflow.pump) {
        throw new Error('Pump configuration required for pump outflow');
      }
      if (!pumpOn) {
        return 0;
      }
      return interpolatePumpCurve(outflow.pump.curve, level);

    case 'constant':
      if (!outflow.constant) {
        throw new Error(
          'Constant flow configuration required for constant outflow'
        );
      }
      return convert(outflow.constant.flow, 'm³/s').value;

    default:
      throw new Error(`Unknown outflow type: ${outflow.type}`);
  }
}

/**
 * Determine pump on/off state based on level and control settings
 * @param outflow - Outflow configuration
 * @param level - Current tank level (m)
 * @param currentPumpState - Current pump state
 * @returns New pump state
 */
export function determinePumpState(
  outflow: OutflowCurve,
  level: number,
  currentPumpState: boolean
): boolean {
  if (outflow.type !== 'pump' || !outflow.pump?.onOffControl) {
    return currentPumpState;
  }

  const { highLevel, lowLevel } = outflow.pump.onOffControl;
  const highLevelValue = convert(highLevel, 'm').value;
  const lowLevelValue = convert(lowLevel, 'm').value;

  if (currentPumpState) {
    // Pump is on - turn off if level drops below low level
    return level > lowLevelValue;
  } else {
    // Pump is off - turn on if level rises above high level
    return level >= highLevelValue;
  }
}

/**
 * Simulate tank level changes over time
 * @param input - Tank simulation input parameters
 * @returns Tank simulation result with time series data
 */
export function simulateTank(input: TankSimulationInput): TankSimulationResult {
  const warnings: (string | Warning)[] = [];

  // Convert input parameters to SI units
  const tankArea = convert(input.tank.area, 'm²').value;
  const initialLevel = input.tank.initialLevel
    ? convert(input.tank.initialLevel, 'm').value
    : 0;
  const maxLevel = input.tank.maxLevel
    ? convert(input.tank.maxLevel, 'm').value
    : Infinity;
  const minLevel = input.tank.minLevel
    ? convert(input.tank.minLevel, 'm').value
    : 0;
  const endTime = convert(input.simulation.endTime, 's').value;
  const timeStep = convert(input.simulation.timeStep, 's').value;

  // Validate inputs
  if (tankArea <= 0) {
    throw new Error('Tank area must be positive');
  }
  if (endTime <= 0) {
    throw new Error('End time must be positive');
  }
  if (timeStep <= 0) {
    throw new Error('Time step must be positive');
  }
  if (timeStep > endTime) {
    throw new Error('Time step cannot be greater than end time');
  }
  if (initialLevel < minLevel || initialLevel > maxLevel) {
    throw new Error('Initial level must be within tank bounds');
  }

  // Initialize simulation
  const timeSeries: TimeSeriesPoint[] = [];
  let currentLevel = initialLevel;
  let pumpOn = true; // Default to on, will be corrected by determinePumpState

  // Calculate number of steps
  const totalSteps = Math.ceil(endTime / timeStep);

  // Run simulation
  for (let step = 0; step <= totalSteps; step++) {
    const time = step * timeStep;

    // Calculate inflow
    let inflow = 0;
    switch (input.inflow.type) {
      case 'constant':
        if (input.inflow.value) {
          inflow = convert(input.inflow.value, 'm³/s').value;
        }
        break;
      case 'curve':
        if (input.inflow.curve) {
          inflow = interpolateInflowCurve(input.inflow.curve, time);
        }
        break;
      case 'function':
        // Future enhancement for mathematical functions
        warnings.push({
          type: 'general',
          message: 'Function-based inflow not yet implemented',
          severity: 'medium',
        });
        break;
    }

    // Determine pump state
    pumpOn = determinePumpState(input.outflow, currentLevel, pumpOn);

    // Calculate outflow
    const outflow = calculateOutflow(input.outflow, currentLevel, pumpOn);

    // Record current state
    timeSeries.push({
      time,
      level: currentLevel,
      inflow,
      outflow,
      pumpOn,
    });

    // Update level for next step (except for last step)
    if (step < totalSteps) {
      const netFlow = inflow - outflow;
      const levelChange = (netFlow * timeStep) / tankArea;
      currentLevel += levelChange;

      // Apply bounds
      currentLevel = Math.max(minLevel, Math.min(maxLevel, currentLevel));
    }
  }

  // Calculate summary statistics
  const levels = timeSeries.map(point => point.level);
  const inflows = timeSeries.map(point => point.inflow);
  const outflows = timeSeries.map(point => point.outflow);

  const finalLevel = levels[levels.length - 1];
  const maxLevelReached = Math.max(...levels);
  const minLevelReached = Math.min(...levels);
  const averageInflow =
    inflows.reduce((sum, flow) => sum + flow, 0) / inflows.length;
  const averageOutflow =
    outflows.reduce((sum, flow) => sum + flow, 0) / outflows.length;

  const overflow = maxLevelReached >= maxLevel;
  const empty = minLevelReached <= minLevel;

  // Add warnings
  if (overflow) {
    warnings.push({
      type: 'general',
      message: 'Tank overflow detected during simulation',
      severity: 'high',
    });
  }

  if (empty) {
    warnings.push({
      type: 'general',
      message: 'Tank empty condition detected during simulation',
      severity: 'high',
    });
  }

  if (timeStep > endTime / 100) {
    warnings.push({
      type: 'general',
      message: 'Time step may be too large for accurate simulation',
      severity: 'medium',
    });
  }

  return {
    timeSeries,
    summary: {
      finalLevel,
      maxLevel: maxLevelReached,
      minLevel: minLevelReached,
      averageInflow,
      averageOutflow,
      overflow,
      empty,
    },
    warnings,
    metadata: {
      input,
      calculations: {
        totalSteps,
        simulationTime: endTime,
      },
    },
  };
}
