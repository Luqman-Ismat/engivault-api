import { describe, it, expect } from 'vitest';
import {
  hxPressureDrop,
  getStandardRoughness,
  calculateHXScalingFactors,
  HXGeometry,
  HXPressureDropInput
} from './hx';

describe('Heat Exchanger Module', () => {
  const baseGeometry: HXGeometry = {
    tubeDiameter: { value: 0.019, unit: 'm' }, // 3/4" tube
    tubeLength: { value: 3.0, unit: 'm' },
    numberOfTubes: 100,
    tubePitch: { value: 0.025, unit: 'm' }, // 1" pitch
    tubeThickness: { value: 0.002, unit: 'm' }, // 2mm wall
    shellDiameter: { value: 0.3, unit: 'm' },
    baffleSpacing: { value: 0.25, unit: 'm' },
    baffleCut: 25, // 25% cut
    tubeLayout: 'triangular',
  };

  const baseFluidProperties = {
    density: { value: 998.2, unit: 'kg/m³' }, // Water at 20°C
    viscosity: { value: 1.002e-3, unit: 'Pa·s' },
  };

  describe('getStandardRoughness', () => {
    it('should return standard roughness values', () => {
      const roughness = getStandardRoughness();
      
      expect(roughness['drawn-tube']).toBe(0.0000015);
      expect(roughness['commercial-steel']).toBe(0.000045);
      expect(roughness['galvanized-steel']).toBe(0.00015);
      expect(roughness['cast-iron']).toBe(0.00026);
      expect(roughness['concrete']).toBe(0.0003);
      expect(roughness['riveted-steel']).toBe(0.0009);
    });
  });

  describe('calculateHXScalingFactors', () => {
    it('should calculate scaling factors correctly', () => {
      const scalingFactors = calculateHXScalingFactors(baseGeometry);
      
      expect(scalingFactors.tubeAreaScaling).toBe(100 * 3.0); // numberOfTubes * tubeLength
      expect(scalingFactors.shellAreaScaling).toBe(Math.pow(0.3, 2)); // shellDiameter^2
      expect(scalingFactors.velocityScaling).toBe(1 / (100 * 3.0)); // 1 / tubeAreaScaling
      expect(scalingFactors.pressureDropScaling).toBe(3.0 / Math.pow(0.019, 5)); // tubeLength / tubeDiameter^5
    });

    it('should show geometry scaling effects', () => {
      const smallGeometry: HXGeometry = {
        ...baseGeometry,
        numberOfTubes: 50,
        tubeLength: { value: 1.5, unit: 'm' },
      };
      
      const largeGeometry: HXGeometry = {
        ...baseGeometry,
        numberOfTubes: 200,
        tubeLength: { value: 6.0, unit: 'm' },
      };
      
      const smallScaling = calculateHXScalingFactors(smallGeometry);
      const largeScaling = calculateHXScalingFactors(largeGeometry);
      
      // Larger geometry should have larger area scaling
      expect(largeScaling.tubeAreaScaling).toBeGreaterThan(smallScaling.tubeAreaScaling);
      
      // Larger geometry should have smaller velocity scaling (inverse relationship)
      expect(largeScaling.velocityScaling).toBeLessThan(smallScaling.velocityScaling);
    });
  });

  describe('hxPressureDrop - Tube Side', () => {
    it('should calculate tube side pressure drop for typical conditions', () => {
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 500, unit: 'kg/(m²·s)' },
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
      };
      
      const result = hxPressureDrop(input);
      
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.pressureDropPercent).toBeGreaterThan(0);
      expect(result.velocity.value).toBeGreaterThan(0);
      expect(result.reynoldsNumber).toBeGreaterThan(0);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.flowArea.value).toBeGreaterThan(0);
      expect(result.equivalentDiameter.value).toBe(baseGeometry.tubeDiameter.value);
      expect(result.flowLength.value).toBeGreaterThan(baseGeometry.tubeLength.value * 2); // Includes return bends
      expect(result.numberOfCrossings).toBe(0); // Not applicable for tube side
      expect(result.baffleSpacing.value).toBe(0); // Not applicable for tube side
      expect(result.metadata.calculations.correlation).toContain('Darcy-Weisbach');
      expect(['laminar', 'turbulent', 'transition']).toContain(result.metadata.calculations.flowRegime);
    });

    it('should handle single pass configuration', () => {
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 1,
        massFlux: { value: 500, unit: 'kg/(m²·s)' },
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
      };
      
      const result = hxPressureDrop(input);
      
      expect(result.flowLength.value).toBe(baseGeometry.tubeLength.value); // No return bends for single pass
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });

    it('should handle multiple passes configuration', () => {
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 4,
        massFlux: { value: 500, unit: 'kg/(m²·s)' },
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
      };
      
      const result = hxPressureDrop(input);
      
      expect(result.flowLength.value).toBeGreaterThan(baseGeometry.tubeLength.value * 4); // Includes return bends
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });

    it('should show laminar flow characteristics', () => {
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 50, unit: 'kg/(m²·s)' }, // Low mass flux for laminar flow
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
      };
      
      const result = hxPressureDrop(input);
      
      expect(result.reynoldsNumber).toBeLessThan(2300);
      expect(result.metadata.calculations.flowRegime).toBe('laminar');
    });

    it('should show turbulent flow characteristics', () => {
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 2000, unit: 'kg/(m²·s)' }, // High mass flux for turbulent flow
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
      };
      
      const result = hxPressureDrop(input);
      
      expect(result.reynoldsNumber).toBeGreaterThan(4000);
      expect(result.metadata.calculations.flowRegime).toBe('turbulent');
    });

    it('should handle custom roughness', () => {
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 500, unit: 'kg/(m²·s)' },
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
        roughness: { value: 0.000045, unit: 'm' }, // Commercial steel
      };
      
      const result = hxPressureDrop(input);
      
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.metadata.calculations.parameters.relativeRoughness).toBe(0.000045 / baseGeometry.tubeDiameter.value);
    });

    it('should generate warnings for extreme conditions', () => {
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 5000, unit: 'kg/(m²·s)' }, // Very high mass flux
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
      };
      
      const result = hxPressureDrop(input);
      
      expect(result.velocity.value).toBeGreaterThan(3); // Should trigger velocity warning
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('hxPressureDrop - Shell Side', () => {
    it('should calculate shell side pressure drop for typical conditions', () => {
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 200, unit: 'kg/(m²·s)' },
        fluidSide: 'shell',
        fluidProperties: baseFluidProperties,
      };
      
      const result = hxPressureDrop(input);
      
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.pressureDropPercent).toBeGreaterThan(0);
      expect(result.velocity.value).toBeGreaterThan(0);
      expect(result.reynoldsNumber).toBeGreaterThan(0);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.flowArea.value).toBeGreaterThan(0);
      expect(result.equivalentDiameter.value).toBeGreaterThan(0);
      expect(result.flowLength.value).toBe(baseGeometry.tubeLength.value);
      expect(result.numberOfCrossings).toBeGreaterThan(0);
      expect(result.baffleSpacing.value).toBe(baseGeometry.baffleSpacing.value);
      expect(result.metadata.calculations.correlation).toContain('Bell-Delaware');
      expect(['laminar', 'turbulent', 'transition']).toContain(result.metadata.calculations.flowRegime);
    });

    it('should handle different tube layouts', () => {
      const triangularInput: HXPressureDropInput = {
        geometry: { ...baseGeometry, tubeLayout: 'triangular' },
        passes: 2,
        massFlux: { value: 200, unit: 'kg/(m²·s)' },
        fluidSide: 'shell',
        fluidProperties: baseFluidProperties,
      };
      
      const squareInput: HXPressureDropInput = {
        geometry: { ...baseGeometry, tubeLayout: 'square' },
        passes: 2,
        massFlux: { value: 200, unit: 'kg/(m²·s)' },
        fluidSide: 'shell',
        fluidProperties: baseFluidProperties,
      };
      
      const triangularResult = hxPressureDrop(triangularInput);
      const squareResult = hxPressureDrop(squareInput);
      
      expect(triangularResult.equivalentDiameter.value).not.toBe(squareResult.equivalentDiameter.value);
      expect(triangularResult.pressureDrop.value).not.toBe(squareResult.pressureDrop.value);
    });

    it('should handle different baffle spacing', () => {
      const tightBaffleGeometry: HXGeometry = {
        ...baseGeometry,
        baffleSpacing: { value: 0.1, unit: 'm' }, // Tight baffle spacing
      };
      
      const looseBaffleGeometry: HXGeometry = {
        ...baseGeometry,
        baffleSpacing: { value: 0.5, unit: 'm' }, // Loose baffle spacing
      };
      
      const tightInput: HXPressureDropInput = {
        geometry: tightBaffleGeometry,
        passes: 2,
        massFlux: { value: 200, unit: 'kg/(m²·s)' },
        fluidSide: 'shell',
        fluidProperties: baseFluidProperties,
      };
      
      const looseInput: HXPressureDropInput = {
        geometry: looseBaffleGeometry,
        passes: 2,
        massFlux: { value: 200, unit: 'kg/(m²·s)' },
        fluidSide: 'shell',
        fluidProperties: baseFluidProperties,
      };
      
      const tightResult = hxPressureDrop(tightInput);
      const looseResult = hxPressureDrop(looseInput);
      
      expect(tightResult.numberOfCrossings).toBeGreaterThan(looseResult.numberOfCrossings);
      expect(tightResult.pressureDrop.value).toBeGreaterThan(looseResult.pressureDrop.value);
    });

    it('should generate warnings for shell side concerns', () => {
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 2000, unit: 'kg/(m²·s)' }, // Very high mass flux
        fluidSide: 'shell',
        fluidProperties: baseFluidProperties,
      };
      
      const result = hxPressureDrop(input);
      
      expect(result.velocity.value).toBeGreaterThan(2); // Should trigger velocity warning
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Geometry Scaling Tests', () => {
    it('should show pressure drop scaling with tube diameter', () => {
      const smallTubeGeometry: HXGeometry = {
        ...baseGeometry,
        tubeDiameter: { value: 0.01, unit: 'm' }, // Smaller tubes
      };
      
      const largeTubeGeometry: HXGeometry = {
        ...baseGeometry,
        tubeDiameter: { value: 0.025, unit: 'm' }, // Larger tubes
      };
      
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 500, unit: 'kg/(m²·s)' },
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
      };
      
      const smallInput = { ...input, geometry: smallTubeGeometry };
      const largeInput = { ...input, geometry: largeTubeGeometry };
      
      const smallResult = hxPressureDrop(smallInput);
      const largeResult = hxPressureDrop(largeInput);
      
      // Smaller tubes should have higher pressure drop
      expect(smallResult.pressureDrop.value).toBeGreaterThan(largeResult.pressureDrop.value);
    });

    it('should show pressure drop scaling with tube length', () => {
      const shortTubeGeometry: HXGeometry = {
        ...baseGeometry,
        tubeLength: { value: 1.0, unit: 'm' }, // Shorter tubes
      };
      
      const longTubeGeometry: HXGeometry = {
        ...baseGeometry,
        tubeLength: { value: 5.0, unit: 'm' }, // Longer tubes
      };
      
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 500, unit: 'kg/(m²·s)' },
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
      };
      
      const shortInput = { ...input, geometry: shortTubeGeometry };
      const longInput = { ...input, geometry: longTubeGeometry };
      
      const shortResult = hxPressureDrop(shortInput);
      const longResult = hxPressureDrop(longInput);
      
      // Longer tubes should have higher pressure drop
      expect(longResult.pressureDrop.value).toBeGreaterThan(shortResult.pressureDrop.value);
    });

    it('should show pressure drop scaling with number of tubes', () => {
      const fewTubesGeometry: HXGeometry = {
        ...baseGeometry,
        numberOfTubes: 50, // Fewer tubes
      };
      
      const manyTubesGeometry: HXGeometry = {
        ...baseGeometry,
        numberOfTubes: 200, // More tubes
      };
      
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 500, unit: 'kg/(m²·s)' },
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
      };
      
      const fewInput = { ...input, geometry: fewTubesGeometry };
      const manyInput = { ...input, geometry: manyTubesGeometry };
      
      const fewResult = hxPressureDrop(fewInput);
      const manyResult = hxPressureDrop(manyInput);
      
      // Flow areas should be the same (based on single tube diameter)
      expect(fewResult.flowArea.value).toBe(manyResult.flowArea.value);
    });

    it('should show shell side scaling with shell diameter', () => {
      const smallShellGeometry: HXGeometry = {
        ...baseGeometry,
        shellDiameter: { value: 0.2, unit: 'm' }, // Smaller shell
      };
      
      const largeShellGeometry: HXGeometry = {
        ...baseGeometry,
        shellDiameter: { value: 0.5, unit: 'm' }, // Larger shell
      };
      
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 200, unit: 'kg/(m²·s)' },
        fluidSide: 'shell',
        fluidProperties: baseFluidProperties,
      };
      
      const smallInput = { ...input, geometry: smallShellGeometry };
      const largeInput = { ...input, geometry: largeShellGeometry };
      
      const smallResult = hxPressureDrop(smallInput);
      const largeResult = hxPressureDrop(largeInput);
      
      // Different shell sizes should have different flow areas
      expect(smallResult.flowArea.value).not.toBe(largeResult.flowArea.value);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid geometry', () => {
      const invalidGeometry: HXGeometry = {
        ...baseGeometry,
        tubeDiameter: { value: 0, unit: 'm' }, // Invalid diameter
      };
      
      const input: HXPressureDropInput = {
        geometry: invalidGeometry,
        passes: 2,
        massFlux: { value: 500, unit: 'kg/(m²·s)' },
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
      };
      
      expect(() => hxPressureDrop(input)).toThrow('Tube diameter, length, and number of tubes must be positive');
    });

    it('should throw error for invalid fluid properties', () => {
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 2,
        massFlux: { value: 500, unit: 'kg/(m²·s)' },
        fluidSide: 'tube',
        fluidProperties: {
          density: { value: 0, unit: 'kg/m³' }, // Invalid density
          viscosity: { value: 1.002e-3, unit: 'Pa·s' },
        },
      };
      
      expect(() => hxPressureDrop(input)).toThrow('Mass flux, density, and viscosity must be positive');
    });

    it('should throw error for invalid passes', () => {
      const input: HXPressureDropInput = {
        geometry: baseGeometry,
        passes: 0, // Invalid passes
        massFlux: { value: 500, unit: 'kg/(m²·s)' },
        fluidSide: 'tube',
        fluidProperties: baseFluidProperties,
      };
      
      expect(() => hxPressureDrop(input)).toThrow('Number of passes must be positive');
    });
  });
});
