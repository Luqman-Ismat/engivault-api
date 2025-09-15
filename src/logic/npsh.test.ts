import { describe, it, expect } from 'vitest';
import {
  npshAvailable,
  npshRequired,
  cavitationMargin,
  getAtmosphericPressure,
  getWaterVaporPressure,
  calculateCavitationRisk,
  validateNPSHInputs,
  resolveAtmosphericPressure,
  NPSHCurve,
} from './npsh';

describe('NPSH Logic', () => {
  const sampleNPSHCurve: NPSHCurve = {
    points: [
      { q: 0, npshr: 2.0 },
      { q: 0.1, npshr: 2.5 },
      { q: 0.2, npshr: 3.2 },
      { q: 0.3, npshr: 4.1 },
      { q: 0.4, npshr: 5.0 },
    ],
  };

  describe('npshAvailable', () => {
    it('should calculate NPSH available correctly', () => {
      const P_atm = 101325; // Pa (sea level)
      const P_vap = 2337; // Pa (water at 20°C)
      const rho = 998; // kg/m³ (water at 20°C)
      const z_static = 5; // m
      const losses_Pa = 5000; // Pa

      const npsha = npshAvailable(P_atm, P_vap, rho, z_static, losses_Pa);

      // Manual calculation:
      // atmosphericHead = 101325 / (998 * 9.81) = 10.35 m
      // vaporHead = 2337 / (998 * 9.81) = 0.24 m
      // lossesHead = 5000 / (998 * 9.81) = 0.51 m
      // npsha = 10.35 + 5 - 0.24 - 0.51 = 14.60 m

      expect(npsha).toBeCloseTo(14.6, 2);
    });

    it('should handle zero losses', () => {
      const P_atm = 101325;
      const P_vap = 2337;
      const rho = 998;
      const z_static = 3;
      const losses_Pa = 0;

      const npsha = npshAvailable(P_atm, P_vap, rho, z_static, losses_Pa);

      expect(npsha).toBeGreaterThan(0);
      expect(npsha).toBeCloseTo(13.11, 2); // 10.35 + 3 - 0.24 - 0
    });

    it('should handle negative static head', () => {
      const P_atm = 101325;
      const P_vap = 2337;
      const rho = 998;
      const z_static = -2; // Negative static head
      const losses_Pa = 1000;

      const npsha = npshAvailable(P_atm, P_vap, rho, z_static, losses_Pa);

      expect(npsha).toBeLessThan(10); // Should be reduced due to negative static head
    });
  });

  describe('npshRequired', () => {
    it('should interpolate NPSH required correctly', () => {
      const q = 0.15; // m³/s
      const npshr = npshRequired(q, sampleNPSHCurve.points);

      // Linear interpolation between q=0.1 (npshr=2.5) and q=0.2 (npshr=3.2)
      // At q=0.15, npshr should be 2.5 + 0.5 * (3.2 - 2.5) = 2.85

      expect(npshr).toBeCloseTo(2.85, 2);
    });

    it('should handle flow rate at curve endpoints', () => {
      const npshr1 = npshRequired(0, sampleNPSHCurve.points);
      const npshr2 = npshRequired(0.4, sampleNPSHCurve.points);

      expect(npshr1).toBe(2.0);
      expect(npshr2).toBe(5.0);
    });

    it('should handle flow rate outside curve range', () => {
      const npshr1 = npshRequired(-0.1, sampleNPSHCurve.points); // Below range
      const npshr2 = npshRequired(0.5, sampleNPSHCurve.points); // Above range

      expect(npshr1).toBe(2.0); // Should return minimum value
      expect(npshr2).toBe(5.0); // Should return maximum value
    });

    it('should handle single point curve', () => {
      const singlePointCurve = [{ q: 0.2, npshr: 3.0 }];
      const npshr = npshRequired(0.3, singlePointCurve);

      expect(npshr).toBe(3.0);
    });

    it('should handle unsorted curve points', () => {
      const unsortedCurve = [
        { q: 0.3, npshr: 4.1 },
        { q: 0.1, npshr: 2.5 },
        { q: 0.0, npshr: 2.0 },
        { q: 0.2, npshr: 3.2 },
      ];

      const npshr = npshRequired(0.15, unsortedCurve);

      expect(npshr).toBeCloseTo(2.85, 2); // Same result as sorted curve
    });

    it('should throw error for empty curve', () => {
      expect(() => npshRequired(0.1, [])).toThrow(
        'NPSH curve must have at least one point'
      );
    });
  });

  describe('cavitationMargin', () => {
    it('should calculate positive margin correctly', () => {
      const npsha = 10.0;
      const npshr = 3.0;
      const margin = cavitationMargin(npsha, npshr);

      expect(margin).toBe(7.0);
    });

    it('should calculate negative margin correctly', () => {
      const npsha = 2.0;
      const npshr = 5.0;
      const margin = cavitationMargin(npsha, npshr);

      expect(margin).toBe(-3.0);
    });

    it('should handle zero margin', () => {
      const npsha = 5.0;
      const npshr = 5.0;
      const margin = cavitationMargin(npsha, npshr);

      expect(margin).toBe(0.0);
    });
  });

  describe('getAtmosphericPressure', () => {
    it('should return sea level pressure at altitude 0', () => {
      const P_atm = getAtmosphericPressure(0);
      expect(P_atm).toBeCloseTo(101325, 0); // Sea level pressure
    });

    it('should decrease pressure with altitude', () => {
      const P_sea = getAtmosphericPressure(0);
      const P_1000m = getAtmosphericPressure(1000);
      const P_2000m = getAtmosphericPressure(2000);

      expect(P_1000m).toBeLessThan(P_sea);
      expect(P_2000m).toBeLessThan(P_1000m);
    });

    it('should handle high altitude', () => {
      const P_5000m = getAtmosphericPressure(5000);
      expect(P_5000m).toBeGreaterThan(0);
      expect(P_5000m).toBeLessThan(101325);
    });
  });

  describe('getWaterVaporPressure', () => {
    it('should calculate vapor pressure at 20°C', () => {
      const T_K = 293.15; // 20°C
      const P_vap = getWaterVaporPressure(T_K);

      expect(P_vap).toBeCloseTo(2330, 0); // Approximate value at 20°C
    });

    it('should calculate vapor pressure at 100°C', () => {
      const T_K = 373.15; // 100°C
      const P_vap = getWaterVaporPressure(T_K);

      expect(P_vap).toBeCloseTo(101336, 0); // Approximate boiling point pressure
    });

    it('should throw error for temperature below 0°C', () => {
      const T_K = 273.14; // -0.01°C
      expect(() => getWaterVaporPressure(T_K)).toThrow(
        'Temperature must be between 0°C and 100°C'
      );
    });

    it('should throw error for temperature above 100°C', () => {
      const T_K = 373.16; // 100.01°C
      expect(() => getWaterVaporPressure(T_K)).toThrow(
        'Temperature must be between 0°C and 100°C'
      );
    });
  });

  describe('calculateCavitationRisk', () => {
    const sampleInput = {
      atmosphericPressure: { value: 101325, unit: 'Pa' },
      staticHead: { value: 5, unit: 'm' },
      losses: { value: 5000, unit: 'Pa' },
      flowRate: { value: 0.15, unit: 'm³/s' },
      npshCurve: sampleNPSHCurve,
      fluidName: 'water',
    };

    it('should calculate cavitation risk for water', () => {
      const result = calculateCavitationRisk(sampleInput);

      expect(result.npshAvailable.value).toBeGreaterThan(0);
      expect(result.npshRequired.value).toBeGreaterThan(0);
      expect(result.cavitationMargin.value).toBeDefined();
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    it('should generate warnings for low margin', () => {
      const lowMarginInput = {
        ...sampleInput,
        staticHead: { value: -10, unit: 'm' }, // Very negative static head to ensure low margin
      };

      const result = calculateCavitationRisk(lowMarginInput);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some(w => typeof w === 'string' && w.includes('margin'))
      ).toBe(true);
    });

    it('should handle altitude input', () => {
      const altitudeInput = {
        ...sampleInput,
        altitude: 1000, // 1000m above sea level
        atmosphericPressure: undefined, // Should be calculated from altitude
      };

      const result = calculateCavitationRisk(altitudeInput);

      expect(result.npshAvailable.value).toBeGreaterThan(0);
      expect(result.metadata.atmosphericPressure.value).toBeLessThan(101325); // Lower at altitude
    });

    it('should handle custom temperature', () => {
      const tempInput = {
        ...sampleInput,
        temperature: { value: 313.15, unit: 'K' }, // 40°C
      };

      const result = calculateCavitationRisk(tempInput);

      expect(result.npshAvailable.value).toBeGreaterThan(0);
      expect(result.metadata.temperature.value).toBe(313.15);
    });

    it('should throw error for missing fluid properties', () => {
      const invalidInput = {
        ...sampleInput,
        fluidName: undefined,
        vaporPressure: undefined,
      };

      expect(() => calculateCavitationRisk(invalidInput)).toThrow(
        'Either temperature or fluidName must be provided'
      );
    });

    it('should handle custom vapor pressure', () => {
      const customVaporInput = {
        ...sampleInput,
        vaporPressure: { value: 5000, unit: 'Pa' },
        fluidName: 'custom',
      };

      const result = calculateCavitationRisk(customVaporInput);

      expect(result.npshAvailable.value).toBeGreaterThan(0);
      expect(result.metadata.vaporPressure.value).toBe(5000);
    });
  });

  describe('validateNPSHInputs', () => {
    const validInput = {
      atmosphericPressure: { value: 101325, unit: 'Pa' },
      staticHead: { value: 5, unit: 'm' },
      losses: { value: 5000, unit: 'Pa' },
      flowRate: { value: 0.15, unit: 'm³/s' },
      npshCurve: sampleNPSHCurve,
      fluidName: 'water',
    };

    it('should validate correct inputs', () => {
      const result = validateNPSHInputs(validInput);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative atmospheric pressure', () => {
      const invalidInput = {
        ...validInput,
        atmosphericPressure: { value: -1000, unit: 'Pa' },
      };

      const result = validateNPSHInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Atmospheric pressure must be positive');
    });

    it('should reject negative losses', () => {
      const invalidInput = {
        ...validInput,
        losses: { value: -1000, unit: 'Pa' },
      };

      const result = validateNPSHInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Losses must be non-negative');
    });

    it('should reject negative flow rate', () => {
      const invalidInput = {
        ...validInput,
        flowRate: { value: -0.1, unit: 'm³/s' },
      };

      const result = validateNPSHInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Flow rate must be positive');
    });

    it('should reject empty NPSH curve', () => {
      const invalidInput = {
        ...validInput,
        npshCurve: { points: [] },
      };

      const result = validateNPSHInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'NPSH curve must have at least one point'
      );
    });

    it('should reject negative curve points', () => {
      const invalidInput = {
        ...validInput,
        npshCurve: {
          points: [
            { q: -0.1, npshr: 2.0 },
            { q: 0.1, npshr: 2.5 },
          ],
        },
      };

      const result = validateNPSHInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'NPSH curve point 1: Flow rate cannot be negative'
      );
    });

    it('should reject negative altitude', () => {
      const invalidInput = {
        ...validInput,
        altitude: -100,
      };

      const result = validateNPSHInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Altitude cannot be negative');
    });
  });

  describe('resolveAtmosphericPressure', () => {
    it('should resolve atmospheric pressure from altitude', () => {
      const input = {
        atmosphericPressure: undefined,
        staticHead: { value: 5, unit: 'm' },
        losses: { value: 5000, unit: 'Pa' },
        flowRate: { value: 0.15, unit: 'm³/s' },
        npshCurve: sampleNPSHCurve,
        altitude: 1000,
      };

      const result = resolveAtmosphericPressure(input);

      expect(result.atmosphericPressure).toBeDefined();
      expect(result.atmosphericPressure!.value).toBeLessThan(101325);
      expect(result.atmosphericPressure!.unit).toBe('Pa');
    });

    it('should not modify input if atmospheric pressure is provided', () => {
      const input = {
        atmosphericPressure: { value: 101325, unit: 'Pa' },
        staticHead: { value: 5, unit: 'm' },
        losses: { value: 5000, unit: 'Pa' },
        flowRate: { value: 0.15, unit: 'm³/s' },
        npshCurve: sampleNPSHCurve,
        altitude: 1000,
      };

      const result = resolveAtmosphericPressure(input);

      expect(result.atmosphericPressure).toBe(input.atmosphericPressure);
    });

    it('should not modify input if no altitude provided', () => {
      const input = {
        atmosphericPressure: undefined,
        staticHead: { value: 5, unit: 'm' },
        losses: { value: 5000, unit: 'Pa' },
        flowRate: { value: 0.15, unit: 'm³/s' },
        npshCurve: sampleNPSHCurve,
      };

      const result = resolveAtmosphericPressure(input);

      expect(result.atmosphericPressure).toBeUndefined();
    });
  });
});
