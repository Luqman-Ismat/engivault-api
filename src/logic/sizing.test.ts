import { describe, it, expect } from 'vitest';
import { sizePipeForTarget } from './sizing';

describe('Pipe Sizing Module', () => {
  const waterAt20C = {
    density: { value: 998, unit: 'kg/m³' },
    viscosity: { value: 0.001002, unit: 'Pa·s' },
  };

  const oilAt20C = {
    density: { value: 850, unit: 'kg/m³' },
    viscosity: { value: 0.01, unit: 'Pa·s' },
  };

  describe('sizePipeForTarget - Velocity Target', () => {
    it('should size pipe for target velocity correctly', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 2, unit: 'm/s' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      expect(result.diameter.value).toBeCloseTo(0.252, 3);
      expect(result.velocity.value).toBeCloseTo(2, 2);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.reynoldsNumber).toBeGreaterThan(4000); // Turbulent flow
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.metadata.calculations.method).toBe('Velocity-based sizing');
    });

    it('should handle different velocity units', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 6.56, unit: 'ft/s' }, // 2 m/s in ft/s
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      expect(result.diameter.value).toBeCloseTo(0.252, 3);
      expect(result.velocity.value).toBeCloseTo(2, 2);
    });

    it('should generate warnings for high velocity', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 5, unit: 'm/s' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      const highVelocityWarning = result.warnings.find(w =>
        w.message.includes('High velocity detected')
      );
      expect(highVelocityWarning).toBeDefined();
    });

    it('should handle laminar flow with appropriate warnings', () => {
      const input = {
        flow: { value: 0.001, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 0.5, unit: 'm/s' },
        fluid: oilAt20C,
        length: { value: 100, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      expect(result.reynoldsNumber).toBeLessThan(2300);
      const laminarWarning = result.warnings.find(w =>
        w.message.includes('laminar')
      );
      expect(laminarWarning).toBeDefined();
    });
  });

  describe('sizePipeForTarget - Pressure Drop Target', () => {
    it('should size pipe for target pressure drop correctly', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'dP' as const,
        value: { value: 10000, unit: 'Pa' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      expect(result.diameter.value).toBeGreaterThan(0);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.velocity.value).toBeGreaterThan(0);
      expect(result.reynoldsNumber).toBeGreaterThan(0);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.metadata.calculations.method).toBe(
        'Pressure drop-based sizing'
      );
    });

    it('should handle different pressure units', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'dP' as const,
        value: { value: 10, unit: 'kPa' }, // 10000 Pa
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });

    it('should handle very low pressure drop', () => {
      const input = {
        flow: { value: 0.01, unit: 'm³/s' },
        target: 'dP' as const,
        value: { value: 100, unit: 'Pa' },
        fluid: waterAt20C,
        length: { value: 50, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      expect(result.diameter.value).toBeGreaterThan(0);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });

    it('should handle very high pressure drop', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'dP' as const,
        value: { value: 100000, unit: 'Pa' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      expect(result.diameter.value).toBeGreaterThan(0);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for negative flow', () => {
      const input = {
        flow: { value: -0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 2, unit: 'm/s' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      expect(() => sizePipeForTarget(input)).toThrow(
        'Flow rate must be positive'
      );
    });

    it('should throw error for negative target value', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: -2, unit: 'm/s' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      expect(() => sizePipeForTarget(input)).toThrow(
        'Target value must be positive'
      );
    });

    it('should throw error for negative length', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 2, unit: 'm/s' },
        fluid: waterAt20C,
        length: { value: -100, unit: 'm' },
      };

      expect(() => sizePipeForTarget(input)).toThrow(
        'Pipe length must be positive'
      );
    });

    it('should throw error for negative density', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 2, unit: 'm/s' },
        fluid: {
          density: { value: -998, unit: 'kg/m³' },
          viscosity: { value: 0.001002, unit: 'Pa·s' },
        },
        length: { value: 100, unit: 'm' },
      };

      expect(() => sizePipeForTarget(input)).toThrow(
        'Fluid density must be positive'
      );
    });

    it('should throw error for negative viscosity', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 2, unit: 'm/s' },
        fluid: {
          density: { value: 998, unit: 'kg/m³' },
          viscosity: { value: -0.001002, unit: 'Pa·s' },
        },
        length: { value: 100, unit: 'm' },
      };

      expect(() => sizePipeForTarget(input)).toThrow(
        'Fluid viscosity must be positive'
      );
    });
  });

  describe('Roughness Handling', () => {
    it('should use default roughness when not provided', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 2, unit: 'm/s' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      expect(result.diameter.value).toBeGreaterThan(0);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });

    it('should use provided roughness', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 2, unit: 'm/s' },
        roughness: { value: 0.000001, unit: 'm' }, // Very smooth pipe
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      expect(result.diameter.value).toBeGreaterThan(0);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });
  });

  describe('Convergence and Iterations', () => {
    it('should converge within reasonable iterations', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 2, unit: 'm/s' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      expect(result.metadata.calculations.iterations).toBeGreaterThanOrEqual(0);
      expect(result.metadata.calculations.iterations).toBeLessThan(50);
      expect(result.metadata.calculations.finalTolerance).toBeLessThan(1);
    });

    it('should handle convergence for pressure drop target', () => {
      const input = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'dP' as const,
        value: { value: 10000, unit: 'Pa' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const result = sizePipeForTarget(input);

      expect(result.metadata.calculations.iterations).toBeGreaterThanOrEqual(0);
      expect(result.metadata.calculations.iterations).toBeLessThan(50);
      expect(result.metadata.calculations.finalTolerance).toBeLessThan(20);
    });
  });

  describe('Physical Consistency', () => {
    it('should maintain physical consistency between velocity and pressure drop', () => {
      // Size for velocity first
      const velocityInput = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 2, unit: 'm/s' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const velocityResult = sizePipeForTarget(velocityInput);

      // Now size for the resulting pressure drop
      const pressureInput = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'dP' as const,
        value: { value: velocityResult.pressureDrop.value, unit: 'Pa' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const pressureResult = sizePipeForTarget(pressureInput);

      // Should get similar diameters
      expect(pressureResult.diameter.value).toBeCloseTo(
        velocityResult.diameter.value,
        3
      );
    });

    it('should show reasonable diameter scaling with flow rate', () => {
      const smallFlow = {
        flow: { value: 0.01, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 2, unit: 'm/s' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const largeFlow = {
        flow: { value: 0.1, unit: 'm³/s' },
        target: 'velocity' as const,
        value: { value: 2, unit: 'm/s' },
        fluid: waterAt20C,
        length: { value: 100, unit: 'm' },
      };

      const smallResult = sizePipeForTarget(smallFlow);
      const largeResult = sizePipeForTarget(largeFlow);

      // Larger flow should require larger diameter for same velocity
      expect(largeResult.diameter.value).toBeGreaterThan(
        smallResult.diameter.value
      );
    });
  });
});
