import { convert } from '@/utils/units';

export interface TankGeometry {
  volume: { value: number; unit: string };
  height?: { value: number; unit: string };
  diameter?: { value: number; unit: string };
  shape: 'cylindrical' | 'rectangular' | 'custom';
}

export interface FlowRate {
  type: 'constant' | 'variable';
  value?: { value: number; unit: string }; // For constant flow
  function?: string; // For variable flow (e.g., "Q(t) = 0.1 * (1 - t/3600)")
}

export interface FillDrainInput {
  tank: TankGeometry;
  flowRate: FlowRate;
  operation: 'fill' | 'drain';
  initialLevel?: { value: number; unit: string };
  targetLevel?: { value: number; unit: string };
  timeStep?: { value: number; unit: string };
}

export interface FillDrainResult {
  totalTime: { value: number; unit: 's' };
  averageFlowRate: { value: number; unit: 'm³/s' };
  volumeChange: { value: number; unit: 'm³' };
  timeHistory: Array<{
    time: number;
    level: number;
    volume: number;
    flowRate: number;
  }>;
  warnings: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  metadata: {
    input: FillDrainInput;
    calculations: {
      method: string;
      timeSteps: number;
      convergence: boolean;
    };
  };
}

/**
 * Calculate fill or drain time for a tank
 * @param input Tank geometry, flow rate, and operation parameters
 * @returns Fill/drain time calculation results
 */
export function computeFillDrainTime(input: FillDrainInput): FillDrainResult {
  const warnings: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }> = [];

  // Convert inputs to SI units
  const tankVolume = convert(input.tank.volume, 'm³').value;
  const timeStep = convert(
    input.timeStep ?? { value: 60, unit: 's' },
    's'
  ).value;

  let initialLevel = 0;
  let targetLevel = 1;

  if (input.initialLevel) {
    initialLevel = convert(input.initialLevel, 'm').value;
  }

  if (input.targetLevel) {
    targetLevel = convert(input.targetLevel, 'm').value;
  }

  // Validate inputs
  if (tankVolume <= 0) {
    throw new Error('Tank volume must be positive');
  }

  if (timeStep <= 0) {
    throw new Error('Time step must be positive');
  }

  if (initialLevel < 0 || targetLevel < 0) {
    throw new Error('Levels must be non-negative');
  }

  if (input.operation === 'fill' && initialLevel >= targetLevel) {
    throw new Error(
      'For fill operation, initial level must be less than target level'
    );
  }

  if (input.operation === 'drain' && initialLevel <= targetLevel) {
    throw new Error(
      'For drain operation, initial level must be greater than target level'
    );
  }

  const timeHistory: Array<{
    time: number;
    level: number;
    volume: number;
    flowRate: number;
  }> = [];

  let currentTime = 0;
  let currentLevel = initialLevel;
  let totalVolume = 0;
  let totalFlowTime = 0;

  // Calculate tank cross-sectional area based on shape
  let crossSectionalArea: number;

  if (input.tank.shape === 'cylindrical') {
    if (!input.tank.diameter) {
      throw new Error('Diameter is required for cylindrical tanks');
    }
    const diameter = convert(input.tank.diameter, 'm').value;
    crossSectionalArea = Math.PI * (diameter / 2) ** 2;
  } else if (input.tank.shape === 'rectangular') {
    if (!input.tank.height) {
      throw new Error('Height is required for rectangular tanks');
    }
    const height = convert(input.tank.height, 'm').value;
    crossSectionalArea = tankVolume / height;
  } else {
    // Custom shape - assume uniform cross-section
    if (!input.tank.height) {
      throw new Error('Height is required for custom tanks');
    }
    const height = convert(input.tank.height, 'm').value;
    crossSectionalArea = tankVolume / height;
  }

  // Maximum simulation time (24 hours)
  const maxTime = 24 * 3600;

  while (currentTime < maxTime) {
    // Calculate current volume
    const currentVolume = currentLevel * crossSectionalArea;

    // Get flow rate at current time
    let flowRate: number;

    if (input.flowRate.type === 'constant') {
      if (!input.flowRate.value) {
        throw new Error('Flow rate value is required for constant flow');
      }
      flowRate = convert(input.flowRate.value, 'm³/s').value;
    } else {
      // Variable flow rate - simple linear function for now
      // In a real implementation, this would parse and evaluate the function string
      if (!input.flowRate.function) {
        throw new Error('Flow rate function is required for variable flow');
      }

      // Simple example: Q(t) = Q0 * (1 - t/T)
      // For now, use a simple linear decrease
      const baseFlow = 0.1; // m³/s
      const timeConstant = 3600; // s
      flowRate = baseFlow * Math.max(0, 1 - currentTime / timeConstant);
    }

    // Apply operation direction
    if (input.operation === 'drain') {
      flowRate = -Math.abs(flowRate);
    } else {
      flowRate = Math.abs(flowRate);
    }

    // Check if flow rate is too small
    if (Math.abs(flowRate) < 1e-10) {
      warnings.push({
        type: 'flow_rate',
        message:
          'Flow rate is very small, operation may take a very long time.',
        severity: 'medium',
      });
      break;
    }

    // Calculate volume change in this time step
    const volumeChange = flowRate * timeStep;
    const newVolume = currentVolume + volumeChange;

    // Check for tank overflow/underflow
    if (newVolume > tankVolume) {
      warnings.push({
        type: 'tank_capacity',
        message: 'Tank would overflow. Operation stopped at tank capacity.',
        severity: 'high',
      });
      break;
    }

    if (newVolume < 0) {
      warnings.push({
        type: 'tank_capacity',
        message:
          'Tank would be completely drained. Operation stopped at empty tank.',
        severity: 'high',
      });
      break;
    }

    // Update level
    const newLevel = newVolume / crossSectionalArea;

    // Record time history
    timeHistory.push({
      time: currentTime,
      level: currentLevel,
      volume: currentVolume,
      flowRate: Math.abs(flowRate),
    });

    // Check if target level is reached
    if (input.operation === 'fill' && newLevel >= targetLevel) {
      // Interpolate to find exact time
      const levelDiff = targetLevel - currentLevel;
      const timeToTarget = (levelDiff / (newLevel - currentLevel)) * timeStep;
      currentTime += timeToTarget;

      timeHistory.push({
        time: currentTime,
        level: targetLevel,
        volume: targetLevel * crossSectionalArea,
        flowRate: Math.abs(flowRate),
      });

      totalVolume =
        targetLevel * crossSectionalArea - initialLevel * crossSectionalArea;
      totalFlowTime = currentTime;
      break;
    }

    if (input.operation === 'drain' && newLevel <= targetLevel) {
      // Interpolate to find exact time
      const levelDiff = currentLevel - targetLevel;
      const timeToTarget = (levelDiff / (currentLevel - newLevel)) * timeStep;
      currentTime += timeToTarget;

      timeHistory.push({
        time: currentTime,
        level: targetLevel,
        volume: targetLevel * crossSectionalArea,
        flowRate: Math.abs(flowRate),
      });

      totalVolume =
        initialLevel * crossSectionalArea - targetLevel * crossSectionalArea;
      totalFlowTime = currentTime;
      break;
    }

    // Update for next iteration
    currentTime += timeStep;
    currentLevel = newLevel;
    totalVolume += Math.abs(volumeChange);
    totalFlowTime += timeStep;
  }

  // Check if operation didn't complete
  if (currentTime >= maxTime) {
    warnings.push({
      type: 'time_limit',
      message:
        'Operation did not complete within 24 hours. Consider increasing flow rate or checking parameters.',
      severity: 'high',
    });
  }

  // Calculate average flow rate
  const averageFlowRate = totalVolume / totalFlowTime;

  return {
    totalTime: { value: totalFlowTime, unit: 's' },
    averageFlowRate: { value: averageFlowRate, unit: 'm³/s' },
    volumeChange: { value: totalVolume, unit: 'm³' },
    timeHistory,
    warnings,
    metadata: {
      input,
      calculations: {
        method:
          input.flowRate.type === 'constant'
            ? 'Constant flow rate'
            : 'Variable flow rate',
        timeSteps: timeHistory.length,
        convergence: currentTime < maxTime,
      },
    },
  };
}
