import { describe, it, expect } from 'vitest';
import {
  interpolateCurve,
  scaleByAffinity,
  bepc,
  bepDistance,
  calculatePumpPower,
  findOperatingPoint,
  validatePumpCurve,
  PumpCurve
} from './pumps';

describe('Pump Module', () => {
  const sampleCurve: PumpCurve = {
    points: [
      { q: 0, h: 100, efficiency: 0 },
      { q: 0.05, h: 95, efficiency: 0.6 },
      { q: 0.1, h: 85, efficiency: 0.8 },
      { q: 0.15, h: 70, efficiency: 0.75 },
      { q: 0.2, h: 50, efficiency: 0.6 },
      { q: 0.25, h: 25, efficiency: 0.4 },
      { q: 0.3, h: 0, efficiency: 0 }
    ]
  };

  const sampleCurveNoEfficiency: PumpCurve = {
    points: [
      { q: 0, h: 100 },
      { q: 0.05, h: 95 },
      { q: 0.1, h: 85 },
      { q: 0.15, h: 70 },
      { q: 0.2, h: 50 },
      { q: 0.25, h: 25 },
      { q: 0.3, h: 0 }
    ]
  };

  describe('interpolateCurve', () => {
    it('should interpolate between points', () => {
      const curve = [
        { q: 0, h: 100 },
        { q: 0.1, h: 80 },
        { q: 0.2, h: 60 }
      ];
      const interpolator = interpolateCurve(curve);
      
      expect(interpolator(0.05)).toBeCloseTo(90, 1);
      expect(interpolator(0.15)).toBeCloseTo(70, 1);
    });

    it('should handle extrapolation', () => {
      const curve = [
        { q: 0.1, h: 80 },
        { q: 0.2, h: 60 }
      ];
      const interpolator = interpolateCurve(curve);
      
      expect(interpolator(0)).toBe(80);
      expect(interpolator(0.3)).toBe(60);
    });

    it('should throw error for insufficient points', () => {
      expect(() => interpolateCurve([{ q: 0, h: 100 }])).toThrow('Curve must have at least 2 points');
    });

    it('should throw error for duplicate flow rates', () => {
      const curve = [
        { q: 0.1, h: 80 },
        { q: 0.1, h: 60 }
      ];
      expect(() => interpolateCurve(curve)).toThrow('Curve contains duplicate flow rates');
    });
  });

  describe('scaleByAffinity', () => {
    it('should scale curve by speed ratio', () => {
      const curve: PumpCurve = {
        points: [
          { q: 0.1, h: 80, efficiency: 0.8 },
          { q: 0.2, h: 60, efficiency: 0.7 }
        ]
      };
      
      const result = scaleByAffinity(curve, 1.5);
      
      expect(result.curve.points[0].q).toBeCloseTo(0.15, 2);
      expect(result.curve.points[0].h).toBeCloseTo(180, 1);
      expect(result.curve.points[0].efficiency).toBe(0.8);
      expect(result.scalingApplied.speed).toBe(true);
      expect(result.scalingApplied.impeller).toBe(false);
    });

    it('should scale curve by both speed and impeller ratio', () => {
      const curve: PumpCurve = {
        points: [
          { q: 0.1, h: 80, efficiency: 0.8 },
          { q: 0.2, h: 60, efficiency: 0.7 }
        ]
      };
      
      const result = scaleByAffinity(curve, 1.5, 1.2);
      
      expect(result.curve.points[0].q).toBeCloseTo(0.2592, 3);
      expect(result.curve.points[0].h).toBeCloseTo(259.2, 1);
      expect(result.scalingApplied.impeller).toBe(true);
    });

    it('should throw error for negative speed ratio', () => {
      const curve: PumpCurve = { points: [{ q: 0.1, h: 80 }] };
      expect(() => scaleByAffinity(curve, -1)).toThrow('Speed ratio must be positive');
    });
  });

  describe('bepc', () => {
    it('should find BEP using efficiency data', () => {
      const result = bepc(0.12, 75, sampleCurve);
      
      expect(result.bepPoint.q).toBe(0.1);
      expect(result.bepPoint.h).toBe(85);
      expect(result.bepPoint.efficiency).toBe(0.8);
      expect(result.method).toBe('efficiency');
      expect(result.distance).toBeGreaterThan(0);
    });

    it('should find BEP using midpoint when no efficiency data', () => {
      const result = bepc(0.12, 75, sampleCurveNoEfficiency);
      
      expect(result.method).toBe('midpoint');
      expect(result.bepIndex).toBe(3); // Middle point
      expect(result.distance).toBeGreaterThan(0);
    });

    it('should throw error for empty curve', () => {
      const emptyCurve: PumpCurve = { points: [] };
      expect(() => bepc(0.1, 80, emptyCurve)).toThrow('Curve must have at least one point');
    });
  });

  describe('bepDistance', () => {
    it('should calculate BEP distance with warnings for far operation', () => {
      const result = bepDistance({ q: 0.25, h: 30 }, sampleCurve);
      
      expect(result.bepPoint.q).toBe(0.1);
      expect(result.bepPoint.h).toBe(85);
      expect(result.method).toBe('efficiency');
      expect(result.distance).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      
      // Should have warnings for being far from BEP
      const bepWarnings = result.warnings.filter(w => w.type === 'bep_distance');
      expect(bepWarnings.length).toBeGreaterThan(0);
    });

    it('should calculate BEP distance with warnings for operation outside curve range', () => {
      const result = bepDistance({ q: 0.4, h: 10 }, sampleCurve);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      
      // Should have warnings for being outside curve range
      const rangeWarnings = result.warnings.filter(w => w.type === 'curve_range');
      expect(rangeWarnings.length).toBeGreaterThan(0);
    });

    it('should calculate BEP distance with efficiency warnings', () => {
      const result = bepDistance({ q: 0.05, h: 95 }, sampleCurve);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      
      // Should have efficiency warnings for low efficiency operation
      const efficiencyWarnings = result.warnings.filter(w => w.type === 'efficiency');
      expect(efficiencyWarnings.length).toBeGreaterThan(0);
    });

    it('should handle operation close to BEP with minimal warnings', () => {
      const result = bepDistance({ q: 0.11, h: 83 }, sampleCurve);
      
      expect(result.bepPoint.q).toBe(0.1);
      expect(result.bepPoint.h).toBe(85);
      expect(result.distance).toBeGreaterThan(0);
      
      // Should have fewer warnings for operation close to BEP
      const bepWarnings = result.warnings.filter(w => w.type === 'bep_distance');
      expect(bepWarnings.length).toBeLessThanOrEqual(1);
    });
  });

  describe('calculatePumpPower', () => {
    it('should calculate pump power correctly', () => {
      const power = calculatePumpPower(0.1, 80, 0.8, 1000);
      
      // P = ρ * g * Q * H / η
      // P = 1000 * 9.81 * 0.1 * 80 / 0.8 = 98100 W
      expect(power).toBeCloseTo(98100, 0);
    });

    it('should throw error for invalid efficiency', () => {
      expect(() => calculatePumpPower(0.1, 80, 1.5, 1000)).toThrow('Efficiency must be between 0 and 1');
      expect(() => calculatePumpPower(0.1, 80, -0.1, 1000)).toThrow('Efficiency must be between 0 and 1');
    });

    it('should throw error for negative density', () => {
      expect(() => calculatePumpPower(0.1, 80, 0.8, -1000)).toThrow('Density must be positive');
    });
  });

  describe('findOperatingPoint', () => {
    it('should find operating point at intersection', () => {
      const pumpCurve = (q: number) => 100 - 100 * q; // Linear pump curve
      const systemCurve = (q: number) => 20 + 80 * q * q; // Quadratic system curve
      
      const result = findOperatingPoint(pumpCurve, systemCurve, 0, 1, 1e-6);
      
      expect(result.q).toBeGreaterThan(0);
      expect(result.h).toBeGreaterThan(0);
      expect(Math.abs(pumpCurve(result.q) - systemCurve(result.q))).toBeLessThan(1e-5);
    });

    it('should throw error for no intersection', () => {
      const pumpCurve = (q: number) => 100 + 100 * q; // Always above
      const systemCurve = (q: number) => 50 + 50 * q; // Always below
      
      expect(() => findOperatingPoint(pumpCurve, systemCurve, 0, 1)).toThrow('No intersection found');
    });

    it('should throw error for invalid range', () => {
      const pumpCurve = (q: number) => 100 - 100 * q;
      const systemCurve = (q: number) => 50 + 50 * q;
      
      expect(() => findOperatingPoint(pumpCurve, systemCurve, 1, 0)).toThrow('qMin must be less than qMax');
    });
  });

  describe('validatePumpCurve', () => {
    it('should validate correct curve', () => {
      const curve: PumpCurve = {
        points: [
          { q: 0.1, h: 80, efficiency: 0.8 },
          { q: 0.2, h: 60, efficiency: 0.7 }
        ]
      };
      
      const result = validatePumpCurve(curve);
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect negative values', () => {
      const curve: PumpCurve = {
        points: [
          { q: -0.1, h: 80, efficiency: 0.8 },
          { q: 0.2, h: -60, efficiency: 1.5 }
        ]
      };
      
      const result = validatePumpCurve(curve);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect duplicate flow rates', () => {
      const curve: PumpCurve = {
        points: [
          { q: 0.1, h: 80, efficiency: 0.8 },
          { q: 0.1, h: 60, efficiency: 0.7 }
        ]
      };
      
      const result = validatePumpCurve(curve);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('duplicate'))).toBe(true);
    });

    it('should detect insufficient points', () => {
      const curve: PumpCurve = { points: [] };
      
      const result = validatePumpCurve(curve);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('at least one point'))).toBe(true);
    });
  });
});
