import { describe, it, expect } from 'vitest';
import {
  wireToWaterEfficiency,
  calculatePower,
  calculatePowerWithBreakdown,
  calculateAnnualEnergy,
  calculatePumpEnergy,
  validateEnergyInputs,
  LoadProfilePoint,
  EnergyTariff,
  PumpEfficiencyData,
} from './energy';

describe('Energy Logic', () => {
  const sampleLoadProfile: LoadProfilePoint[] = [
    {
      hours: 4000,
      Qset: { value: 0.1, unit: 'm³/s' },
    },
    {
      hours: 3000,
      Qset: { value: 0.15, unit: 'm³/s' },
    },
    {
      hours: 1760,
      Qset: { value: 0.05, unit: 'm³/s' },
    },
  ];

  const sampleTariff: EnergyTariff = {
    rate: 0.12,
    name: 'Residential',
    description: 'Typical residential rate',
  };

  describe('wireToWaterEfficiency', () => {
    it('should calculate efficiency without VFD', () => {
      const pumpEff = 0.75;
      const motorEff = 0.9;

      const totalEff = wireToWaterEfficiency(pumpEff, motorEff);

      expect(totalEff).toBe(0.675); // 0.75 * 0.90
    });

    it('should calculate efficiency with VFD', () => {
      const pumpEff = 0.75;
      const motorEff = 0.9;
      const vfdEff = 0.95;

      const totalEff = wireToWaterEfficiency(pumpEff, motorEff, vfdEff);

      expect(totalEff).toBeCloseTo(0.641, 3); // 0.75 * 0.90 * 0.95
    });

    it('should throw error for invalid pump efficiency', () => {
      expect(() => wireToWaterEfficiency(0, 0.9)).toThrow(
        'Pump efficiency must be between 0 and 1'
      );
      expect(() => wireToWaterEfficiency(1.1, 0.9)).toThrow(
        'Pump efficiency must be between 0 and 1'
      );
    });

    it('should throw error for invalid motor efficiency', () => {
      expect(() => wireToWaterEfficiency(0.75, 0)).toThrow(
        'Motor efficiency must be between 0 and 1'
      );
      expect(() => wireToWaterEfficiency(0.75, 1.1)).toThrow(
        'Motor efficiency must be between 0 and 1'
      );
    });

    it('should throw error for invalid VFD efficiency', () => {
      expect(() => wireToWaterEfficiency(0.75, 0.9, 0)).toThrow(
        'VFD efficiency must be between 0 and 1'
      );
      expect(() => wireToWaterEfficiency(0.75, 0.9, 1.1)).toThrow(
        'VFD efficiency must be between 0 and 1'
      );
    });
  });

  describe('calculatePower', () => {
    it('should calculate power correctly', () => {
      const rho = 998; // kg/m³ (water)
      const g = 9.81; // m/s²
      const Q = 0.1; // m³/s
      const H = 20; // m
      const efficiency = 0.75;

      const power = calculatePower(rho, g, Q, H, efficiency);

      // Manual calculation: P = ρ g Q H / η
      // P = 998 * 9.81 * 0.1 * 20 / 0.75 = 26,108 W
      expect(power).toBeCloseTo(26108, 0);
    });

    it('should throw error for zero efficiency', () => {
      expect(() => calculatePower(998, 9.81, 0.1, 20, 0)).toThrow(
        'Total efficiency must be positive'
      );
    });

    it('should throw error for negative efficiency', () => {
      expect(() => calculatePower(998, 9.81, 0.1, 20, -0.1)).toThrow(
        'Total efficiency must be positive'
      );
    });
  });

  describe('calculatePowerWithBreakdown', () => {
    const efficiencies: PumpEfficiencyData = {
      pumpEfficiency: 0.75,
      motorEfficiency: 0.9,
    };

    it('should calculate power with breakdown without VFD', () => {
      const rho = 998;
      const g = 9.81;
      const Q = 0.1;
      const H = 20;

      const result = calculatePowerWithBreakdown(rho, g, Q, H, efficiencies);

      expect(result.power.value).toBeCloseTo(29009, 0);
      expect(result.efficiency.total).toBe(0.675);
      expect(result.efficiency.pump).toBe(0.75);
      expect(result.efficiency.motor).toBe(0.9);
      expect(result.efficiency.vfd).toBeUndefined();

      // Check breakdown
      expect(result.breakdown.hydraulicPower.value).toBeCloseTo(19581, 0); // ρ g Q H
      expect(result.breakdown.pumpLosses.value).toBeGreaterThan(0);
      expect(result.breakdown.motorLosses.value).toBeGreaterThan(0);
      expect(result.breakdown.vfdLosses).toBeUndefined();
    });

    it('should calculate power with breakdown with VFD', () => {
      const efficienciesWithVFD: PumpEfficiencyData = {
        pumpEfficiency: 0.75,
        motorEfficiency: 0.9,
        vfdEfficiency: 0.95,
      };

      const rho = 998;
      const g = 9.81;
      const Q = 0.1;
      const H = 20;

      const result = calculatePowerWithBreakdown(
        rho,
        g,
        Q,
        H,
        efficienciesWithVFD
      );

      expect(result.power.value).toBeCloseTo(30535, 0); // Higher due to VFD losses
      expect(result.efficiency.total).toBeCloseTo(0.641, 3);
      expect(result.efficiency.vfd).toBe(0.95);
      expect(result.breakdown.vfdLosses).toBeDefined();
      expect(result.breakdown.vfdLosses!.value).toBeGreaterThan(0);
    });

    it('should handle different fluid densities', () => {
      const rho_air = 1.225; // kg/m³ (air)
      const g = 9.81;
      const Q = 0.1;
      const H = 20;

      const result = calculatePowerWithBreakdown(
        rho_air,
        g,
        Q,
        H,
        efficiencies
      );

      // Air power should be much lower than water power
      expect(result.power.value).toBeLessThan(1000);
      expect(result.breakdown.hydraulicPower.value).toBeLessThan(1000);
    });
  });

  describe('calculateAnnualEnergy', () => {
    it('should calculate annual energy for simple load profile', () => {
      const simpleProfile: LoadProfilePoint[] = [
        {
          hours: 8760,
          Qset: { value: 0.1, unit: 'm³/s' },
        },
      ];

      const powerCalculator = (Q: number) => ({
        power: { value: 1000, unit: 'W' },
        efficiency: { pump: 0.75, motor: 0.9, total: 0.675 },
        breakdown: {
          hydraulicPower: { value: 750, unit: 'W' },
          pumpLosses: { value: 250, unit: 'W' },
          motorLosses: { value: 111, unit: 'W' },
        },
      });

      const result = calculateAnnualEnergy(
        simpleProfile,
        sampleTariff,
        powerCalculator
      );

      expect(result.totalEnergy.value).toBe(8760); // 1000W * 8760h / 1000 = 8760 kWh
      expect(result.totalCost.value).toBe(1051.2); // 8760 * 0.12
      expect(result.averagePower.value).toBe(1000);
      expect(result.loadProfile).toHaveLength(1);
      expect(result.metadata.totalHours).toBe(8760);
    });

    it('should calculate annual energy for complex load profile', () => {
      const complexProfile: LoadProfilePoint[] = [
        {
          hours: 4000,
          Qset: { value: 0.1, unit: 'm³/s' },
        },
        {
          hours: 3000,
          Qset: { value: 0.15, unit: 'm³/s' },
        },
        {
          hours: 1760,
          Qset: { value: 0.05, unit: 'm³/s' },
        },
      ];

      const powerCalculator = (Q: number) => ({
        power: { value: Q * 10000, unit: 'W' }, // Power proportional to flow
        efficiency: { pump: 0.75, motor: 0.9, total: 0.675 },
        breakdown: {
          hydraulicPower: { value: Q * 7500, unit: 'W' },
          pumpLosses: { value: Q * 2500, unit: 'W' },
          motorLosses: { value: Q * 1111, unit: 'W' },
        },
      });

      const result = calculateAnnualEnergy(
        complexProfile,
        sampleTariff,
        powerCalculator
      );

      // Expected calculations:
      // Point 1: 0.1 m³/s * 10000 W/(m³/s) * 4000 h / 1000 = 4000 kWh
      // Point 2: 0.15 m³/s * 10000 W/(m³/s) * 3000 h / 1000 = 4500 kWh
      // Point 3: 0.05 m³/s * 10000 W/(m³/s) * 1760 h / 1000 = 880 kWh
      // Total: 4000 + 4500 + 880 = 9380 kWh

      expect(result.totalEnergy.value).toBe(9380);
      expect(result.totalCost.value).toBe(1125.6); // 9380 * 0.12
      expect(result.loadProfile).toHaveLength(3);
      expect(result.metadata.totalHours).toBe(8760);
    });

    it('should generate warnings for incomplete load profile', () => {
      const incompleteProfile: LoadProfilePoint[] = [
        {
          hours: 4000,
          Qset: { value: 0.1, unit: 'm³/s' },
        },
      ];

      const powerCalculator = (Q: number) => ({
        power: { value: 1000, unit: 'W' },
        efficiency: { pump: 0.75, motor: 0.9, total: 0.675 },
        breakdown: {
          hydraulicPower: { value: 750, unit: 'W' },
          pumpLosses: { value: 250, unit: 'W' },
          motorLosses: { value: 111, unit: 'W' },
        },
      });

      const result = calculateAnnualEnergy(
        incompleteProfile,
        sampleTariff,
        powerCalculator
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some(w => typeof w === 'string' && w.includes('50%'))
      ).toBe(true);
    });

    it('should generate warnings for excessive hours', () => {
      const excessiveProfile: LoadProfilePoint[] = [
        {
          hours: 9000,
          Qset: { value: 0.1, unit: 'm³/s' },
        },
      ];

      const powerCalculator = (Q: number) => ({
        power: { value: 1000, unit: 'W' },
        efficiency: { pump: 0.75, motor: 0.9, total: 0.675 },
        breakdown: {
          hydraulicPower: { value: 750, unit: 'W' },
          pumpLosses: { value: 250, unit: 'W' },
          motorLosses: { value: 111, unit: 'W' },
        },
      });

      const result = calculateAnnualEnergy(
        excessiveProfile,
        sampleTariff,
        powerCalculator
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some(w => typeof w === 'string' && w.includes('8760'))
      ).toBe(true);
    });
  });

  describe('calculatePumpEnergy', () => {
    const sampleInput = {
      fluid: {
        density: { value: 998, unit: 'kg/m³' },
        name: 'water',
      },
      pumpEfficiency: 0.75,
      motorEfficiency: 0.9,
      loadProfile: sampleLoadProfile,
      tariff: sampleTariff,
      head: { value: 20, unit: 'm' },
    };

    it('should calculate pump energy for water', () => {
      const result = calculatePumpEnergy(sampleInput);

      expect(result.totalEnergy.value).toBeGreaterThan(0);
      expect(result.totalCost.value).toBeGreaterThan(0);
      expect(result.averagePower.value).toBeGreaterThan(0);
      expect(result.loadProfile).toHaveLength(3);
      expect(result.efficiency.averageTotalEfficiency).toBeGreaterThan(0);
      expect(result.efficiency.averageTotalEfficiency).toBeLessThan(1);
    });

    it('should handle VFD efficiency', () => {
      const inputWithVFD = {
        ...sampleInput,
        vfdEfficiency: 0.95,
      };

      const result = calculatePumpEnergy(inputWithVFD);

      expect(result.efficiency.averageVfdEfficiency).toBe(0.95);
      expect(result.efficiency.averageTotalEfficiency).toBeLessThan(0.675); // Should be lower due to VFD
    });

    it('should handle speed variations', () => {
      const loadProfileWithSpeed: LoadProfilePoint[] = [
        {
          hours: 4000,
          Qset: { value: 0.1, unit: 'm³/s' },
          speed: 1.0,
        },
        {
          hours: 3000,
          Qset: { value: 0.1, unit: 'm³/s' },
          speed: 0.5,
        },
        {
          hours: 1760,
          Qset: { value: 0.1, unit: 'm³/s' },
          speed: 0.25,
        },
      ];

      const inputWithSpeed = {
        ...sampleInput,
        loadProfile: loadProfileWithSpeed,
      };

      const result = calculatePumpEnergy(inputWithSpeed);

      expect(result.totalEnergy.value).toBeGreaterThan(0);
      expect(result.loadProfile).toHaveLength(3);

      // Lower speeds should result in lower power consumption
      const powers = result.loadProfile.map(p => p.power.value);
      expect(powers[0]).toBeGreaterThan(powers[1]); // Full speed > half speed
      expect(powers[1]).toBeGreaterThan(powers[2]); // Half speed > quarter speed
    });

    it('should throw error for invalid pump efficiency', () => {
      const invalidInput = {
        ...sampleInput,
        pumpEfficiency: 1.1,
      };

      expect(() => calculatePumpEnergy(invalidInput)).toThrow(
        'Pump efficiency must be between 0 and 1'
      );
    });

    it('should throw error for invalid motor efficiency', () => {
      const invalidInput = {
        ...sampleInput,
        motorEfficiency: -0.1,
      };

      expect(() => calculatePumpEnergy(invalidInput)).toThrow(
        'Motor efficiency must be between 0 and 1'
      );
    });

    it('should throw error for invalid VFD efficiency', () => {
      const invalidInput = {
        ...sampleInput,
        vfdEfficiency: 1.5,
      };

      expect(() => calculatePumpEnergy(invalidInput)).toThrow(
        'VFD efficiency must be between 0 and 1'
      );
    });

    it('should throw error for invalid speed ratio', () => {
      const loadProfileWithInvalidSpeed: LoadProfilePoint[] = [
        {
          hours: 4000,
          Qset: { value: 0.1, unit: 'm³/s' },
          speed: 1.5, // Invalid speed
        },
      ];

      const invalidInput = {
        ...sampleInput,
        loadProfile: loadProfileWithInvalidSpeed,
      };

      expect(() => calculatePumpEnergy(invalidInput)).toThrow(
        'Speed ratio must be between 0 and 1'
      );
    });

    it('should generate warnings for low efficiency', () => {
      const lowEfficiencyInput = {
        ...sampleInput,
        pumpEfficiency: 0.3, // Very low efficiency
        motorEfficiency: 0.5, // Very low efficiency
      };

      const result = calculatePumpEnergy(lowEfficiencyInput);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some(
          w => typeof w === 'string' && w.includes('efficiency')
        )
      ).toBe(true);
    });

    it('should handle different fluids', () => {
      const airInput = {
        ...sampleInput,
        fluid: {
          density: { value: 1.225, unit: 'kg/m³' },
          name: 'air',
        },
      };

      const result = calculatePumpEnergy(airInput);

      expect(result.totalEnergy.value).toBeGreaterThan(0);
      expect(result.totalEnergy.value).toBeLessThan(1000); // Air should use much less energy than water
    });
  });

  describe('validateEnergyInputs', () => {
    const validInput = {
      fluid: {
        density: { value: 998, unit: 'kg/m³' },
        name: 'water',
      },
      pumpEfficiency: 0.75,
      motorEfficiency: 0.9,
      loadProfile: sampleLoadProfile,
      tariff: sampleTariff,
      head: { value: 20, unit: 'm' },
    };

    it('should validate correct inputs', () => {
      const result = validateEnergyInputs(validInput);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative fluid density', () => {
      const invalidInput = {
        ...validInput,
        fluid: {
          density: { value: -998, unit: 'kg/m³' },
          name: 'water',
        },
      };

      const result = validateEnergyInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Fluid density must be positive');
    });

    it('should reject negative head', () => {
      const invalidInput = {
        ...validInput,
        head: { value: -20, unit: 'm' },
      };

      const result = validateEnergyInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Head must be positive');
    });

    it('should reject empty load profile', () => {
      const invalidInput = {
        ...validInput,
        loadProfile: [],
      };

      const result = validateEnergyInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Load profile must have at least one operating point'
      );
    });

    it('should reject negative tariff rate', () => {
      const invalidInput = {
        ...validInput,
        tariff: { rate: -0.12, name: 'Invalid' },
      };

      const result = validateEnergyInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Energy tariff rate must be positive');
    });

    it('should reject negative hours in load profile', () => {
      const invalidLoadProfile: LoadProfilePoint[] = [
        {
          hours: -1000,
          Qset: { value: 0.1, unit: 'm³/s' },
        },
      ];

      const invalidInput = {
        ...validInput,
        loadProfile: invalidLoadProfile,
      };

      const result = validateEnergyInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Load profile point 1: Hours must be positive'
      );
    });

    it('should reject negative flow rate in load profile', () => {
      const invalidLoadProfile: LoadProfilePoint[] = [
        {
          hours: 1000,
          Qset: { value: -0.1, unit: 'm³/s' },
        },
      ];

      const invalidInput = {
        ...validInput,
        loadProfile: invalidLoadProfile,
      };

      const result = validateEnergyInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Load profile point 1: Flow rate must be positive'
      );
    });

    it('should reject invalid speed ratio in load profile', () => {
      const invalidLoadProfile: LoadProfilePoint[] = [
        {
          hours: 1000,
          Qset: { value: 0.1, unit: 'm³/s' },
          speed: 1.5, // Invalid speed
        },
      ];

      const invalidInput = {
        ...validInput,
        loadProfile: invalidLoadProfile,
      };

      const result = validateEnergyInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Load profile point 1: Speed ratio must be between 0 and 1'
      );
    });

    it('should reject excessive total hours', () => {
      const excessiveLoadProfile: LoadProfilePoint[] = [
        {
          hours: 10000, // Exceeds 9636 hours (8760 + 10%)
          Qset: { value: 0.1, unit: 'm³/s' },
        },
      ];

      const invalidInput = {
        ...validInput,
        loadProfile: excessiveLoadProfile,
      };

      const result = validateEnergyInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Total hours in load profile cannot exceed 9636 hours (8760 + 10%)'
      );
    });
  });
});
