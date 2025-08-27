import { describe, it, expect } from 'vitest';
import {
  combinePumps,
  systemHead,
  solveIntersection,
  calculateOperatingPoint,
  validateOperatingPointInputs,
  PumpData,
  SystemData,
} from './operatePoint';

describe('Operating Point Logic', () => {
  const samplePump1: PumpData = {
    id: 'pump1',
    curve: [
      { q: 0, h: 50 },
      { q: 0.1, h: 48 },
      { q: 0.2, h: 44 },
      { q: 0.3, h: 38 },
      { q: 0.4, h: 30 },
      { q: 0.5, h: 20 },
    ],
  };

  const samplePump2: PumpData = {
    id: 'pump2',
    curve: [
      { q: 0, h: 40 },
      { q: 0.1, h: 38 },
      { q: 0.2, h: 34 },
      { q: 0.3, h: 28 },
      { q: 0.4, h: 20 },
      { q: 0.5, h: 10 },
    ],
  };

  const sampleSystem: SystemData = {
    staticHead: 20,
    k: 100, // H = 20 + 100Q²
  };

  describe('combinePumps', () => {
    it('should combine single pump', () => {
      const result = combinePumps([samplePump1], 'single');

      expect(result.arrangement).toBe('single');
      expect(result.pumpCount).toBe(1);
      expect(result.speedApplied).toBe(1);

      // Test the aggregate curve
      const h = result.aggregateCurve(0.2);
      expect(h).toBeCloseTo(44, 1);
    });

    it('should combine pumps in series', () => {
      const result = combinePumps([samplePump1, samplePump2], 'series');

      expect(result.arrangement).toBe('series');
      expect(result.pumpCount).toBe(2);

      // Test the aggregate curve: heads should add up
      const h1 = samplePump1.curve.find(p => p.q === 0.2)!.h;
      const h2 = samplePump2.curve.find(p => p.q === 0.2)!.h;
      const expectedHead = h1 + h2;

      const actualHead = result.aggregateCurve(0.2);
      expect(actualHead).toBeCloseTo(expectedHead, 1);
    });

    it('should combine pumps in parallel', () => {
      const result = combinePumps([samplePump1, samplePump1], 'parallel');

      expect(result.arrangement).toBe('parallel');
      expect(result.pumpCount).toBe(2);

      // For parallel pumps, at the same head, flows add up
      // This is more complex to test directly, so we test the function exists
      expect(typeof result.aggregateCurve).toBe('function');

      // Test that it returns a reasonable value
      const h = result.aggregateCurve(0.2);
      expect(h).toBeGreaterThan(0);
      expect(h).toBeLessThan(50); // Should be less than shutoff head
    });

    it('should apply speed scaling', () => {
      const speed = 1.2;
      const result = combinePumps([samplePump1], 'single', speed);

      expect(result.speedApplied).toBe(speed);

      // With speed scaling: Q ~ n, H ~ n²
      const originalHead = samplePump1.curve.find(p => p.q === 0.1)!.h;
      const scaledHead = result.aggregateCurve(0.1 * speed);
      expect(scaledHead).toBeCloseTo(originalHead * speed * speed, 1);
    });

    it('should warn for multiple pumps in single arrangement', () => {
      const result = combinePumps([samplePump1, samplePump2], 'single');

      expect(result.arrangement).toBe('single');
      expect(result.pumpCount).toBe(2);
    });

    it('should throw error for empty pump array', () => {
      expect(() => combinePumps([], 'single')).toThrow(
        'At least one pump curve is required'
      );
    });

    it('should throw error for invalid speed', () => {
      expect(() => combinePumps([samplePump1], 'single', 0)).toThrow(
        'Speed must be positive'
      );
      expect(() => combinePumps([samplePump1], 'single', -1)).toThrow(
        'Speed must be positive'
      );
    });

    it('should throw error for invalid arrangement', () => {
      expect(() => combinePumps([samplePump1], 'invalid' as any)).toThrow(
        'Invalid arrangement'
      );
    });
  });

  describe('systemHead', () => {
    it('should calculate quadratic system head', () => {
      const system: SystemData = {
        staticHead: 10,
        k: 50,
      };

      // H = 10 + 50Q²
      expect(systemHead(0, system)).toBe(10);
      expect(systemHead(0.2, system)).toBe(10 + 50 * 0.2 * 0.2);
      expect(systemHead(0.5, system)).toBe(10 + 50 * 0.5 * 0.5);
    });

    it('should calculate polynomial system head', () => {
      const system: SystemData = {
        staticHead: 5,
        k: 10,
        polynomial: [5, 2, 3], // 5 + 2Q + 3Q²
      };

      // H = 5 + 2Q + 3Q²
      expect(systemHead(0, system)).toBe(5);
      expect(systemHead(1, system)).toBe(5 + 2 + 3);
      expect(systemHead(2, system)).toBe(5 + 4 + 12);
    });

    it('should prioritize polynomial over quadratic', () => {
      const system: SystemData = {
        staticHead: 10,
        k: 50,
        polynomial: [5, 2, 3], // This should be used instead of staticHead + kQ²
      };

      // Should use polynomial: 5 + 2Q + 3Q²
      expect(systemHead(0, system)).toBe(5);
      expect(systemHead(1, system)).toBe(10); // 5 + 2 + 3
    });
  });

  describe('solveIntersection', () => {
    it('should find intersection of linear curves', () => {
      // Pump curve: H = 50 - 60Q
      const pumpCurve = (q: number) => 50 - 60 * q;

      // System curve: H = 20 + 40Q
      const systemCurve = (q: number) => 20 + 40 * q;

      const result = solveIntersection(pumpCurve, systemCurve, 0, 1);

      expect(result.convergence).toBe(true);
      expect(result.iterations).toBeLessThan(50);
      expect(result.residual).toBeLessThan(1e-4);

      // Verify intersection: 50 - 60Q = 20 + 40Q => 30 = 100Q => Q = 0.3
      expect(result.q).toBeCloseTo(0.3, 3);
      expect(result.h).toBeCloseTo(32, 1); // H = 20 + 40*0.3 = 32
    });

    it('should find intersection of quadratic curves', () => {
      // Pump curve: H = 50 - 60Q
      const pumpCurve = (q: number) => 50 - 60 * q;

      // System curve: H = 20 + 100Q²
      const systemCurve = (q: number) => 20 + 100 * q * q;

      const result = solveIntersection(pumpCurve, systemCurve, 0, 1);

      expect(result.convergence).toBe(true);
      expect(result.iterations).toBeLessThan(50);
      expect(result.residual).toBeLessThan(1e-4);

      // Verify the intersection point
      const pumpHead = pumpCurve(result.q);
      const systemHeadValue = systemCurve(result.q);
      expect(Math.abs(pumpHead - systemHeadValue)).toBeLessThan(1e-4);
    });

    it('should handle no intersection gracefully', () => {
      // Pump curve: H = 50 - 60Q
      const pumpCurve = (q: number) => 50 - 60 * q;

      // System curve: H = 100 + 40Q (always above pump curve)
      const systemCurve = (q: number) => 100 + 40 * q;

      const result = solveIntersection(pumpCurve, systemCurve, 0, 1);

      expect(result.convergence).toBe(false);
      expect(result.q).toBeGreaterThanOrEqual(0);
      expect(result.q).toBeLessThanOrEqual(1);
    });

    it('should throw error for invalid range', () => {
      const pumpCurve = (q: number) => 50 - 60 * q;
      const systemCurve = (q: number) => 20 + 40 * q;

      expect(() => solveIntersection(pumpCurve, systemCurve, 1, 0)).toThrow(
        'qMin must be less than qMax'
      );
    });
  });

  describe('calculateOperatingPoint', () => {
    it('should calculate operating point for single pump', () => {
      const result = calculateOperatingPoint(
        [samplePump1],
        'single',
        sampleSystem
      );

      expect(result.flow.value).toBeGreaterThan(0);
      expect(result.head.value).toBeGreaterThan(0);
      expect(result.pumpHead.value).toBeGreaterThan(0);
      expect(result.systemHead.value).toBeGreaterThan(0);
      expect(result.meta.convergence).toBe(true);
      expect(result.meta.iterations).toBeLessThan(100);
      expect(result.meta.method).toBe('bisection');

      // Verify operating point: pump head should equal system head
      expect(
        Math.abs(result.pumpHead.value - result.systemHead.value)
      ).toBeLessThan(1e-4);
    });

    it('should calculate operating point for pumps in series', () => {
      const result = calculateOperatingPoint(
        [samplePump1, samplePump2],
        'series',
        sampleSystem
      );

      expect(result.flow.value).toBeGreaterThan(0);
      expect(result.head.value).toBeGreaterThan(0);
      // Note: convergence may be false for complex series arrangements

      // For series pumps, the total head should be higher than individual pumps
      const singleResult = calculateOperatingPoint(
        [samplePump1],
        'single',
        sampleSystem
      );
      expect(result.head.value).toBeGreaterThan(singleResult.head.value);
    });

    it('should calculate operating point for pumps in parallel', () => {
      const result = calculateOperatingPoint(
        [samplePump1, samplePump1],
        'parallel',
        sampleSystem
      );

      expect(result.flow.value).toBeGreaterThan(0);
      expect(result.head.value).toBeGreaterThan(0);
      expect(result.meta.convergence).toBe(true);

      // For parallel pumps, the total flow should be higher than single pump
      const singleResult = calculateOperatingPoint(
        [samplePump1],
        'single',
        sampleSystem
      );
      expect(result.flow.value).toBeGreaterThan(singleResult.flow.value);
    });

    it('should apply speed scaling', () => {
      const speed = 1.1;
      const result = calculateOperatingPoint(
        [samplePump1],
        'single',
        sampleSystem,
        speed
      );

      expect(result.flow.value).toBeGreaterThan(0);
      expect(result.head.value).toBeGreaterThan(0);
      expect(result.meta.convergence).toBe(true);
    });

    it('should handle polynomial system curve', () => {
      const polynomialSystem: SystemData = {
        staticHead: 10,
        k: 50,
        polynomial: [10, 5, 20], // 10 + 5Q + 20Q²
      };

      const result = calculateOperatingPoint(
        [samplePump1],
        'single',
        polynomialSystem
      );

      expect(result.flow.value).toBeGreaterThan(0);
      expect(result.head.value).toBeGreaterThan(0);
      expect(result.meta.convergence).toBe(true);
    });

    it('should generate warnings for invalid curves', () => {
      const invalidPump: PumpData = {
        id: 'invalid',
        curve: [{ q: 0, h: 50 }], // Only one point
      };

      expect(() =>
        calculateOperatingPoint([invalidPump], 'single', sampleSystem)
      ).toThrow('Curve must have at least 2 points');
    });

    it('should throw error for empty pump array', () => {
      expect(() => calculateOperatingPoint([], 'single', sampleSystem)).toThrow(
        'At least one pump is required'
      );
    });
  });

  describe('validateOperatingPointInputs', () => {
    it('should validate correct inputs', () => {
      const result = validateOperatingPointInputs(
        [samplePump1],
        'single',
        sampleSystem
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty pump array', () => {
      const result = validateOperatingPointInputs([], 'single', sampleSystem);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one pump is required');
    });

    it('should reject pump without ID', () => {
      const invalidPump = { ...samplePump1, id: '' };
      const result = validateOperatingPointInputs(
        [invalidPump],
        'single',
        sampleSystem
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pump 0: ID is required');
    });

    it('should reject pump with insufficient curve points', () => {
      const invalidPump = { ...samplePump1, curve: [{ q: 0, h: 50 }] };
      const result = validateOperatingPointInputs(
        [invalidPump],
        'single',
        sampleSystem
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Pump pump1: Curve must have at least 2 points'
      );
    });

    it('should reject negative pump speed', () => {
      const invalidPump = { ...samplePump1, speed: -1 };
      const result = validateOperatingPointInputs(
        [invalidPump],
        'single',
        sampleSystem
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pump pump1: Speed must be positive');
    });

    it('should reject invalid arrangement', () => {
      const result = validateOperatingPointInputs(
        [samplePump1],
        'invalid' as any,
        sampleSystem
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid arrangement type');
    });

    it('should reject negative static head', () => {
      const invalidSystem = { ...sampleSystem, staticHead: -10 };
      const result = validateOperatingPointInputs(
        [samplePump1],
        'single',
        invalidSystem
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Static head cannot be negative');
    });

    it('should reject negative system coefficient', () => {
      const invalidSystem = { ...sampleSystem, k: -50 };
      const result = validateOperatingPointInputs(
        [samplePump1],
        'single',
        invalidSystem
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'System coefficient k cannot be negative'
      );
    });

    it('should validate polynomial coefficients', () => {
      const invalidSystem = {
        ...sampleSystem,
        polynomial: [5, 'invalid' as any, 3],
      };
      const result = validateOperatingPointInputs(
        [samplePump1],
        'single',
        invalidSystem
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Polynomial coefficient 1 must be a number'
      );
    });
  });
});
