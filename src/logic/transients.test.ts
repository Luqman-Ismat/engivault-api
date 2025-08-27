import { describe, it, expect } from 'vitest';
import {
  pressureSurge,
  calculateWaveSpeed,
  joukowskySurge,
  getPipeMaterial,
  getAvailablePipeMaterials,
  calculateWaveSpeedForMaterial,
  type JoukowskyInput,
} from './transients';

describe('Transients Module', () => {
  describe('pressureSurge', () => {
    it('should calculate pressure surge correctly using Joukowsky equation', () => {
      const fluidDensity = 998; // kg/m³ (water)
      const waveSpeed = 1200; // m/s
      const velocityChange = 2; // m/s (deceleration)

      const surge = pressureSurge(fluidDensity, waveSpeed, velocityChange);

      // ΔP = ρ * a * ΔV = 998 * 1200 * 2 = 2,395,200 Pa
      expect(surge).toBe(2_395_200);
    });

    it('should handle negative velocity change (acceleration)', () => {
      const fluidDensity = 998; // kg/m³
      const waveSpeed = 1200; // m/s
      const velocityChange = -1.5; // m/s (acceleration)

      const surge = pressureSurge(fluidDensity, waveSpeed, velocityChange);

      // ΔP = ρ * a * ΔV = 998 * 1200 * (-1.5) = -1,796,400 Pa
      expect(surge).toBe(-1_796_400);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => pressureSurge(0, 1200, 2)).toThrow(
        'Fluid density must be positive'
      );
      expect(() => pressureSurge(998, 0, 2)).toThrow(
        'Wave speed must be positive'
      );
      expect(() => pressureSurge(-998, 1200, 2)).toThrow(
        'Fluid density must be positive'
      );
    });
  });

  describe('calculateWaveSpeed', () => {
    it('should calculate wave speed for steel pipe correctly', () => {
      const fluidDensity = 998; // kg/m³ (water)
      const fluidBulkModulus = 2.2e9; // Pa (water)
      const pipeElasticModulus = 200e9; // Pa (steel)
      const pipeDiameter = 0.2; // m
      const wallThickness = 0.01; // m

      const waveSpeed = calculateWaveSpeed(
        fluidDensity,
        fluidBulkModulus,
        pipeElasticModulus,
        pipeDiameter,
        wallThickness
      );

      // Expected wave speed for steel pipe with water should be around 1200-1400 m/s
      expect(waveSpeed).toBeGreaterThan(1000);
      expect(waveSpeed).toBeLessThan(1500);
      expect(waveSpeed).toBeCloseTo(1344, -2); // Within 100 m/s
    });

    it('should calculate wave speed for plastic pipe correctly', () => {
      const fluidDensity = 998; // kg/m³ (water)
      const fluidBulkModulus = 2.2e9; // Pa (water)
      const pipeElasticModulus = 3.3e9; // Pa (PVC)
      const pipeDiameter = 0.1; // m
      const wallThickness = 0.005; // m

      const waveSpeed = calculateWaveSpeed(
        fluidDensity,
        fluidBulkModulus,
        pipeElasticModulus,
        pipeDiameter,
        wallThickness
      );

      // Expected wave speed for PVC pipe with water should be around 400-600 m/s
      expect(waveSpeed).toBeGreaterThan(300);
      expect(waveSpeed).toBeLessThan(700);
      expect(waveSpeed).toBeCloseTo(392, -2); // Within 100 m/s
    });

    it('should throw error for invalid pipe geometry', () => {
      const fluidDensity = 998;
      const fluidBulkModulus = 2.2e9;
      const pipeElasticModulus = 200e9;
      const pipeDiameter = 0.2;
      const wallThickness = 0.15; // Greater than radius

      expect(() =>
        calculateWaveSpeed(
          fluidDensity,
          fluidBulkModulus,
          pipeElasticModulus,
          pipeDiameter,
          wallThickness
        )
      ).toThrow('Wall thickness must be less than pipe radius');
    });

    it('should throw error for invalid material properties', () => {
      expect(() => calculateWaveSpeed(0, 2.2e9, 200e9, 0.2, 0.01)).toThrow(
        'Fluid density must be positive'
      );
      expect(() => calculateWaveSpeed(998, 0, 200e9, 0.2, 0.01)).toThrow(
        'Fluid bulk modulus must be positive'
      );
      expect(() => calculateWaveSpeed(998, 2.2e9, 0, 0.2, 0.01)).toThrow(
        'Pipe elastic modulus must be positive'
      );
      expect(() => calculateWaveSpeed(998, 2.2e9, 200e9, 0, 0.01)).toThrow(
        'Pipe diameter must be positive'
      );
      expect(() => calculateWaveSpeed(998, 2.2e9, 200e9, 0.2, 0)).toThrow(
        'Wall thickness must be positive'
      );
    });
  });

  describe('joukowskySurge - Steel vs Plastic Lines', () => {
    it('should calculate surge for steel pipe with water', () => {
      const input: JoukowskyInput = {
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
        },
        pipe: {
          elasticModulus: { value: 200e9, unit: 'Pa' },
          wallThickness: { value: 0.01, unit: 'm' },
          diameter: { value: 0.2, unit: 'm' },
        },
        velocityChange: { value: 1, unit: 'm/s' }, // Reduced velocity change
        pipeRating: { value: 2.5e6, unit: 'Pa' }, // 25 bar rating
      };

      const result = joukowskySurge(input);

      expect(result.pressureSurge.value).toBeGreaterThan(0);
      expect(result.waveSpeed.value).toBeGreaterThan(1000);
      expect(result.waveSpeed.value).toBeLessThan(1500);
      expect(result.comparison).toBeDefined();
      expect(result.comparison!.isWithinRating).toBe(true);
      expect(result.comparison!.safetyFactor).toBeLessThan(1);
    });

    it('should calculate surge for PVC pipe with water', () => {
      const input: JoukowskyInput = {
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
        },
        pipe: {
          elasticModulus: { value: 3.3e9, unit: 'Pa' },
          wallThickness: { value: 0.005, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
        },
        velocityChange: { value: 2, unit: 'm/s' },
        pipeRating: { value: 1.0e6, unit: 'Pa' }, // 10 bar rating
      };

      const result = joukowskySurge(input);

      expect(result.pressureSurge.value).toBeGreaterThan(0);
      expect(result.waveSpeed.value).toBeGreaterThan(300);
      expect(result.waveSpeed.value).toBeLessThan(700);
      expect(result.comparison).toBeDefined();

      // PVC pipes typically have lower wave speeds, so surge should be lower
      expect(result.pressureSurge.value).toBeLessThan(1.5e6); // Less than 15 bar
    });

    it('should compare steel vs plastic surge for same conditions', () => {
      const steelInput: JoukowskyInput = {
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
        },
        pipe: {
          elasticModulus: { value: 200e9, unit: 'Pa' },
          wallThickness: { value: 0.01, unit: 'm' },
          diameter: { value: 0.2, unit: 'm' },
        },
        velocityChange: { value: 3, unit: 'm/s' },
      };

      const pvcInput: JoukowskyInput = {
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
        },
        pipe: {
          elasticModulus: { value: 3.3e9, unit: 'Pa' },
          wallThickness: { value: 0.005, unit: 'm' },
          diameter: { value: 0.2, unit: 'm' },
        },
        velocityChange: { value: 3, unit: 'm/s' },
      };

      const steelResult = joukowskySurge(steelInput);
      const pvcResult = joukowskySurge(pvcInput);

      // Steel should have higher wave speed and higher surge
      expect(steelResult.waveSpeed.value).toBeGreaterThan(
        pvcResult.waveSpeed.value
      );
      expect(steelResult.pressureSurge.value).toBeGreaterThan(
        pvcResult.pressureSurge.value
      );

      // Steel wave speed should be roughly 2-5x higher than PVC
      expect(
        steelResult.waveSpeed.value / pvcResult.waveSpeed.value
      ).toBeGreaterThan(2);
      expect(
        steelResult.waveSpeed.value / pvcResult.waveSpeed.value
      ).toBeLessThan(6);
    });

    it('should handle pipe rating comparison correctly', () => {
      const input: JoukowskyInput = {
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
        },
        pipe: {
          elasticModulus: { value: 200e9, unit: 'Pa' },
          wallThickness: { value: 0.01, unit: 'm' },
          diameter: { value: 0.2, unit: 'm' },
        },
        velocityChange: { value: 5, unit: 'm/s' }, // Large velocity change
        pipeRating: { value: 1.0e6, unit: 'Pa' }, // 10 bar rating
      };

      const result = joukowskySurge(input);

      expect(result.comparison).toBeDefined();
      expect(result.comparison!.pipeRating.value).toBe(1.0e6);
      expect(result.comparison!.isWithinRating).toBe(false); // Should exceed rating
      expect(result.comparison!.safetyFactor).toBeGreaterThan(1);

      // Should have warnings about exceeding rating
      expect(
        result.warnings.some(
          w =>
            typeof w === 'object' &&
            'message' in w &&
            w.message.includes('exceeds pipe rating')
        )
      ).toBe(true);
    });

    it('should use provided wave speed when available', () => {
      const input: JoukowskyInput = {
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
        },
        pipe: {
          waveSpeed: { value: 1000, unit: 'm/s' },
        },
        velocityChange: { value: 2, unit: 'm/s' },
      };

      const result = joukowskySurge(input);

      expect(result.waveSpeed.value).toBe(1000);
      expect(
        result.warnings.some(
          w => typeof w === 'string' && w.includes('Using provided wave speed')
        )
      ).toBe(true);
    });

    it('should throw error when neither wave speed nor pipe properties are provided', () => {
      const input: JoukowskyInput = {
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
        },
        pipe: {
          elasticModulus: { value: 200e9, unit: 'Pa' },
          // Missing wall thickness and diameter
        },
        velocityChange: { value: 2, unit: 'm/s' },
      };

      expect(() => joukowskySurge(input)).toThrow(
        'Either wave speed or complete pipe properties'
      );
    });
  });

  describe('Pipe Material Functions', () => {
    it('should return available pipe materials', () => {
      const materials = getAvailablePipeMaterials();

      expect(materials).toContain('steel');
      expect(materials).toContain('pvc');
      expect(materials).toContain('hdpe');
      expect(materials).toContain('pe');
      expect(materials).toContain('stainless-steel');
      expect(materials).toContain('ductile-iron');
    });

    it('should return pipe material properties', () => {
      const steel = getPipeMaterial('steel');
      const pvc = getPipeMaterial('pvc');

      expect(steel.elasticModulus).toBe(200e9);
      expect(steel.name).toBe('Steel');
      expect(pvc.elasticModulus).toBe(3.3e9);
      expect(pvc.name).toBe('PVC');
    });

    it('should calculate wave speed for materials', () => {
      const steelWaveSpeed = calculateWaveSpeedForMaterial(
        'steel',
        0.2, // diameter
        0.01, // wall thickness
        998, // water density
        2.2e9 // water bulk modulus
      );

      const pvcWaveSpeed = calculateWaveSpeedForMaterial(
        'pvc',
        0.2, // diameter
        0.005, // wall thickness
        998, // water density
        2.2e9 // water bulk modulus
      );

      expect(steelWaveSpeed).toBeGreaterThan(pvcWaveSpeed);
      expect(steelWaveSpeed).toBeGreaterThan(1000);
      expect(pvcWaveSpeed).toBeLessThan(700);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should handle very small velocity changes', () => {
      const input: JoukowskyInput = {
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
        },
        pipe: {
          waveSpeed: { value: 1200, unit: 'm/s' },
        },
        velocityChange: { value: 0.1, unit: 'm/s' },
      };

      const result = joukowskySurge(input);

      expect(result.pressureSurge.value).toBeCloseTo(119760, 0); // 998 * 1200 * 0.1
    });

    it('should handle different fluids', () => {
      const waterInput: JoukowskyInput = {
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
        },
        pipe: {
          waveSpeed: { value: 1200, unit: 'm/s' },
        },
        velocityChange: { value: 2, unit: 'm/s' },
      };

      const oilInput: JoukowskyInput = {
        fluid: {
          density: { value: 850, unit: 'kg/m³' },
        },
        pipe: {
          waveSpeed: { value: 1200, unit: 'm/s' },
        },
        velocityChange: { value: 2, unit: 'm/s' },
      };

      const waterResult = joukowskySurge(waterInput);
      const oilResult = joukowskySurge(oilInput);

      // Oil should have lower surge due to lower density
      expect(oilResult.pressureSurge.value).toBeLessThan(
        waterResult.pressureSurge.value
      );
      expect(
        oilResult.pressureSurge.value / waterResult.pressureSurge.value
      ).toBeCloseTo(850 / 998, 2);
    });

    it('should generate warnings for large velocity changes', () => {
      const input: JoukowskyInput = {
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
        },
        pipe: {
          waveSpeed: { value: 1200, unit: 'm/s' },
        },
        velocityChange: { value: 15, unit: 'm/s' }, // Large velocity change
      };

      const result = joukowskySurge(input);

      expect(
        result.warnings.some(
          w =>
            typeof w === 'object' &&
            'message' in w &&
            w.message.includes('Large velocity change detected')
        )
      ).toBe(true);
    });

    it('should generate warnings for unusually high wave speeds', () => {
      const input: JoukowskyInput = {
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
        },
        pipe: {
          waveSpeed: { value: 2000, unit: 'm/s' }, // Unusually high
        },
        velocityChange: { value: 2, unit: 'm/s' },
      };

      const result = joukowskySurge(input);

      expect(
        result.warnings.some(
          w =>
            typeof w === 'object' &&
            'message' in w &&
            w.message.includes('Unusually high wave speed detected')
        )
      ).toBe(true);
    });
  });
});
