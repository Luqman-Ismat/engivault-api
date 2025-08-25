import { describe, it, expect } from 'vitest';
import {
  waterProps,
  airProps,
  antoineVaporPressure,
  getFluidDefaults,
  getAntoineCoefficients,
  ANTOINE_COEFFICIENTS,
  type AntoineCoefficients,
} from './index';

describe('Fluid Properties', () => {
  describe('waterProps', () => {
    it('should return valid water properties at 20°C', () => {
      const T_K = 293.15; // 20°C
      const props = waterProps(T_K);

      expect(props.density.unit).toBe('kg/m³');
      expect(props.viscosity.unit).toBe('Pa·s');
      expect(props.vaporPressure?.unit).toBe('Pa');

      // Density should be around 994 kg/m³ at 20°C
      expect(props.density.value).toBeCloseTo(994, 0);
      // Viscosity should be around 0.64e-3 Pa·s at 20°C
      expect(props.viscosity.value).toBeCloseTo(0.64e-3, 4);
      // Vapor pressure should be around 2330 Pa at 20°C
      expect(props.vaporPressure?.value).toBeCloseTo(2330, 0);
    });

    it('should return valid water properties at 100°C', () => {
      const T_K = 373.15; // 100°C
      const props = waterProps(T_K);

      // Density should be around 920 kg/m³ at 100°C
      expect(props.density.value).toBeCloseTo(920, 0);
      // Viscosity should be around 0.28e-3 Pa·s at 100°C
      expect(props.viscosity.value).toBeCloseTo(0.28e-3, 4);
      // Vapor pressure should be around 101336 Pa at 100°C
      expect(props.vaporPressure?.value).toBeCloseTo(101336, 0);
    });

    it('should show monotonic density decrease with temperature', () => {
      const temps = [273.15, 293.15, 313.15, 333.15, 353.15, 373.15]; // 0-100°C
      const densities = temps.map(T => waterProps(T).density.value);

      // Check that density decreases monotonically
      for (let i = 1; i < densities.length; i++) {
        expect(densities[i]).toBeLessThan(densities[i - 1]);
      }
    });

    it('should show monotonic viscosity decrease with temperature', () => {
      const temps = [273.15, 293.15, 313.15, 333.15, 353.15, 373.15]; // 0-100°C
      const viscosities = temps.map(T => waterProps(T).viscosity.value);

      // Check that viscosity decreases monotonically
      for (let i = 1; i < viscosities.length; i++) {
        expect(viscosities[i]).toBeLessThan(viscosities[i - 1]);
      }
    });

    it('should show exponential vapor pressure increase with temperature', () => {
      const temps = [273.15, 283.15, 293.15, 303.15, 313.15, 323.15]; // 0-50°C
      const vaporPressures = temps.map(T => waterProps(T).vaporPressure!.value);

      // Check that vapor pressure increases exponentially
      for (let i = 1; i < vaporPressures.length; i++) {
        expect(vaporPressures[i]).toBeGreaterThan(vaporPressures[i - 1]);
        // Each step should be larger than the previous step (exponential growth)
        if (i > 1) {
          const step1 = vaporPressures[i] - vaporPressures[i - 1];
          const step2 = vaporPressures[i - 1] - vaporPressures[i - 2];
          expect(step1).toBeGreaterThan(step2);
        }
      }
    });

    it('should maintain reasonable density range (920-1000 kg/m³)', () => {
      const temps = [273.15, 293.15, 313.15, 333.15, 353.15, 373.15]; // 0-100°C
      const densities = temps.map(T => waterProps(T).density.value);

      densities.forEach(density => {
        expect(density).toBeGreaterThanOrEqual(920);
        expect(density).toBeLessThanOrEqual(1000);
      });
    });

    it('should maintain reasonable viscosity range (0.2-1.8 mPa·s)', () => {
      const temps = [273.15, 293.15, 313.15, 333.15, 353.15, 373.15]; // 0-100°C
      const viscosities = temps.map(T => waterProps(T).viscosity.value);

      viscosities.forEach(viscosity => {
        expect(viscosity).toBeGreaterThan(0.2e-3);
        expect(viscosity).toBeLessThan(1.8e-3);
      });
    });
  });

  describe('airProps', () => {
    it('should return valid air properties at 20°C and 1 atm', () => {
      const T_K = 293.15; // 20°C
      const P_Pa = 101325; // 1 atm
      const props = airProps(T_K, P_Pa);

      expect(props.density.unit).toBe('kg/m³');
      expect(props.viscosity.unit).toBe('Pa·s');
      expect(props.vaporPressure).toBeUndefined(); // Air doesn't have vapor pressure

      // Density should be around 1.2 kg/m³ at 20°C and 1 atm
      expect(props.density.value).toBeCloseTo(1.2, 1);
      // Viscosity should be around 1.8e-5 Pa·s at 20°C
      expect(props.viscosity.value).toBeCloseTo(1.8e-5, 6);
    });

    it('should return valid air properties at 100°C and 1 atm', () => {
      const T_K = 373.15; // 100°C
      const P_Pa = 101325; // 1 atm
      const props = airProps(T_K, P_Pa);

      // Density should be around 0.95 kg/m³ at 100°C and 1 atm
      expect(props.density.value).toBeCloseTo(0.95, 1);
      // Viscosity should be around 2.2e-5 Pa·s at 100°C
      expect(props.viscosity.value).toBeCloseTo(2.2e-5, 6);
    });

    it('should show density decrease with temperature (ideal gas law)', () => {
      const temps = [273.15, 293.15, 313.15, 333.15, 353.15, 373.15]; // 0-100°C
      const densities = temps.map(T => airProps(T).density.value);

      // Check that density decreases with temperature
      for (let i = 1; i < densities.length; i++) {
        expect(densities[i]).toBeLessThan(densities[i - 1]);
      }
    });

    it('should show density increase with pressure (ideal gas law)', () => {
      const pressures = [50000, 75000, 101325, 150000, 200000]; // Pa
      const densities = pressures.map(P => airProps(293.15, P).density.value);

      // Check that density increases with pressure
      for (let i = 1; i < densities.length; i++) {
        expect(densities[i]).toBeGreaterThan(densities[i - 1]);
      }
    });

    it('should show viscosity increase with temperature (Sutherland law)', () => {
      const temps = [273.15, 293.15, 313.15, 333.15, 353.15, 373.15]; // 0-100°C
      const viscosities = temps.map(T => airProps(T).viscosity.value);

      // Check that viscosity increases with temperature
      for (let i = 1; i < viscosities.length; i++) {
        expect(viscosities[i]).toBeGreaterThan(viscosities[i - 1]);
      }
    });

    it('should maintain reasonable density range (0.5-1.5 kg/m³)', () => {
      const temps = [273.15, 293.15, 313.15, 333.15, 353.15, 373.15]; // 0-100°C
      const densities = temps.map(T => airProps(T).density.value);

      densities.forEach(density => {
        expect(density).toBeGreaterThan(0.5);
        expect(density).toBeLessThan(1.5);
      });
    });

    it('should maintain reasonable viscosity range (1.5-2.5e-5 Pa·s)', () => {
      const temps = [273.15, 293.15, 313.15, 333.15, 353.15, 373.15]; // 0-100°C
      const viscosities = temps.map(T => airProps(T).viscosity.value);

      viscosities.forEach(viscosity => {
        expect(viscosity).toBeGreaterThan(1.5e-5);
        expect(viscosity).toBeLessThan(2.5e-5);
      });
    });

    it('should use default pressure of 101325 Pa', () => {
      const T_K = 293.15; // 20°C
      const props1 = airProps(T_K);
      const props2 = airProps(T_K, 101325);

      expect(props1.density.value).toBeCloseTo(props2.density.value, 6);
      expect(props1.viscosity.value).toBeCloseTo(props2.viscosity.value, 6);
    });
  });

  describe('antoineVaporPressure', () => {
    it('should calculate water vapor pressure correctly', () => {
      const T_C = 20; // 20°C
      const coeffs: AntoineCoefficients = {
        A: 8.07131,
        B: 1730.63,
        C: 233.426,
      };

      const vaporPressure = antoineVaporPressure(T_C, coeffs);
      expect(vaporPressure).toBeCloseTo(2330, 0); // ~2330 Pa at 20°C
    });

    it('should calculate ethanol vapor pressure correctly', () => {
      const T_C = 25; // 25°C
      const coeffs = ANTOINE_COEFFICIENTS.ethanol;

      const vaporPressure = antoineVaporPressure(T_C, coeffs);
      expect(vaporPressure).toBeCloseTo(7833, 0); // ~7833 Pa at 25°C
    });

    it('should show exponential increase with temperature', () => {
      const temps = [0, 10, 20, 30, 40, 50]; // °C
      const coeffs = ANTOINE_COEFFICIENTS.water;
      const vaporPressures = temps.map(T => antoineVaporPressure(T, coeffs));

      // Check that vapor pressure increases exponentially
      for (let i = 1; i < vaporPressures.length; i++) {
        expect(vaporPressures[i]).toBeGreaterThan(vaporPressures[i - 1]);
        // Each step should be larger than the previous step
        if (i > 1) {
          const step1 = vaporPressures[i] - vaporPressures[i - 1];
          const step2 = vaporPressures[i - 1] - vaporPressures[i - 2];
          expect(step1).toBeGreaterThan(step2);
        }
      }
    });

    it('should handle negative temperatures', () => {
      const T_C = -10; // -10°C
      const coeffs = ANTOINE_COEFFICIENTS.water;

      const vaporPressure = antoineVaporPressure(T_C, coeffs);
      expect(vaporPressure).toBeGreaterThan(0);
      expect(vaporPressure).toBeLessThan(1000); // Should be low at -10°C
    });
  });

  describe('getFluidDefaults', () => {
    it('should return water properties with defaults', () => {
      const T_K = 293.15; // 20°C
      const props = getFluidDefaults('water', T_K);

      expect(props.density.unit).toBe('kg/m³');
      expect(props.viscosity.unit).toBe('Pa·s');
      expect(props.vaporPressure?.unit).toBe('Pa');
      expect(props.density.value).toBeCloseTo(994, 0);
    });

    it('should return air properties with defaults', () => {
      const T_K = 293.15; // 20°C
      const props = getFluidDefaults('air', T_K);

      expect(props.density.unit).toBe('kg/m³');
      expect(props.viscosity.unit).toBe('Pa·s');
      expect(props.vaporPressure).toBeUndefined();
      expect(props.density.value).toBeCloseTo(1.2, 1);
    });

    it('should apply overrides correctly', () => {
      const T_K = 293.15; // 20°C
      const overrides = {
        density: { value: 999, unit: 'kg/m³' },
        viscosity: { value: 0.001, unit: 'Pa·s' },
      };

      const props = getFluidDefaults('water', T_K, overrides);

      expect(props.density.value).toBe(999);
      expect(props.viscosity.value).toBe(0.001);
      expect(props.vaporPressure?.value).toBeCloseTo(2330, 0); // Should use default
    });

    it('should handle case-insensitive fluid names', () => {
      const T_K = 293.15; // 20°C
      const props1 = getFluidDefaults('WATER', T_K);
      const props2 = getFluidDefaults('water', T_K);

      expect(props1.density.value).toBeCloseTo(props2.density.value, 6);
      expect(props1.viscosity.value).toBeCloseTo(props2.viscosity.value, 6);
    });

    it('should throw error for unknown fluids', () => {
      const T_K = 293.15; // 20°C
      expect(() => getFluidDefaults('unknown', T_K)).toThrow(
        'Unknown fluid: unknown'
      );
    });
  });

  describe('getAntoineCoefficients', () => {
    it('should return coefficients for known substances', () => {
      const waterCoeffs = getAntoineCoefficients('water');
      expect(waterCoeffs.A).toBe(8.07131);
      expect(waterCoeffs.B).toBe(1730.63);
      expect(waterCoeffs.C).toBe(233.426);

      const ethanolCoeffs = getAntoineCoefficients('ethanol');
      expect(ethanolCoeffs.A).toBe(8.20417);
      expect(ethanolCoeffs.B).toBe(1642.89);
      expect(ethanolCoeffs.C).toBe(230.3);
    });

    it('should handle case-insensitive substance names', () => {
      const coeffs1 = getAntoineCoefficients('WATER');
      const coeffs2 = getAntoineCoefficients('water');

      expect(coeffs1).toEqual(coeffs2);
    });

    it('should throw error for unknown substances', () => {
      expect(() => getAntoineCoefficients('unknown')).toThrow(
        'No Antoine coefficients available for: unknown'
      );
    });
  });

  describe('ANTOINE_COEFFICIENTS', () => {
    it('should contain coefficients for multiple substances', () => {
      expect(ANTOINE_COEFFICIENTS).toHaveProperty('water');
      expect(ANTOINE_COEFFICIENTS).toHaveProperty('ethanol');
      expect(ANTOINE_COEFFICIENTS).toHaveProperty('methanol');
      expect(ANTOINE_COEFFICIENTS).toHaveProperty('benzene');
      expect(ANTOINE_COEFFICIENTS).toHaveProperty('toluene');
    });

    it('should have valid coefficient structure', () => {
      Object.values(ANTOINE_COEFFICIENTS).forEach(coeffs => {
        expect(coeffs).toHaveProperty('A');
        expect(coeffs).toHaveProperty('B');
        expect(coeffs).toHaveProperty('C');
        expect(typeof coeffs.A).toBe('number');
        expect(typeof coeffs.B).toBe('number');
        expect(typeof coeffs.C).toBe('number');
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very low temperatures', () => {
      const T_K = 273.15; // 0°C
      const waterProps = getFluidDefaults('water', T_K);
      const airProps = getFluidDefaults('air', T_K);

      expect(waterProps.density.value).toBeGreaterThan(0);
      expect(airProps.density.value).toBeGreaterThan(0);
      expect(waterProps.viscosity.value).toBeGreaterThan(0);
      expect(airProps.viscosity.value).toBeGreaterThan(0);
    });

    it('should handle very high temperatures', () => {
      const T_K = 373.15; // 100°C
      const waterProps = getFluidDefaults('water', T_K);
      const airProps = getFluidDefaults('air', T_K);

      expect(waterProps.density.value).toBeGreaterThan(0);
      expect(airProps.density.value).toBeGreaterThan(0);
      expect(waterProps.viscosity.value).toBeGreaterThan(0);
      expect(airProps.viscosity.value).toBeGreaterThan(0);
    });

    it('should handle very low pressures for air', () => {
      const T_K = 293.15; // 20°C
      const P_Pa = 1000; // Very low pressure
      const props = airProps(T_K, P_Pa);

      expect(props.density.value).toBeGreaterThan(0);
      expect(props.density.value).toBeLessThan(0.1); // Should be very low
    });

    it('should handle very high pressures for air', () => {
      const T_K = 293.15; // 20°C
      const P_Pa = 1000000; // Very high pressure
      const props = airProps(T_K, P_Pa);

      expect(props.density.value).toBeGreaterThan(10); // Should be very high
    });
  });
});
