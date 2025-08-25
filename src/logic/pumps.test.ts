import { describe, it, expect } from 'vitest';
import {
  interpolateCurve,
  scaleByAffinity,
  bepc,
  calculatePumpPower,
  findOperatingPoint,
  validatePumpCurve,
  PumpCurve,
  PumpCurvePoint,
} from './pumps';

describe('Pump Logic', () => {
  const sampleCurve: { q: number; h: number }[] = [
    { q: 0, h: 50 },
    { q: 0.1, h: 48 },
    { q: 0.2, h: 44 },
    { q: 0.3, h: 38 },
    { q: 0.4, h: 30 },
    { q: 0.5, h: 20 },
  ];

  const sampleCurveWithEfficiency: PumpCurve = {
    points: [
      { q: 0, h: 50, efficiency: 0.3 },
      { q: 0.1, h: 48, efficiency: 0.6 },
      { q: 0.2, h: 44, efficiency: 0.8 },
      { q: 0.3, h: 38, efficiency: 0.85 },
      { q: 0.4, h: 30, efficiency: 0.75 },
      { q: 0.5, h: 20, efficiency: 0.5 },
    ],
    name: 'Test Pump',
    units: {
      flow: 'm³/s',
      head: 'm',
      efficiency: 'decimal',
    },
  };

  describe('interpolateCurve', () => {
    it('should interpolate between curve points', () => {
      const interpolator = interpolateCurve(sampleCurve);
      
      // Test interpolation at known points
      expect(interpolator(0)).toBe(50);
      expect(interpolator(0.5)).toBe(20);
      
      // Test interpolation between points
      expect(interpolator(0.05)).toBeCloseTo(49, 1);
      expect(interpolator(0.25)).toBeCloseTo(41, 1);
      expect(interpolator(0.45)).toBeCloseTo(25, 1);
    });

    it('should handle extrapolation', () => {
      const interpolator = interpolateCurve(sampleCurve);
      
      // Extrapolation below minimum flow
      expect(interpolator(-0.1)).toBe(50);
      
      // Extrapolation above maximum flow
      expect(interpolator(0.6)).toBe(20);
    });

    it('should handle unsorted curve points', () => {
      const unsortedCurve = [
        { q: 0.3, h: 38 },
        { q: 0, h: 50 },
        { q: 0.2, h: 44 },
        { q: 0.1, h: 48 },
      ];
      
      const interpolator = interpolateCurve(unsortedCurve);
      expect(interpolator(0.15)).toBeCloseTo(46, 1);
    });

    it('should throw error for insufficient points', () => {
      expect(() => interpolateCurve([])).toThrow('Curve must have at least 2 points');
      expect(() => interpolateCurve([{ q: 0, h: 50 }])).toThrow('Curve must have at least 2 points');
    });

    it('should throw error for duplicate flow rates', () => {
      const duplicateCurve = [
        { q: 0, h: 50 },
        { q: 0.1, h: 48 },
        { q: 0.1, h: 47 }, // Duplicate flow rate
      ];
      
      expect(() => interpolateCurve(duplicateCurve)).toThrow('Curve contains duplicate flow rates');
    });
  });

  describe('scaleByAffinity', () => {
    it('should scale curve by speed ratio only', () => {
      const speedRatio = 1.2;
      const result = scaleByAffinity(sampleCurveWithEfficiency, speedRatio);
      
      expect(result.speedRatio).toBe(speedRatio);
      expect(result.impellerRatio).toBeUndefined();
      expect(result.scalingApplied.speed).toBe(true);
      expect(result.scalingApplied.impeller).toBe(false);
      
      // Check scaling relations: Q ~ n, H ~ n²
      const originalPoint = sampleCurveWithEfficiency.points[2]; // q=0.2, h=44
      const scaledPoint = result.curve.points[2];
      
      expect(scaledPoint.q).toBeCloseTo(originalPoint.q * speedRatio, 6);
      expect(scaledPoint.h).toBeCloseTo(originalPoint.h * speedRatio * speedRatio, 6);
      expect(scaledPoint.efficiency).toBe(originalPoint.efficiency); // Efficiency should not change
    });

    it('should scale curve by both speed and impeller ratios', () => {
      const speedRatio = 1.1;
      const impellerRatio = 1.05;
      const result = scaleByAffinity(sampleCurveWithEfficiency, speedRatio, impellerRatio);
      
      expect(result.speedRatio).toBe(speedRatio);
      expect(result.impellerRatio).toBe(impellerRatio);
      expect(result.scalingApplied.speed).toBe(true);
      expect(result.scalingApplied.impeller).toBe(true);
      
      // Check scaling relations: Q ~ n·d³, H ~ n²·d²
      const originalPoint = sampleCurveWithEfficiency.points[3]; // q=0.3, h=38
      const scaledPoint = result.curve.points[3];
      
      const expectedQ = originalPoint.q * speedRatio * Math.pow(impellerRatio, 3);
      const expectedH = originalPoint.h * speedRatio * speedRatio * Math.pow(impellerRatio, 2);
      
      expect(scaledPoint.q).toBeCloseTo(expectedQ, 6);
      expect(scaledPoint.h).toBeCloseTo(expectedH, 6);
    });

    it('should preserve curve metadata', () => {
      const result = scaleByAffinity(sampleCurveWithEfficiency, 1.1);
      
      expect(result.curve.name).toBe(sampleCurveWithEfficiency.name);
      expect(result.curve.units).toEqual(sampleCurveWithEfficiency.units);
    });

    it('should throw error for invalid speed ratio', () => {
      expect(() => scaleByAffinity(sampleCurveWithEfficiency, 0)).toThrow('Speed ratio must be positive');
      expect(() => scaleByAffinity(sampleCurveWithEfficiency, -1)).toThrow('Speed ratio must be positive');
    });

    it('should throw error for invalid impeller ratio', () => {
      expect(() => scaleByAffinity(sampleCurveWithEfficiency, 1.1, 0)).toThrow('Impeller ratio must be positive');
      expect(() => scaleByAffinity(sampleCurveWithEfficiency, 1.1, -0.5)).toThrow('Impeller ratio must be positive');
    });

    it('should handle curve without efficiency data', () => {
      const curveWithoutEfficiency: PumpCurve = {
        points: sampleCurve.map(p => ({ q: p.q, h: p.h })),
      };
      
      const result = scaleByAffinity(curveWithoutEfficiency, 1.2);
      expect(result.curve.points[0].efficiency).toBeUndefined();
    });
  });

  describe('bepc', () => {
    it('should find BEP using efficiency data', () => {
      const result = bepc(0.25, 41, sampleCurveWithEfficiency);
      
      expect(result.method).toBe('efficiency');
      expect(result.bepPoint.q).toBe(0.3);
      expect(result.bepPoint.h).toBe(38);
      expect(result.bepPoint.efficiency).toBe(0.85);
      expect(result.bepIndex).toBe(3);
      expect(result.distance).toBeGreaterThan(0);
    });

    it('should find BEP using midpoint when no efficiency data', () => {
      const curveWithoutEfficiency: PumpCurve = {
        points: sampleCurve.map(p => ({ q: p.q, h: p.h })),
      };
      
      const result = bepc(0.25, 41, curveWithoutEfficiency);
      
      expect(result.method).toBe('midpoint');
      expect(result.bepIndex).toBe(3); // Middle point (0-based index) for 6 points
      expect(result.bepPoint.q).toBe(0.3);
      expect(result.bepPoint.h).toBe(38);
      expect(result.distance).toBeGreaterThan(0);
    });

    it('should calculate correct distance to BEP', () => {
      // Use the actual BEP point (q=0.3, h=38, efficiency=0.85)
      const result = bepc(0.3, 38, sampleCurveWithEfficiency);
      
      // Distance should be 0 since we're at the BEP point
      expect(result.distance).toBeCloseTo(0, 6);
    });

    it('should handle single point curve', () => {
      const singlePointCurve: PumpCurve = {
        points: [{ q: 0.1, h: 48, efficiency: 0.8 }],
      };
      
      const result = bepc(0.2, 40, singlePointCurve);
      
      expect(result.bepPoint.q).toBe(0.1);
      expect(result.bepPoint.h).toBe(48);
      expect(result.bepIndex).toBe(0);
      expect(result.distance).toBeGreaterThan(0);
    });

    it('should throw error for empty curve', () => {
      const emptyCurve: PumpCurve = { points: [] };
      
      expect(() => bepc(0.1, 48, emptyCurve)).toThrow('Curve must have at least one point');
    });
  });

  describe('calculatePumpPower', () => {
    it('should calculate pump power correctly', () => {
      const q = 0.1; // m³/s
      const h = 30; // m
      const efficiency = 0.8;
      const rho = 1000; // kg/m³
      
      const power = calculatePumpPower(q, h, efficiency, rho);
      
      // P = ρ·g·Q·H / η
      const expectedPower = (rho * 9.81 * q * h) / efficiency;
      expect(power).toBeCloseTo(expectedPower, 6);
    });

    it('should use default density of 1000 kg/m³', () => {
      const q = 0.1;
      const h = 30;
      const efficiency = 0.8;
      
      const powerWithDefault = calculatePumpPower(q, h, efficiency);
      const powerWithExplicit = calculatePumpPower(q, h, efficiency, 1000);
      
      expect(powerWithDefault).toBe(powerWithExplicit);
    });

    it('should throw error for invalid efficiency', () => {
      expect(() => calculatePumpPower(0.1, 30, 0)).toThrow('Efficiency must be between 0 and 1');
      expect(() => calculatePumpPower(0.1, 30, 1.1)).toThrow('Efficiency must be between 0 and 1');
      expect(() => calculatePumpPower(0.1, 30, -0.1)).toThrow('Efficiency must be between 0 and 1');
    });

    it('should throw error for invalid density', () => {
      expect(() => calculatePumpPower(0.1, 30, 0.8, 0)).toThrow('Density must be positive');
      expect(() => calculatePumpPower(0.1, 30, 0.8, -1000)).toThrow('Density must be positive');
    });
  });

  describe('findOperatingPoint', () => {
    it('should find operating point at intersection', () => {
      // Pump curve: H = 50 - 60Q
      const pumpCurve = (q: number) => 50 - 60 * q;
      
      // System curve: H = 20 + 40Q²
      const systemCurve = (q: number) => 20 + 40 * q * q;
      
      const result = findOperatingPoint(pumpCurve, systemCurve, 0, 0.5);
      
      // Verify that both curves give the same head at the operating point
      const pumpHead = pumpCurve(result.q);
      const systemHead = systemCurve(result.q);
      
      expect(Math.abs(pumpHead - systemHead)).toBeLessThan(1e-4);
      expect(result.h).toBeCloseTo(pumpHead, 6);
    });

    it('should handle linear system curve', () => {
      const pumpCurve = (q: number) => 50 - 60 * q;
      const systemCurve = (q: number) => 20 + 30 * q;
      
      const result = findOperatingPoint(pumpCurve, systemCurve, 0, 0.5);
      
      expect(result.q).toBeGreaterThan(0);
      expect(result.q).toBeLessThan(0.5);
      expect(result.h).toBeGreaterThan(0);
    });

    it('should throw error for no intersection', () => {
      const pumpCurve = (q: number) => 50 - 60 * q;
      const systemCurve = (q: number) => 100 + 30 * q; // Always above pump curve
      
      expect(() => findOperatingPoint(pumpCurve, systemCurve, 0, 0.5)).toThrow('No intersection found in the specified range');
    });

    it('should throw error for invalid range', () => {
      const pumpCurve = (q: number) => 50 - 60 * q;
      const systemCurve = (q: number) => 20 + 30 * q;
      
      expect(() => findOperatingPoint(pumpCurve, systemCurve, 0.5, 0)).toThrow('qMin must be less than qMax');
    });
  });

  describe('validatePumpCurve', () => {
    it('should validate correct curve', () => {
      const result = validatePumpCurve(sampleCurveWithEfficiency);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty curve', () => {
      const emptyCurve: PumpCurve = { points: [] };
      const result = validatePumpCurve(emptyCurve);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Curve must have at least one point');
    });

    it('should warn about insufficient points', () => {
      const singlePointCurve: PumpCurve = {
        points: [{ q: 0.1, h: 48, efficiency: 0.8 }],
      };
      const result = validatePumpCurve(singlePointCurve);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Curve must have at least 2 points for interpolation');
    });

    it('should reject negative flow rates', () => {
      const invalidCurve: PumpCurve = {
        points: [
          { q: 0, h: 50 },
          { q: -0.1, h: 48 }, // Negative flow rate
          { q: 0.2, h: 44 },
        ],
      };
      const result = validatePumpCurve(invalidCurve);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Point 1: Flow rate cannot be negative');
    });

    it('should reject negative head', () => {
      const invalidCurve: PumpCurve = {
        points: [
          { q: 0, h: 50 },
          { q: 0.1, h: -10 }, // Negative head
          { q: 0.2, h: 44 },
        ],
      };
      const result = validatePumpCurve(invalidCurve);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Point 1: Head cannot be negative');
    });

    it('should reject invalid efficiency values', () => {
      const invalidCurve: PumpCurve = {
        points: [
          { q: 0, h: 50, efficiency: 0.8 },
          { q: 0.1, h: 48, efficiency: 1.2 }, // Efficiency > 1
          { q: 0.2, h: 44, efficiency: -0.1 }, // Efficiency < 0
        ],
      };
      const result = validatePumpCurve(invalidCurve);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Point 1: Efficiency must be between 0 and 1');
      expect(result.errors).toContain('Point 2: Efficiency must be between 0 and 1');
    });

    it('should reject duplicate flow rates', () => {
      const invalidCurve: PumpCurve = {
        points: [
          { q: 0, h: 50 },
          { q: 0.1, h: 48 },
          { q: 0.1, h: 47 }, // Duplicate flow rate
        ],
      };
      const result = validatePumpCurve(invalidCurve);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Curve contains duplicate flow rates');
    });
  });
});
