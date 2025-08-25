import { Quantity } from '@/schemas/common';
import { convert } from '@/utils/units';
import { Warning } from '@/utils/guardrails';

export interface LoadProfilePoint {
  hours: number; // hours per year at this operating point
  Qset: Quantity; // flow rate setpoint
  speed?: number; // pump speed ratio (0-1), optional
}

export interface EnergyTariff {
  rate: number; // $/kWh
  name?: string;
  description?: string;
}

export interface PumpEfficiencyData {
  pumpEfficiency: number; // 0-1
  motorEfficiency: number; // 0-1
  vfdEfficiency?: number; // 0-1, optional
}

export interface PowerCalculationResult {
  power: Quantity; // W
  efficiency: {
    pump: number;
    motor: number;
    vfd?: number;
    total: number;
  };
  breakdown: {
    hydraulicPower: Quantity; // W
    pumpLosses: Quantity; // W
    motorLosses: Quantity; // W
    vfdLosses?: Quantity; // W
  };
}

export interface AnnualEnergyResult {
  totalEnergy: Quantity; // kWh/year
  totalCost: Quantity; // $/year
  averagePower: Quantity; // W
  loadProfile: Array<{
    hours: number;
    Qset: Quantity;
    speed?: number;
    power: Quantity;
    energy: Quantity; // kWh
    cost: Quantity; // $
  }>;
  efficiency: {
    averagePumpEfficiency: number;
    averageMotorEfficiency: number;
    averageVfdEfficiency?: number;
    averageTotalEfficiency: number;
  };
  warnings: (string | Warning)[];
  metadata: {
    tariff: EnergyTariff;
    totalHours: number;
    operatingPoints: number;
  };
}

export interface EnergyCalculationInput {
  fluid: {
    density: Quantity;
    name?: string;
  };
  pumpEfficiency: number;
  motorEfficiency: number;
  vfdEfficiency?: number;
  loadProfile: LoadProfilePoint[];
  tariff: EnergyTariff;
  head: Quantity; // constant head assumption for simplicity
}

/**
 * Calculate wire-to-water efficiency from component efficiencies
 * @param pumpEfficiency Pump efficiency (0-1)
 * @param motorEfficiency Motor efficiency (0-1)
 * @param vfdEfficiency VFD efficiency (0-1), optional
 * @returns Total wire-to-water efficiency
 */
export function wireToWaterEfficiency(
  pumpEfficiency: number,
  motorEfficiency: number,
  vfdEfficiency?: number
): number {
  if (pumpEfficiency <= 0 || pumpEfficiency > 1) {
    throw new Error('Pump efficiency must be between 0 and 1');
  }
  
  if (motorEfficiency <= 0 || motorEfficiency > 1) {
    throw new Error('Motor efficiency must be between 0 and 1');
  }
  
  if (vfdEfficiency !== undefined) {
    if (vfdEfficiency <= 0 || vfdEfficiency > 1) {
      throw new Error('VFD efficiency must be between 0 and 1');
    }
    return pumpEfficiency * motorEfficiency * vfdEfficiency;
  }
  
  return pumpEfficiency * motorEfficiency;
}

/**
 * Calculate power consumption for pump operation
 * @param rho Fluid density (kg/m³)
 * @param g Gravitational acceleration (m/s²)
 * @param Q Flow rate (m³/s)
 * @param H Head (m)
 * @param totalEfficiency Total wire-to-water efficiency
 * @returns Power consumption (W)
 */
export function calculatePower(
  rho: number,
  g: number,
  Q: number,
  H: number,
  totalEfficiency: number
): number {
  if (totalEfficiency <= 0) {
    throw new Error('Total efficiency must be positive');
  }
  
  // P = ρ g Q H / η
  return (rho * g * Q * H) / totalEfficiency;
}

/**
 * Calculate power with detailed breakdown
 * @param rho Fluid density (kg/m³)
 * @param g Gravitational acceleration (m/s²)
 * @param Q Flow rate (m³/s)
 * @param H Head (m)
 * @param efficiencies Component efficiencies
 * @returns Power calculation result with breakdown
 */
export function calculatePowerWithBreakdown(
  rho: number,
  g: number,
  Q: number,
  H: number,
  efficiencies: PumpEfficiencyData
): PowerCalculationResult {
  const g_standard = 9.81; // m/s²
  
  // Hydraulic power (theoretical)
  const hydraulicPower = rho * g_standard * Q * H;
  
  // Calculate total efficiency
  const totalEfficiency = wireToWaterEfficiency(
    efficiencies.pumpEfficiency,
    efficiencies.motorEfficiency,
    efficiencies.vfdEfficiency
  );
  
  // Total power consumption
  const totalPower = hydraulicPower / totalEfficiency;
  
  // Losses breakdown
  const pumpLosses = hydraulicPower * (1 - efficiencies.pumpEfficiency) / efficiencies.pumpEfficiency;
  const motorLosses = (hydraulicPower / efficiencies.pumpEfficiency) * (1 - efficiencies.motorEfficiency) / efficiencies.motorEfficiency;
  
  let vfdLosses: number | undefined;
  if (efficiencies.vfdEfficiency !== undefined) {
    vfdLosses = (hydraulicPower / (efficiencies.pumpEfficiency * efficiencies.motorEfficiency)) * 
                (1 - efficiencies.vfdEfficiency) / efficiencies.vfdEfficiency;
  }
  
  return {
    power: { value: totalPower, unit: 'W' },
    efficiency: {
      pump: efficiencies.pumpEfficiency,
      motor: efficiencies.motorEfficiency,
      vfd: efficiencies.vfdEfficiency,
      total: totalEfficiency,
    },
    breakdown: {
      hydraulicPower: { value: hydraulicPower, unit: 'W' },
      pumpLosses: { value: pumpLosses, unit: 'W' },
      motorLosses: { value: motorLosses, unit: 'W' },
      vfdLosses: vfdLosses ? { value: vfdLosses, unit: 'W' } : undefined,
    },
  };
}

/**
 * Calculate annual energy consumption and cost
 * @param loadProfile Array of operating points with hours and flow rates
 * @param tariff Energy tariff ($/kWh)
 * @param powerCalculator Function to calculate power for each operating point
 * @returns Annual energy analysis result
 */
export function calculateAnnualEnergy(
  loadProfile: LoadProfilePoint[],
  tariff: EnergyTariff,
  powerCalculator: (Q: number, speed?: number) => PowerCalculationResult
): AnnualEnergyResult {
  const warnings: (string | Warning)[] = [];
  
  // Validate load profile
  const totalHours = loadProfile.reduce((sum, point) => sum + point.hours, 0);
  if (totalHours > 8760) {
    warnings.push('Load profile exceeds 8760 hours per year');
  }
  
  if (totalHours < 8760 * 0.5) {
    warnings.push('Load profile covers less than 50% of the year');
  }
  
  // Calculate energy for each operating point
  const profileResults = loadProfile.map(point => {
    const Q_value = convert(point.Qset, 'm³/s').value;
    const powerResult = powerCalculator(Q_value, point.speed);
    const energy_kWh = (powerResult.power.value * point.hours) / 1000; // Convert W·h to kWh
    const cost = energy_kWh * tariff.rate;
    
    return {
      hours: point.hours,
      Qset: point.Qset,
      speed: point.speed,
      power: powerResult.power,
      energy: { value: energy_kWh, unit: 'kWh' },
      cost: { value: cost, unit: '$' },
    };
  });
  
  // Calculate totals
  const totalEnergy = profileResults.reduce((sum, point) => sum + point.energy.value, 0);
  const totalCost = profileResults.reduce((sum, point) => sum + point.cost.value, 0);
  const averagePower = totalEnergy * 1000 / totalHours; // Convert kWh to W·h, then divide by hours
  
  // Calculate average efficiencies (weighted by energy consumption)
  const totalEnergyWeighted = profileResults.reduce((sum, point) => sum + point.energy.value, 0);
  
  let avgPumpEfficiency = 0;
  let avgMotorEfficiency = 0;
  let avgVfdEfficiency = 0;
  let avgTotalEfficiency = 0;
  
  profileResults.forEach((point, index) => {
    const Q_value = convert(point.Qset, 'm³/s').value;
    const powerResult = powerCalculator(Q_value, point.speed);
    const weight = point.energy.value / totalEnergyWeighted;
    
    avgPumpEfficiency += powerResult.efficiency.pump * weight;
    avgMotorEfficiency += powerResult.efficiency.motor * weight;
    if (powerResult.efficiency.vfd !== undefined) {
      avgVfdEfficiency += powerResult.efficiency.vfd * weight;
    }
    avgTotalEfficiency += powerResult.efficiency.total * weight;
  });
  
  // Generate efficiency warnings
  if (avgTotalEfficiency < 0.5) {
    warnings.push(`Low average efficiency: ${(avgTotalEfficiency * 100).toFixed(1)}%`);
  }
  
  if (avgPumpEfficiency < 0.6) {
    warnings.push(`Low pump efficiency: ${(avgPumpEfficiency * 100).toFixed(1)}%`);
  }
  
  if (avgMotorEfficiency < 0.8) {
    warnings.push(`Low motor efficiency: ${(avgMotorEfficiency * 100).toFixed(1)}%`);
  }
  
  return {
    totalEnergy: { value: totalEnergy, unit: 'kWh/year' },
    totalCost: { value: totalCost, unit: '$/year' },
    averagePower: { value: averagePower, unit: 'W' },
    loadProfile: profileResults,
    efficiency: {
      averagePumpEfficiency: avgPumpEfficiency,
      averageMotorEfficiency: avgMotorEfficiency,
      averageVfdEfficiency: avgVfdEfficiency > 0 ? avgVfdEfficiency : undefined,
      averageTotalEfficiency: avgTotalEfficiency,
    },
    warnings,
    metadata: {
      tariff,
      totalHours,
      operatingPoints: loadProfile.length,
    },
  };
}

/**
 * Calculate annual energy for a pump system
 * @param input Energy calculation input parameters
 * @returns Annual energy analysis result
 */
export function calculatePumpEnergy(input: EnergyCalculationInput): AnnualEnergyResult {
  const warnings: (string | Warning)[] = [];
  
  // Extract and convert input values
  const rho = convert(input.fluid.density, 'kg/m³').value;
  const H = convert(input.head, 'm').value;
  const g = 9.81; // m/s²
  
  // Validate efficiencies
  if (input.pumpEfficiency <= 0 || input.pumpEfficiency > 1) {
    throw new Error('Pump efficiency must be between 0 and 1');
  }
  
  if (input.motorEfficiency <= 0 || input.motorEfficiency > 1) {
    throw new Error('Motor efficiency must be between 0 and 1');
  }
  
  if (input.vfdEfficiency !== undefined && (input.vfdEfficiency <= 0 || input.vfdEfficiency > 1)) {
    throw new Error('VFD efficiency must be between 0 and 1');
  }
  
  // Create power calculator function
  const powerCalculator = (Q: number, speed?: number): PowerCalculationResult => {
    // Apply speed scaling if provided
    let effectiveQ = Q;
    let effectiveH = H;
    
    if (speed !== undefined) {
      if (speed < 0 || speed > 1) {
        throw new Error('Speed ratio must be between 0 and 1');
      }
      // Affinity laws: Q ~ speed, H ~ speed²
      effectiveQ = Q * speed;
      effectiveH = H * speed * speed;
    }
    
    return calculatePowerWithBreakdown(
      rho,
      g,
      effectiveQ,
      effectiveH,
      {
        pumpEfficiency: input.pumpEfficiency,
        motorEfficiency: input.motorEfficiency,
        vfdEfficiency: input.vfdEfficiency,
      }
    );
  };
  
  // Calculate annual energy
  const result = calculateAnnualEnergy(input.loadProfile, input.tariff, powerCalculator);
  
  // Add fluid-specific warnings
  if (input.fluid.name === 'water' && rho < 990) {
    warnings.push('Water density below expected range - check temperature');
  }
  
  if (input.fluid.name === 'air' && rho > 1.3) {
    warnings.push('Air density above expected range - check pressure and temperature');
  }
  
  return {
    ...result,
    warnings: [...result.warnings, ...warnings],
  };
}

/**
 * Validate energy calculation inputs
 * @param input Energy calculation input
 * @returns Validation result
 */
export function validateEnergyInputs(input: EnergyCalculationInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!input.fluid.density || input.fluid.density.value <= 0) {
    errors.push('Fluid density must be positive');
  }
  
  if (!input.head || input.head.value <= 0) {
    errors.push('Head must be positive');
  }
  
  if (!input.loadProfile || input.loadProfile.length === 0) {
    errors.push('Load profile must have at least one operating point');
  }
  
  if (!input.tariff || input.tariff.rate <= 0) {
    errors.push('Energy tariff rate must be positive');
  }
  
  // Check load profile points
  if (input.loadProfile) {
    for (let i = 0; i < input.loadProfile.length; i++) {
      const point = input.loadProfile[i];
      
      if (point.hours <= 0) {
        errors.push(`Load profile point ${i + 1}: Hours must be positive`);
      }
      
      if (!point.Qset || point.Qset.value <= 0) {
        errors.push(`Load profile point ${i + 1}: Flow rate must be positive`);
      }
      
      if (point.speed !== undefined && (point.speed < 0 || point.speed > 1)) {
        errors.push(`Load profile point ${i + 1}: Speed ratio must be between 0 and 1`);
      }
    }
  }
  
  // Check total hours
  if (input.loadProfile) {
    const totalHours = input.loadProfile.reduce((sum, point) => sum + point.hours, 0);
    if (totalHours > 8760 * 1.1) { // Allow 10% tolerance
      errors.push('Total hours in load profile cannot exceed 9636 hours (8760 + 10%)');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}
