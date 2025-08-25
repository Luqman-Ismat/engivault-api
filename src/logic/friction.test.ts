import { describe, it, expect } from 'vitest';
import {
  reynolds,
  churchillF,
  darcyWeisbachDP,
  pressureDrop,
  colebrookWhiteF,
  swameeJainF,
  haalandF,
  flowRegime,
  laminarF,
  laminarPressureDrop,
} from './friction';

describe('Friction Calculations', () => {
  describe('reynolds', () => {
    it('should calculate Reynolds number correctly', () => {
      // Water at 20°C: ρ = 998 kg/m³, μ = 0.001 Pa·s
      // v = 2 m/s, D = 0.05 m
      const Re = reynolds(998, 2, 0.05, 0.001);
      // Re = (998 * 2 * 0.05) / 0.001 = 99,800
      expect(Re).toBeCloseTo(99800, 0);
    });

    it('should handle different fluid properties', () => {
      // Air at 20°C: ρ = 1.2 kg/m³, μ = 1.8e-5 Pa·s
      // v = 10 m/s, D = 0.1 m
      const Re = reynolds(1.2, 10, 0.1, 1.8e-5);
      // Re = (1.2 * 10 * 0.1) / 1.8e-5 = 66,667
      expect(Re).toBeCloseTo(66667, 0);
    });

    it('should handle zero velocity', () => {
      const Re = reynolds(998, 0, 0.05, 0.001);
      expect(Re).toBe(0);
    });

    it('should handle very small diameter', () => {
      const Re = reynolds(998, 1, 0.001, 0.001);
      // Re = (998 * 1 * 0.001) / 0.001 = 998
      expect(Re).toBe(998);
    });
  });

  describe('churchillF', () => {
    it('should calculate friction factor for laminar flow', () => {
      const Re = 1000; // Laminar flow
      const epsOverD = 0.001; // Smooth pipe
      const f = churchillF(Re, epsOverD);

      // For laminar flow, f should be close to 64/Re = 0.064
      expect(f).toBeCloseTo(0.064, 3);
    });

    it('should calculate friction factor for turbulent flow', () => {
      const Re = 100000; // Turbulent flow
      const epsOverD = 0.001; // Smooth pipe
      const f = churchillF(Re, epsOverD);

      // For turbulent flow in smooth pipe, f should be around 0.017-0.025
      expect(f).toBeGreaterThan(0.017);
      expect(f).toBeLessThan(0.025);
    });

    it('should handle rough pipes', () => {
      const Re = 100000; // Turbulent flow
      const epsOverD = 0.01; // Rough pipe
      const f = churchillF(Re, epsOverD);

      // For rough pipes, f should be higher than smooth pipes
      expect(f).toBeGreaterThan(0.017);
    });

    it('should throw error for zero Reynolds number', () => {
      expect(() => churchillF(0, 0.001)).toThrow(
        'Reynolds number cannot be zero'
      );
    });

    it('should handle very high Reynolds numbers', () => {
      const Re = 10000000; // Very high Reynolds number
      const epsOverD = 0.001;
      const f = churchillF(Re, epsOverD);

      expect(f).toBeGreaterThan(0);
      expect(f).toBeLessThan(0.1);
    });
  });

  describe('darcyWeisbachDP', () => {
    it('should calculate pressure drop correctly', () => {
      const rho = 998; // kg/m³ (water)
      const v = 2; // m/s
      const L = 100; // m
      const D = 0.05; // m
      const f = 0.02; // Darcy friction factor

      const dp = darcyWeisbachDP(rho, v, L, D, f);
      // ΔP = 0.02 * (100/0.05) * (998 * 2² / 2) = 0.02 * 2000 * 1996 = 79,840 Pa
      expect(dp).toBe(79840);
    });

    it('should handle different pipe lengths', () => {
      const rho = 998;
      const v = 1;
      const D = 0.05;
      const f = 0.02;

      const dp1 = darcyWeisbachDP(rho, v, 50, D, f);
      const dp2 = darcyWeisbachDP(rho, v, 100, D, f);

      expect(dp2).toBe(2 * dp1); // Pressure drop should be proportional to length
    });

    it('should handle different velocities', () => {
      const rho = 998;
      const L = 100;
      const D = 0.05;
      const f = 0.02;

      const dp1 = darcyWeisbachDP(rho, 1, L, D, f);
      const dp2 = darcyWeisbachDP(rho, 2, L, D, f);

      expect(dp2).toBe(4 * dp1); // Pressure drop should be proportional to velocity squared
    });
  });

  describe('pressureDrop', () => {
    it('should calculate complete pressure drop with automatic friction factor', () => {
      const rho = 998; // kg/m³ (water)
      const v = 2; // m/s
      const L = 100; // m
      const D = 0.05; // m
      const mu = 0.001; // Pa·s
      const epsOverD = 0.001; // Smooth pipe

      const dp = pressureDrop(rho, v, L, D, mu, epsOverD);

      // Should return a positive pressure drop
      expect(dp).toBeGreaterThan(0);
      expect(dp).toBeLessThan(100000); // Reasonable range for this case
    });

    it('should handle laminar flow pressure drop', () => {
      const rho = 998;
      const v = 0.1; // Low velocity for laminar flow
      const L = 10;
      const D = 0.01; // Small diameter
      const mu = 0.001;
      const epsOverD = 0.001;

      const dp = pressureDrop(rho, v, L, D, mu, epsOverD);

      expect(dp).toBeGreaterThan(0);
    });
  });

  describe('colebrookWhiteF', () => {
    it('should converge for turbulent flow', () => {
      const Re = 100000;
      const epsOverD = 0.001;
      const f = colebrookWhiteF(Re, epsOverD);

      expect(f).toBeGreaterThan(0);
      expect(f).toBeLessThan(0.1);
    });

    it('should handle rough pipes', () => {
      const Re = 100000;
      const epsOverD = 0.01;
      const f = colebrookWhiteF(Re, epsOverD);

      // Rough pipes should have higher friction factors
      expect(f).toBeGreaterThan(0.03);
    });

    it('should throw error for zero Reynolds number', () => {
      expect(() => colebrookWhiteF(0, 0.001)).toThrow(
        'Reynolds number cannot be zero'
      );
    });

    it('should converge with custom tolerance', () => {
      const Re = 100000;
      const epsOverD = 0.001;
      const f = colebrookWhiteF(Re, epsOverD, 1e-8);

      expect(f).toBeGreaterThan(0);
    });
  });

  describe('swameeJainF', () => {
    it('should calculate friction factor for turbulent flow', () => {
      const Re = 100000;
      const epsOverD = 0.001;
      const f = swameeJainF(Re, epsOverD);

      expect(f).toBeGreaterThan(0.018);
      expect(f).toBeLessThan(0.025);
    });

    it('should handle rough pipes', () => {
      const Re = 100000;
      const epsOverD = 0.01;
      const f = swameeJainF(Re, epsOverD);

      expect(f).toBeGreaterThan(0.03);
    });

    it('should throw error for zero Reynolds number', () => {
      expect(() => swameeJainF(0, 0.001)).toThrow(
        'Reynolds number cannot be zero'
      );
    });
  });

  describe('haalandF', () => {
    it('should calculate friction factor for turbulent flow', () => {
      const Re = 100000;
      const epsOverD = 0.001;
      const f = haalandF(Re, epsOverD);

      expect(f).toBeGreaterThan(0.018);
      expect(f).toBeLessThan(0.025);
    });

    it('should handle rough pipes', () => {
      const Re = 100000;
      const epsOverD = 0.01;
      const f = haalandF(Re, epsOverD);

      expect(f).toBeGreaterThan(0.03);
    });

    it('should throw error for zero Reynolds number', () => {
      expect(() => haalandF(0, 0.001)).toThrow(
        'Reynolds number cannot be zero'
      );
    });
  });

  describe('flowRegime', () => {
    it('should identify laminar flow', () => {
      expect(flowRegime(1000)).toBe('laminar');
      expect(flowRegime(2000)).toBe('laminar');
    });

    it('should identify transition flow', () => {
      expect(flowRegime(2500)).toBe('transition');
      expect(flowRegime(3500)).toBe('transition');
    });

    it('should identify turbulent flow', () => {
      expect(flowRegime(5000)).toBe('turbulent');
      expect(flowRegime(100000)).toBe('turbulent');
    });

    it('should handle boundary conditions', () => {
      expect(flowRegime(2300)).toBe('transition');
      expect(flowRegime(4000)).toBe('turbulent');
    });
  });

  describe('laminarF', () => {
    it('should calculate laminar friction factor correctly', () => {
      const Re = 1000;
      const f = laminarF(Re);
      // f = 64/Re = 64/1000 = 0.064
      expect(f).toBe(0.064);
    });

    it('should handle different Reynolds numbers', () => {
      expect(laminarF(500)).toBe(0.128);
      expect(laminarF(2000)).toBe(0.032);
    });

    it('should throw error for zero Reynolds number', () => {
      expect(() => laminarF(0)).toThrow('Reynolds number cannot be zero');
    });
  });

  describe('laminarPressureDrop', () => {
    it('should calculate laminar pressure drop correctly', () => {
      const mu = 0.001; // Pa·s
      const v = 1; // m/s
      const L = 10; // m
      const D = 0.01; // m

      const dp = laminarPressureDrop(mu, v, L, D);
      // ΔP = 32 * 0.001 * 1 * 10 / (0.01)² = 3200 Pa
      expect(dp).toBe(3200);
    });

    it('should handle different parameters', () => {
      const mu = 0.001;
      const v = 2;
      const L = 5;
      const D = 0.02;

      const dp = laminarPressureDrop(mu, v, L, D);
      // ΔP = 32 * 0.001 * 2 * 5 / (0.02)² = 800 Pa
      expect(dp).toBe(800);
    });
  });

  describe('Comparison of friction factor methods', () => {
    it('should give similar results for turbulent flow', () => {
      const Re = 100000;
      const epsOverD = 0.001;

      const fChurchill = churchillF(Re, epsOverD);
      const fSwameeJain = swameeJainF(Re, epsOverD);
      const fHaaland = haalandF(Re, epsOverD);
      const fColebrook = colebrookWhiteF(Re, epsOverD);

      // All methods should give similar results (within 25%)
      const tolerance = 0.25;
      expect(Math.abs(fChurchill - fSwameeJain) / fChurchill).toBeLessThan(
        tolerance
      );
      expect(Math.abs(fChurchill - fHaaland) / fChurchill).toBeLessThan(
        tolerance
      );
      expect(Math.abs(fChurchill - fColebrook) / fChurchill).toBeLessThan(
        tolerance
      );
    });

    it('should give exact results for laminar flow', () => {
      const Re = 1000;
      const epsOverD = 0.001;

      const fLaminar = laminarF(Re);
      const fChurchill = churchillF(Re, epsOverD);

      // Churchill should give exact laminar result for low Re
      expect(fChurchill).toBeCloseTo(fLaminar, 3);
    });
  });

  describe('Known values and validation', () => {
    it('should match textbook examples for smooth pipe', () => {
      // Example: Water flow in smooth pipe
      const Re = 100000;
      const epsOverD = 0.000001; // Very smooth pipe

      const f = churchillF(Re, epsOverD);

      // For smooth pipe at Re = 100,000, f should be around 0.017-0.020
      expect(f).toBeGreaterThan(0.017);
      expect(f).toBeLessThan(0.02);
    });

    it('should match textbook examples for rough pipe', () => {
      // Example: Commercial steel pipe
      const Re = 100000;
      const epsOverD = 0.000045; // Commercial steel

      const f = churchillF(Re, epsOverD);

      // For commercial steel at Re = 100,000, f should be around 0.017-0.025
      expect(f).toBeGreaterThan(0.017);
      expect(f).toBeLessThan(0.025);
    });

    it('should handle extreme roughness', () => {
      const Re = 100000;
      const epsOverD = 0.01; // Very rough pipe

      const f = churchillF(Re, epsOverD);

      // Very rough pipes should have higher friction factors than smooth pipes
      expect(f).toBeGreaterThan(0.017);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very small Reynolds numbers', () => {
      const Re = 1;
      const epsOverD = 0.001;

      const f = churchillF(Re, epsOverD);
      expect(f).toBeGreaterThan(0);
      expect(f).toBeLessThan(100); // Should not be unreasonably large
    });

    it('should handle very large Reynolds numbers', () => {
      const Re = 10000000;
      const epsOverD = 0.001;

      const f = churchillF(Re, epsOverD);
      expect(f).toBeGreaterThan(0);
      expect(f).toBeLessThan(0.1);
    });

    it('should handle zero roughness', () => {
      const Re = 100000;
      const epsOverD = 0;

      const f = churchillF(Re, epsOverD);
      expect(f).toBeGreaterThan(0);
      expect(f).toBeLessThan(0.1);
    });

    it('should handle very high roughness', () => {
      const Re = 100000;
      const epsOverD = 0.1; // Very rough

      const f = churchillF(Re, epsOverD);
      expect(f).toBeGreaterThan(0.017);
    });
  });
});
