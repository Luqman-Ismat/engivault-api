import { describe, it, expect } from 'vitest';
import {
  particleReynolds,
  archimedesNumber,
  dragCoefficient,
  settlingVelocity,
  durandFactor,
  slurryHeadloss,
  calculateSettlingVelocity,
  calculateSlurryHeadloss,
  SlurryFlowInput,
} from './slurries';

describe('Slurries Module', () => {
  describe('particleReynolds', () => {
    it('should calculate particle Reynolds number correctly', () => {
      const fluidDensity = 1000; // kg/m³
      const settlingVelocity = 0.01; // m/s
      const particleDiameter = 0.001; // m
      const fluidViscosity = 0.001; // Pa·s

      const re = particleReynolds(
        fluidDensity,
        settlingVelocity,
        particleDiameter,
        fluidViscosity
      );

      // Re = ρ_f * V_s * d_p / μ_f
      // Re = 1000 * 0.01 * 0.001 / 0.001 = 10
      expect(re).toBe(10);
    });

    it('should handle zero settling velocity', () => {
      const re = particleReynolds(1000, 0, 0.001, 0.001);
      expect(re).toBe(0);
    });
  });

  describe('archimedesNumber', () => {
    it('should calculate Archimedes number correctly', () => {
      const particleDensity = 2650; // kg/m³ (sand)
      const fluidDensity = 1000; // kg/m³ (water)
      const particleDiameter = 0.001; // m
      const fluidViscosity = 0.001; // Pa·s

      const ar = archimedesNumber(
        particleDensity,
        fluidDensity,
        particleDiameter,
        fluidViscosity
      );

      // Ar = (ρ_p - ρ_f) * ρ_f * g * d_p³ / μ_f²
      // Ar = (2650 - 1000) * 1000 * 9.81 * (0.001)³ / (0.001)²
      // Ar = 1650 * 1000 * 9.81 * 1e-9 / 1e-6
      // Ar = 16186.5
      expect(ar).toBeCloseTo(16186.5, 0);
    });

    it('should handle equal densities', () => {
      const ar = archimedesNumber(1000, 1000, 0.001, 0.001);
      expect(ar).toBe(0);
    });
  });

  describe('dragCoefficient', () => {
    it('should return correct drag coefficient for Stokes regime', () => {
      const cd = dragCoefficient(0.05); // Re < 0.1
      expect(cd).toBeCloseTo(24 / 0.05, 2);
    });

    it('should return correct drag coefficient for intermediate regime', () => {
      const cd = dragCoefficient(100); // 0.1 < Re < 1000
      const expected = (24 / 100) * (1 + 0.15 * Math.pow(100, 0.687));
      expect(cd).toBeCloseTo(expected, 2);
    });

    it('should return correct drag coefficient for Newton regime', () => {
      const cd = dragCoefficient(2000); // Re > 1000
      expect(cd).toBe(0.44);
    });
  });

  describe('settlingVelocity', () => {
    it('should calculate Stokes regime settling velocity correctly', () => {
      const particleDensity = 2650; // kg/m³ (sand)
      const fluidDensity = 1000; // kg/m³ (water)
      const particleDiameter = 0.0001; // m (100 μm)
      const fluidViscosity = 0.001; // Pa·s

      const result = settlingVelocity(
        particleDensity,
        fluidDensity,
        particleDiameter,
        fluidViscosity
      );

      // V_s = (ρ_p - ρ_f) * g * d_p² / (18 * μ_f)
      // V_s = (2650 - 1000) * 9.81 * (0.0001)² / (18 * 0.001)
      // V_s = 1650 * 9.81 * 1e-8 / 0.018
      // V_s = 0.009 m/s
      expect(result.velocity).toBeCloseTo(0.009, 3);
      expect(result.method).toBe('stokes');
    });

    it('should calculate intermediate regime settling velocity correctly', () => {
      const particleDensity = 2650; // kg/m³ (sand)
      const fluidDensity = 1000; // kg/m³ (water)
      const particleDiameter = 0.001; // m (1 mm)
      const fluidViscosity = 0.001; // Pa·s

      const result = settlingVelocity(
        particleDensity,
        fluidDensity,
        particleDiameter,
        fluidViscosity
      );

      expect(result.method).toBe('intermediate');
      expect(result.velocity).toBeGreaterThan(0);
    });

    it('should calculate Newton regime settling velocity correctly', () => {
      const particleDensity = 2650; // kg/m³ (sand)
      const fluidDensity = 1000; // kg/m³ (water)
      const particleDiameter = 0.01; // m (10 mm)
      const fluidViscosity = 0.001; // Pa·s

      const result = settlingVelocity(
        particleDensity,
        fluidDensity,
        particleDiameter,
        fluidViscosity
      );

      // V_s = sqrt(3.1 * (ρ_p - ρ_f) * g * d_p / ρ_f)
      // V_s = sqrt(3.1 * 1650 * 9.81 * 0.01 / 1000)
      // V_s = sqrt(0.5) = 0.707 m/s
      expect(result.velocity).toBeCloseTo(0.707, 2);
      expect(result.method).toBe('newton');
    });

    it('should apply shape factor correction', () => {
      const particleDensity = 2650;
      const fluidDensity = 1000;
      const particleDiameter = 0.001;
      const fluidViscosity = 0.001;

      const spherical = settlingVelocity(
        particleDensity,
        fluidDensity,
        particleDiameter,
        fluidViscosity,
        1.0
      );
      const angular = settlingVelocity(
        particleDensity,
        fluidDensity,
        particleDiameter,
        fluidViscosity,
        1.5
      );
      const flat = settlingVelocity(
        particleDensity,
        fluidDensity,
        particleDiameter,
        fluidViscosity,
        2.0
      );

      // Angular particles should settle slower than spherical
      expect(angular.velocity).toBeLessThan(spherical.velocity);
      // Flat particles should settle even slower
      expect(flat.velocity).toBeLessThan(angular.velocity);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => settlingVelocity(0, 1000, 0.001, 0.001)).toThrow(
        'All input parameters must be positive'
      );
      expect(() => settlingVelocity(1000, 1000, 0.001, 0.001)).toThrow(
        'Particle density must be greater than fluid density'
      );
      expect(() => settlingVelocity(2650, 1000, 0.001, 0.001, 0)).toThrow(
        'Shape factor must be positive'
      );
    });
  });

  describe('durandFactor', () => {
    it('should calculate Durand factor correctly', () => {
      const settlingVelocity = 0.01; // m/s
      const pipeDiameter = 0.1; // m
      const flowVelocity = 2.0; // m/s
      const concentration = 0.1; // 10%

      const durandFactorValue = durandFactor(
        settlingVelocity,
        pipeDiameter,
        flowVelocity,
        concentration
      );

      // C_D = 180 * (V_s / V) * (g * D / V²)^0.5 * C_v^0.5
      // C_D = 180 * (0.01 / 2.0) * (9.81 * 0.1 / 4.0)^0.5 * 0.1^0.5
      // C_D = 180 * 0.005 * 0.495 * 0.316
      // C_D = 0.14
      expect(durandFactorValue).toBeCloseTo(0.14, 2);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => durandFactor(0.01, 0.1, 0, 0.1)).toThrow(
        'Flow velocity must be positive'
      );
      expect(() => durandFactor(0.01, 0.1, 2.0, 0)).toThrow(
        'Concentration must be between 0 and 1'
      );
      expect(() => durandFactor(0.01, 0.1, 2.0, 1.0)).toThrow(
        'Concentration must be between 0 and 1'
      );
    });
  });

  describe('slurryHeadloss', () => {
    it('should calculate slurry headloss correctly', () => {
      const carrierDensity = 1000; // kg/m³
      const carrierViscosity = 0.001; // Pa·s
      const flowVelocity = 2.0; // m/s
      const pipeDiameter = 0.1; // m
      const pipeLength = 100; // m
      const pipeRoughness = 0.000045; // m (steel)
      const settlingVelocity = 0.01; // m/s
      const concentration = 0.1; // 10%

      const result = slurryHeadloss(
        carrierDensity,
        carrierViscosity,
        flowVelocity,
        pipeDiameter,
        pipeLength,
        pipeRoughness,
        settlingVelocity,
        concentration
      );

      expect(result.headloss).toBeGreaterThan(0);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.durandFactor).toBeGreaterThan(0);
      expect(result.froudeNumber).toBeGreaterThan(0);
    });

    it('should throw error for invalid inputs', () => {
      expect(() =>
        slurryHeadloss(0, 0.001, 2.0, 0.1, 100, 0.000045, 0.01, 0.1)
      ).toThrow('All input parameters must be positive');
      expect(() =>
        slurryHeadloss(1000, 0.001, 2.0, 0.1, 100, 0.000045, 0.01, 0)
      ).toThrow('Concentration must be between 0 and 1');
    });
  });

  describe('calculateSettlingVelocity', () => {
    it('should calculate settling velocity with full input', () => {
      const input: SlurryFlowInput = {
        slurry: {
          carrierFluid: {
            density: { value: 1000, unit: 'kg/m³' },
            viscosity: { value: 0.001, unit: 'Pa·s' },
          },
          particles: {
            density: { value: 2650, unit: 'kg/m³' },
            diameter: { value: 0.001, unit: 'm' },
            shape: 'spherical',
          },
          concentration: { value: 0.1, unit: 'dimensionless' },
          concentrationType: 'volume',
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
        },
        velocity: { value: 2.0, unit: 'm/s' },
      };

      const result = calculateSettlingVelocity(input);

      expect(result.settlingVelocity.value).toBeGreaterThan(0);
      expect(result.reynoldsNumber).toBeGreaterThan(0);
      expect(result.dragCoefficient).toBeGreaterThan(0);
      expect(['stokes', 'intermediate', 'newton']).toContain(result.method);
      expect(result.metadata.calculations.particleReynolds).toBeGreaterThan(0);
      expect(result.metadata.calculations.archimedesNumber).toBeGreaterThan(0);
      expect(result.metadata.calculations.shapeFactor).toBe(1.0);
    });

    it('should handle different particle shapes', () => {
      const input: SlurryFlowInput = {
        slurry: {
          carrierFluid: {
            density: { value: 1000, unit: 'kg/m³' },
            viscosity: { value: 0.001, unit: 'Pa·s' },
          },
          particles: {
            density: { value: 2650, unit: 'kg/m³' },
            diameter: { value: 0.001, unit: 'm' },
            shape: 'angular',
          },
          concentration: { value: 0.1, unit: 'dimensionless' },
          concentrationType: 'volume',
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
        },
        velocity: { value: 2.0, unit: 'm/s' },
      };

      const result = calculateSettlingVelocity(input);

      expect(result.metadata.calculations.shapeFactor).toBe(1.5);
    });
  });

  describe('calculateSlurryHeadloss - Concentration Effects', () => {
    it('should show concentration effects on headloss', () => {
      const baseInput: SlurryFlowInput = {
        slurry: {
          carrierFluid: {
            density: { value: 1000, unit: 'kg/m³' },
            viscosity: { value: 0.001, unit: 'Pa·s' },
          },
          particles: {
            density: { value: 2650, unit: 'kg/m³' },
            diameter: { value: 0.001, unit: 'm' },
            shape: 'spherical',
          },
          concentration: { value: 0.05, unit: 'dimensionless' },
          concentrationType: 'volume',
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
        },
        velocity: { value: 2.0, unit: 'm/s' },
      };

      const lowConcentration = calculateSlurryHeadloss(baseInput);

      // Test higher concentration
      const highConcentrationInput = {
        ...baseInput,
        slurry: {
          ...baseInput.slurry,
          concentration: { value: 0.15, unit: 'dimensionless' },
        },
      };
      const highConcentration = calculateSlurryHeadloss(highConcentrationInput);

      // Higher concentration should result in higher headloss
      expect(highConcentration.headloss.value).toBeGreaterThan(
        lowConcentration.headloss.value
      );
      expect(highConcentration.concentrationEffect).toBeGreaterThan(
        lowConcentration.concentrationEffect
      );
    });

    it('should handle volume concentration correctly', () => {
      const input: SlurryFlowInput = {
        slurry: {
          carrierFluid: {
            density: { value: 1000, unit: 'kg/m³' },
            viscosity: { value: 0.001, unit: 'Pa·s' },
          },
          particles: {
            density: { value: 2650, unit: 'kg/m³' },
            diameter: { value: 0.001, unit: 'm' },
            shape: 'spherical',
          },
          concentration: { value: 0.1, unit: 'dimensionless' },
          concentrationType: 'volume',
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
        },
        velocity: { value: 2.0, unit: 'm/s' },
      };

      const result = calculateSlurryHeadloss(input);

      expect(result.metadata.calculations.concentration).toBe(0.1);
      expect(result.headloss.value).toBeGreaterThan(0);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.durandFactor).toBeGreaterThan(0);
      expect(result.froudeNumber).toBeGreaterThan(0);
      expect(result.concentrationEffect).toBeGreaterThan(1.0);
    });

    it('should handle weight concentration correctly', () => {
      const input: SlurryFlowInput = {
        slurry: {
          carrierFluid: {
            density: { value: 1000, unit: 'kg/m³' },
            viscosity: { value: 0.001, unit: 'Pa·s' },
          },
          particles: {
            density: { value: 2650, unit: 'kg/m³' },
            diameter: { value: 0.001, unit: 'm' },
            shape: 'spherical',
          },
          concentration: { value: 0.2, unit: 'dimensionless' }, // 20% by weight
          concentrationType: 'weight',
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
        },
        velocity: { value: 2.0, unit: 'm/s' },
      };

      const result = calculateSlurryHeadloss(input);

      // Weight fraction should be converted to volume fraction
      expect(result.metadata.calculations.concentration).toBeLessThan(0.2);
      expect(result.metadata.calculations.concentration).toBeGreaterThan(0);
    });

    it('should generate warnings for high concentration', () => {
      const input: SlurryFlowInput = {
        slurry: {
          carrierFluid: {
            density: { value: 1000, unit: 'kg/m³' },
            viscosity: { value: 0.001, unit: 'Pa·s' },
          },
          particles: {
            density: { value: 2650, unit: 'kg/m³' },
            diameter: { value: 0.001, unit: 'm' },
            shape: 'spherical',
          },
          concentration: { value: 0.2, unit: 'dimensionless' }, // 20% volume
          concentrationType: 'volume',
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
        },
        velocity: { value: 2.0, unit: 'm/s' },
      };

      const result = calculateSlurryHeadloss(input);

      // Should have warnings for high concentration
      const hasHighConcentrationWarning = result.warnings.some(
        w =>
          typeof w === 'object' &&
          'message' in w &&
          w.message.includes('High concentration')
      );
      expect(hasHighConcentrationWarning).toBe(true);
    });

    it('should generate warnings for extreme Froude numbers', () => {
      const input: SlurryFlowInput = {
        slurry: {
          carrierFluid: {
            density: { value: 1000, unit: 'kg/m³' },
            viscosity: { value: 0.001, unit: 'Pa·s' },
          },
          particles: {
            density: { value: 2650, unit: 'kg/m³' },
            diameter: { value: 0.001, unit: 'm' },
            shape: 'spherical',
          },
          concentration: { value: 0.1, unit: 'dimensionless' },
          concentrationType: 'volume',
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
        },
        velocity: { value: 0.5, unit: 'm/s' }, // Low velocity for low Froude number
      };

      const result = calculateSlurryHeadloss(input);

      // Should have warnings for low Froude number
      const hasFroudeWarning = result.warnings.some(
        w =>
          typeof w === 'object' &&
          'message' in w &&
          w.message.includes('Froude number')
      );
      expect(hasFroudeWarning).toBe(true);
    });

    it('should handle different particle sizes', () => {
      const smallParticleInput: SlurryFlowInput = {
        slurry: {
          carrierFluid: {
            density: { value: 1000, unit: 'kg/m³' },
            viscosity: { value: 0.001, unit: 'Pa·s' },
          },
          particles: {
            density: { value: 2650, unit: 'kg/m³' },
            diameter: { value: 0.0001, unit: 'm' }, // 100 μm
            shape: 'spherical',
          },
          concentration: { value: 0.1, unit: 'dimensionless' },
          concentrationType: 'volume',
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
        },
        velocity: { value: 2.0, unit: 'm/s' },
      };

      const largeParticleInput: SlurryFlowInput = {
        ...smallParticleInput,
        slurry: {
          ...smallParticleInput.slurry,
          particles: {
            ...smallParticleInput.slurry.particles,
            diameter: { value: 0.005, unit: 'm' }, // 5 mm
          },
        },
      };

      const smallResult = calculateSlurryHeadloss(smallParticleInput);
      const largeResult = calculateSlurryHeadloss(largeParticleInput);

      // Larger particles should have higher settling velocity and different headloss
      expect(
        largeResult.metadata.calculations.settlingVelocity
      ).toBeGreaterThan(smallResult.metadata.calculations.settlingVelocity);
    });
  });
});
