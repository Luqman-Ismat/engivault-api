import { describe, it, expect } from 'vitest';
import {
  sumMinorLosses,
  calculateMinorLossesWithFluid,
  calculateMinorLossesFromFlow,
  calculateEquivalentLength,
  calculateKFactorFromEquivalentLength,
  validateMinorLossItems,
  getMinorLossesSummary,
  type MinorLossItem,
} from './minorLosses';

describe('Minor Losses Calculations', () => {
  describe('sumMinorLosses', () => {
    it('should calculate minor losses for single fitting', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1 },
      ];

      const result = sumMinorLosses({
        items,
        rho: 998, // kg/m³ (water)
        v: 2, // m/s
        D: 0.05, // m
      });

      // K = 0.3 for long radius elbow
      // ΔP = 0.3 * (998 * 2² / 2) = 0.3 * 1996 = 598.8 Pa
      expect(result.deltaP).toBeCloseTo(598.8, 1);
      expect(result.Keq).toBe(0.3);
      expect(result.equivalentLength).toBeCloseTo(0.75, 2); // 0.3 * 0.05 / 0.02
      expect(result.warnings).toHaveLength(0);
    });

    it('should calculate minor losses for multiple fittings', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 2 },
        { type: 'tee-through', count: 1 },
        { type: 'globe-valve', count: 1, nominalSize: '2', schedule: '40' },
      ];

      const result = sumMinorLosses({
        items,
        rho: 998,
        v: 1.5,
        D: 0.05,
      });

      // K = 2*0.3 + 1*0.2 + 1*6.0 = 0.6 + 0.2 + 6.0 = 6.8
      // ΔP = 6.8 * (998 * 1.5² / 2) = 6.8 * 1122.75 = 7634.7 Pa
      expect(result.deltaP).toBeCloseTo(7634.7, 1);
      expect(result.Keq).toBe(6.8);
      expect(result.equivalentLength).toBeCloseTo(17.0, 1); // 6.8 * 0.05 / 0.02
    });

    it('should handle K-factor overrides', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1, k: 0.5 }, // Override K-factor
      ];

      const result = sumMinorLosses({
        items,
        rho: 998,
        v: 2,
        D: 0.05,
      });

      expect(result.deltaP).toBeCloseTo(998, 1); // 0.5 * (998 * 2² / 2)
      expect(result.Keq).toBe(0.5);
      expect(result.warnings).toContain(
        'Using provided K-factor (0.5) for elbow-90-long-radius'
      );
    });

    it('should handle unknown fitting types with default K-factor', () => {
      const items: MinorLossItem[] = [{ type: 'unknown-fitting', count: 1 }];

      const result = sumMinorLosses({
        items,
        rho: 998,
        v: 2,
        D: 0.05,
      });

      expect(result.deltaP).toBeCloseTo(1996, 1); // 1.0 * (998 * 2² / 2)
      expect(result.Keq).toBe(1.0);
      expect(result.warnings).toContain(
        'K-factor not found for unknown-fitting, using default value of 1.0'
      );
    });

    it('should calculate without equivalent length when D not provided', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1 },
      ];

      const result = sumMinorLosses({
        items,
        rho: 998,
        v: 2,
      });

      expect(result.deltaP).toBeCloseTo(598.8, 1);
      expect(result.Keq).toBe(0.3);
      expect(result.equivalentLength).toBeUndefined();
    });

    it('should handle zero velocity', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1 },
      ];

      const result = sumMinorLosses({
        items,
        rho: 998,
        v: 0,
        D: 0.05,
      });

      expect(result.deltaP).toBe(0);
      expect(result.Keq).toBe(0.3);
    });

    it('should handle different fluid densities', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1 },
      ];

      // Water
      const resultWater = sumMinorLosses({
        items,
        rho: 998,
        v: 2,
      });

      // Air
      const resultAir = sumMinorLosses({
        items,
        rho: 1.2,
        v: 2,
      });

      expect(resultWater.deltaP).toBeGreaterThan(resultAir.deltaP);
      expect(resultWater.Keq).toBe(resultAir.Keq);
    });
  });

  describe('calculateMinorLossesWithFluid', () => {
    it('should calculate minor losses with water fluid properties', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1 },
      ];

      const result = calculateMinorLossesWithFluid(
        items,
        'water',
        293.15, // 20°C
        2, // m/s
        0.05 // m
      );

      expect(result.deltaP).toBeGreaterThan(0);
      expect(result.Keq).toBe(0.3);
      expect(result.warnings).toHaveLength(0);
    });

    it('should calculate minor losses with air fluid properties', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1 },
      ];

      const result = calculateMinorLossesWithFluid(
        items,
        'air',
        293.15, // 20°C
        10, // m/s
        0.1 // m
      );

      expect(result.deltaP).toBeGreaterThan(0);
      expect(result.Keq).toBe(0.3);
    });

    it('should handle unknown fluid with error', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1 },
      ];

      const result = calculateMinorLossesWithFluid(
        items,
        'unknown-fluid',
        293.15,
        2,
        0.05
      );

      expect(result.deltaP).toBe(0);
      expect(result.Keq).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Error getting fluid properties');
    });
  });

  describe('calculateMinorLossesFromFlow', () => {
    it('should calculate minor losses from flow rate', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1 },
      ];

      const result = calculateMinorLossesFromFlow(
        items,
        998, // kg/m³
        0.01, // m³/s
        0.05 // m
      );

      // Velocity = 0.01 / (π * 0.025²) = 0.01 / 0.00196 = 5.1 m/s
      // ΔP = 0.3 * (998 * 5.1² / 2) = 0.3 * 12974 = 3892 Pa
      expect(result.deltaP).toBeCloseTo(3883, 0);
      expect(result.Keq).toBe(0.3);
    });

    it('should handle different flow rates', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1 },
      ];

      const result1 = calculateMinorLossesFromFlow(items, 998, 0.01, 0.05);
      const result2 = calculateMinorLossesFromFlow(items, 998, 0.02, 0.05);

      // Higher flow rate should result in higher pressure drop
      expect(result2.deltaP).toBeGreaterThan(result1.deltaP);
    });
  });

  describe('calculateEquivalentLength', () => {
    it('should calculate equivalent length correctly', () => {
      const k = 0.3;
      const diameter = 0.05; // m
      const frictionFactor = 0.02;

      const equivalentLength = calculateEquivalentLength(
        k,
        diameter,
        frictionFactor
      );
      // Leq = 0.3 * 0.05 / 0.02 = 0.75 m
      expect(equivalentLength).toBe(0.75);
    });

    it('should handle different friction factors', () => {
      const k = 0.3;
      const diameter = 0.05;

      const leq1 = calculateEquivalentLength(k, diameter, 0.02);
      const leq2 = calculateEquivalentLength(k, diameter, 0.01);

      // Lower friction factor should result in longer equivalent length
      expect(leq2).toBeGreaterThan(leq1);
    });
  });

  describe('calculateKFactorFromEquivalentLength', () => {
    it('should calculate K-factor from equivalent length', () => {
      const equivalentLength = 0.75; // m
      const diameter = 0.05; // m
      const frictionFactor = 0.02;

      const k = calculateKFactorFromEquivalentLength(
        equivalentLength,
        diameter,
        frictionFactor
      );
      // K = 0.75 * 0.02 / 0.05 = 0.3
      expect(k).toBe(0.3);
    });

    it('should be inverse of calculateEquivalentLength', () => {
      const k = 0.3;
      const diameter = 0.05;
      const frictionFactor = 0.02;

      const leq = calculateEquivalentLength(k, diameter, frictionFactor);
      const kCalculated = calculateKFactorFromEquivalentLength(
        leq,
        diameter,
        frictionFactor
      );

      expect(kCalculated).toBeCloseTo(k, 6);
    });
  });

  describe('validateMinorLossItems', () => {
    it('should validate valid items', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1 },
        { type: 'tee-through', count: 2 },
      ];

      const result = validateMinorLossItems(items);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect missing type', () => {
      const items: MinorLossItem[] = [{ type: '', count: 1 }];

      const result = validateMinorLossItems(items);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Item missing type');
    });

    it('should detect invalid count', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 0 },
        { type: 'tee-through', count: -1 },
      ];

      const result = validateMinorLossItems(items);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'Invalid count for elbow-90-long-radius: 0'
      );
      expect(result.warnings).toContain('Invalid count for tee-through: -1');
    });

    it('should detect invalid K-factor', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1, k: -0.5 },
      ];

      const result = validateMinorLossItems(items);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'Invalid K-factor for elbow-90-long-radius: -0.5'
      );
    });

    it('should detect unknown fitting types', () => {
      const items: MinorLossItem[] = [{ type: 'unknown-fitting', count: 1 }];

      const result = validateMinorLossItems(items);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'K-factor not found in catalog for unknown-fitting'
      );
    });

    it('should handle empty items array', () => {
      const items: MinorLossItem[] = [];

      const result = validateMinorLossItems(items);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('No minor loss items provided');
    });
  });

  describe('getMinorLossesSummary', () => {
    it('should generate summary with all information', () => {
      const result = {
        deltaP: 598.8,
        Keq: 0.3,
        equivalentLength: 0.75,
        warnings: ['Test warning'],
      };

      const summary = getMinorLossesSummary(result);

      expect(summary).toContain('Minor Losses Summary:');
      expect(summary).toContain('Total K-factor: 0.300');
      expect(summary).toContain('Pressure drop: 598.8 Pa');
      expect(summary).toContain('Equivalent length: 0.75 m');
      expect(summary).toContain('Warnings: 1');
      expect(summary).toContain('* Test warning');
    });

    it('should generate summary without equivalent length', () => {
      const result = {
        deltaP: 598.8,
        Keq: 0.3,
        warnings: [],
      };

      const summary = getMinorLossesSummary(result);

      expect(summary).toContain('Minor Losses Summary:');
      expect(summary).toContain('Total K-factor: 0.300');
      expect(summary).toContain('Pressure drop: 598.8 Pa');
      expect(summary).not.toContain('Equivalent length');
      expect(summary).toContain('Warnings: 0');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle realistic piping system', () => {
      const items: MinorLossItem[] = [
        { type: 'entrance-sharp', count: 1 },
        { type: 'elbow-90-long-radius', count: 4 },
        { type: 'tee-through', count: 2 },
        { type: 'globe-valve', count: 1, nominalSize: '2', schedule: '40' },
        { type: 'exit', count: 1 },
      ];

      const result = sumMinorLosses({
        items,
        rho: 998,
        v: 3,
        D: 0.05,
      });

      // K = 0.5 + 4*0.3 + 2*0.2 + 1*6.0 + 1*1.0 = 0.5 + 1.2 + 0.4 + 6.0 + 1.0 = 9.1
      // ΔP = 9.1 * (998 * 3² / 2) = 9.1 * 4491 = 40868 Pa
      expect(result.deltaP).toBeCloseTo(40868, 0);
      expect(result.Keq).toBe(9.1);
      expect(result.equivalentLength).toBeCloseTo(22.75, 2); // 9.1 * 0.05 / 0.02
    });

    it('should handle mixed K-factor sources', () => {
      const items: MinorLossItem[] = [
        { type: 'elbow-90-long-radius', count: 1 }, // From catalog
        { type: 'custom-fitting', count: 2, k: 1.5 }, // Override
        { type: 'globe-valve', count: 1, nominalSize: '1', schedule: '40' }, // Size-specific
      ];

      const result = sumMinorLosses({
        items,
        rho: 998,
        v: 2,
        D: 0.05,
      });

      // K = 0.3 + 2*1.5 + 6.0 = 0.3 + 3.0 + 6.0 = 9.3
      // K = 0.3 + 2*1.5 + 6.0 = 9.3
      expect(result.Keq).toBe(9.3);
      expect(result.warnings).toContain(
        'Using provided K-factor (1.5) for custom-fitting'
      );
      // Note: When K-factor is provided as override, it doesn't check the catalog
    });
  });
});
