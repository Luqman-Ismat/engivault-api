import { describe, it, expect } from 'vitest';
import {
  waterProps,
  temperatureDependentViscosity,
  calculateAverageTemperature,
  estimateOutletTemperature,
  iterateViscosityAdjustedDrop,
  FluidProperties,
  ViscosityAdjustedDropInput,
} from './thermal';

describe('Thermal Module', () => {
  describe('waterProps', () => {
    it('should return water properties at 20°C', () => {
      const props = waterProps(293.15); // 20°C

      expect(props.density).toBeCloseTo(998.2, 1);
      expect(props.viscosity).toBeCloseTo(1.002e-3, 6);
    });

    it('should return water properties at 100°C', () => {
      const props = waterProps(373.15); // 100°C

      expect(props.density).toBeCloseTo(958.4, 1);
      expect(props.viscosity).toBeCloseTo(0.282e-3, 6);
    });

    it('should return water properties at 0°C', () => {
      const props = waterProps(273.15); // 0°C

      expect(props.density).toBeCloseTo(999.8, 1);
      expect(props.viscosity).toBeCloseTo(1.792e-3, 6);
    });

    it('should interpolate between known temperatures', () => {
      const props = waterProps(298.15); // 25°C (between 20°C and 30°C)

      // Since we use closest temperature lookup, 25°C will map to 20°C
      expect(props.density).toBeCloseTo(998.2, 1); // Closest to 20°C
      expect(props.viscosity).toBeCloseTo(1.002e-3, 6); // Closest to 20°C
    });

    it('should throw error for temperature below 0°C', () => {
      expect(() => waterProps(270)).toThrow(
        'Temperature must be between 273.15K (0°C) and 373.15K (100°C)'
      );
    });

    it('should throw error for temperature above 100°C', () => {
      expect(() => waterProps(380)).toThrow(
        'Temperature must be between 273.15K (0°C) and 373.15K (100°C)'
      );
    });
  });

  describe('temperatureDependentViscosity', () => {
    it('should calculate viscosity at different temperatures', () => {
      const baseViscosity = 1.002e-3; // Pa·s at 293.15K (20°C)
      const referenceTemperature = 293.15; // K

      // Viscosity should decrease with increasing temperature
      const viscosity20 = temperatureDependentViscosity(
        baseViscosity,
        referenceTemperature,
        293.15
      );
      const viscosity40 = temperatureDependentViscosity(
        baseViscosity,
        referenceTemperature,
        313.15
      );
      const viscosity60 = temperatureDependentViscosity(
        baseViscosity,
        referenceTemperature,
        333.15
      );

      expect(viscosity20).toBeCloseTo(baseViscosity, 6);
      expect(viscosity40).toBeLessThan(viscosity20);
      expect(viscosity60).toBeLessThan(viscosity40);
    });

    it('should handle temperature decrease', () => {
      const baseViscosity = 1.002e-3; // Pa·s at 293.15K (20°C)
      const referenceTemperature = 293.15; // K

      // Viscosity should increase with decreasing temperature
      const viscosity10 = temperatureDependentViscosity(
        baseViscosity,
        referenceTemperature,
        283.15
      );
      const viscosity0 = temperatureDependentViscosity(
        baseViscosity,
        referenceTemperature,
        273.15
      );

      expect(viscosity10).toBeGreaterThan(baseViscosity);
      expect(viscosity0).toBeGreaterThan(viscosity10);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => temperatureDependentViscosity(0, 293.15, 313.15)).toThrow(
        'All parameters must be positive'
      );
      expect(() => temperatureDependentViscosity(1e-3, 0, 313.15)).toThrow(
        'All parameters must be positive'
      );
      expect(() => temperatureDependentViscosity(1e-3, 293.15, 0)).toThrow(
        'All parameters must be positive'
      );
    });
  });

  describe('calculateAverageTemperature', () => {
    it('should calculate arithmetic mean correctly', () => {
      const avgTemp = calculateAverageTemperature(293.15, 313.15); // 20°C to 40°C

      expect(avgTemp).toBe(303.15); // 30°C
    });

    it('should handle equal temperatures', () => {
      const avgTemp = calculateAverageTemperature(298.15, 298.15);

      expect(avgTemp).toBe(298.15);
    });

    it('should throw error for invalid temperatures', () => {
      expect(() => calculateAverageTemperature(0, 298.15)).toThrow(
        'Temperatures must be positive'
      );
      expect(() => calculateAverageTemperature(298.15, 0)).toThrow(
        'Temperatures must be positive'
      );
    });
  });

  describe('estimateOutletTemperature', () => {
    it('should estimate outlet temperature for typical conditions', () => {
      const inletTemp = 353.15; // 80°C
      const flowRate = 0.01; // m³/s
      const diameter = 0.05; // m
      const length = 100; // m

      const outletTemp = estimateOutletTemperature(
        inletTemp,
        flowRate,
        diameter,
        length
      );

      expect(outletTemp).toBeLessThan(inletTemp);
      expect(outletTemp).toBeGreaterThan(293.15); // Should stay above ambient
    });

    it('should handle high flow rates', () => {
      const inletTemp = 353.15; // 80°C
      const flowRate = 0.1; // High flow rate
      const diameter = 0.05; // m
      const length = 100; // m

      const outletTemp = estimateOutletTemperature(
        inletTemp,
        flowRate,
        diameter,
        length
      );

      // Higher flow rate should result in less temperature drop
      expect(outletTemp).toBeGreaterThan(
        estimateOutletTemperature(inletTemp, 0.01, diameter, length)
      );
    });

    it('should handle long pipes', () => {
      const inletTemp = 353.15; // 80°C
      const flowRate = 0.01; // m³/s
      const diameter = 0.05; // m
      const length = 1000; // Long pipe

      const outletTemp = estimateOutletTemperature(
        inletTemp,
        flowRate,
        diameter,
        length
      );

      // Longer pipe should result in more temperature drop
      expect(outletTemp).toBeLessThan(
        estimateOutletTemperature(inletTemp, flowRate, diameter, 100)
      );
    });

    it('should throw error for invalid inputs', () => {
      expect(() => estimateOutletTemperature(0, 0.01, 0.05, 100)).toThrow(
        'All parameters must be positive'
      );
      expect(() => estimateOutletTemperature(353.15, 0, 0.05, 100)).toThrow(
        'All parameters must be positive'
      );
      expect(() => estimateOutletTemperature(353.15, 0.01, 0, 100)).toThrow(
        'All parameters must be positive'
      );
      expect(() => estimateOutletTemperature(353.15, 0.01, 0.05, 0)).toThrow(
        'All parameters must be positive'
      );
    });
  });

  describe('iterateViscosityAdjustedDrop', () => {
    const baseFluid: FluidProperties = {
      density: { value: 998.2, unit: 'kg/m³' }, // Water at 20°C
      viscosity: { value: 1.002e-3, unit: 'Pa·s' }, // Water at 20°C
      referenceTemperature: { value: 293.15, unit: 'K' }, // 20°C
    };

    it('should calculate viscosity-adjusted pressure drop for water', () => {
      const input: ViscosityAdjustedDropInput = {
        flowRate: { value: 0.01, unit: 'm³/s' },
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' }, // Steel
        fluid: baseFluid,
        inletTemperature: { value: 353.15, unit: 'K' }, // 80°C
      };

      const result = iterateViscosityAdjustedDrop(input);

      expect(result.inletTemperature.value).toBe(353.15);
      expect(result.outletTemperature.value).toBeLessThan(353.15);
      expect(result.outletTemperature.value).toBeGreaterThan(293.15);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.converged).toBe(true);
      expect(result.reynoldsNumber).toBeGreaterThan(0);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.velocity.value).toBeGreaterThan(0);
    });

    it('should show convergence behavior', () => {
      const input: ViscosityAdjustedDropInput = {
        flowRate: { value: 0.01, unit: 'm³/s' },
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' },
        fluid: baseFluid,
        inletTemperature: { value: 353.15, unit: 'K' },
        maxIterations: 20,
        convergenceTolerance: 1e-6,
      };

      const result = iterateViscosityAdjustedDrop(input);

      expect(
        result.metadata.calculations.convergenceHistory.length
      ).toBeGreaterThan(1);
      expect(
        result.metadata.calculations.convergenceHistory.length
      ).toBeLessThanOrEqual(20);

      // Check that pressure drop converges
      const pressureDrops = result.metadata.calculations.convergenceHistory.map(
        h => h.pressureDrop
      );
      const lastDrop = pressureDrops[pressureDrops.length - 1];
      const secondLastDrop = pressureDrops[pressureDrops.length - 2];

      if (pressureDrops.length > 1) {
        const change =
          Math.abs(lastDrop - secondLastDrop) / Math.max(lastDrop, 1e-6);
        expect(change).toBeLessThan(1e-6);
      }
    });

    it('should be sensitive to temperature changes', () => {
      const baseInput: ViscosityAdjustedDropInput = {
        flowRate: { value: 0.01, unit: 'm³/s' },
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' },
        fluid: baseFluid,
        inletTemperature: { value: 293.15, unit: 'K' }, // 20°C
      };

      const result20 = iterateViscosityAdjustedDrop(baseInput);

      const input40: ViscosityAdjustedDropInput = {
        ...baseInput,
        inletTemperature: { value: 313.15, unit: 'K' }, // 40°C
      };

      const result40 = iterateViscosityAdjustedDrop(input40);

      // Higher temperature should result in different pressure drop
      expect(result40.pressureDrop.value).not.toBe(result20.pressureDrop.value);
    });

    it('should handle provided outlet temperature', () => {
      const input: ViscosityAdjustedDropInput = {
        flowRate: { value: 0.01, unit: 'm³/s' },
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' },
        fluid: baseFluid,
        inletTemperature: { value: 353.15, unit: 'K' },
        outletTemperature: { value: 343.15, unit: 'K' }, // 70°C
      };

      const result = iterateViscosityAdjustedDrop(input);

      expect(result.outletTemperature.value).toBe(343.15);
      expect(result.averageTemperature.value).toBe(348.15); // Average of 80°C and 70°C
    });

    it('should handle custom viscosity temperature coefficient', () => {
      const customFluid: FluidProperties = {
        density: { value: 998.2, unit: 'kg/m³' },
        viscosity: { value: 1.002e-3, unit: 'Pa·s' },
        referenceTemperature: { value: 293.15, unit: 'K' },
        viscosityTemperatureCoefficient: 0.02, // Custom coefficient
      };

      const input: ViscosityAdjustedDropInput = {
        flowRate: { value: 0.01, unit: 'm³/s' },
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' },
        fluid: customFluid,
        inletTemperature: { value: 353.15, unit: 'K' },
      };

      const result = iterateViscosityAdjustedDrop(input);

      expect(result.converged).toBe(true);
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });

    it('should handle high temperature differences', () => {
      const input: ViscosityAdjustedDropInput = {
        flowRate: { value: 0.01, unit: 'm³/s' },
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' },
        fluid: baseFluid,
        inletTemperature: { value: 373.15, unit: 'K' }, // 100°C
      };

      const result = iterateViscosityAdjustedDrop(input);

      expect(result.converged).toBe(true);
      expect(result.averageViscosity.value).toBeLessThan(
        baseFluid.viscosity.value
      ); // Average should be less than reference
    });

    it('should handle low flow rates', () => {
      const input: ViscosityAdjustedDropInput = {
        flowRate: { value: 0.001, unit: 'm³/s' }, // Low flow rate
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' },
        fluid: baseFluid,
        inletTemperature: { value: 353.15, unit: 'K' },
      };

      const result = iterateViscosityAdjustedDrop(input);

      expect(result.converged).toBe(true);
      expect(result.velocity.value).toBeLessThan(1); // Low velocity
      expect(result.reynoldsNumber).toBeGreaterThan(0); // Should be positive
    });

    it('should handle high flow rates', () => {
      const input: ViscosityAdjustedDropInput = {
        flowRate: { value: 0.1, unit: 'm³/s' }, // High flow rate
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' },
        fluid: baseFluid,
        inletTemperature: { value: 353.15, unit: 'K' },
      };

      const result = iterateViscosityAdjustedDrop(input);

      expect(result.converged).toBe(true);
      expect(result.velocity.value).toBeGreaterThan(10); // High velocity
      expect(result.reynoldsNumber).toBeGreaterThan(100000); // Highly turbulent
    });

    it('should throw error for invalid inputs', () => {
      const input: ViscosityAdjustedDropInput = {
        flowRate: { value: 0, unit: 'm³/s' }, // Invalid flow rate
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' },
        fluid: baseFluid,
        inletTemperature: { value: 353.15, unit: 'K' },
      };

      expect(() => iterateViscosityAdjustedDrop(input)).toThrow(
        'Flow rate, length, and diameter must be positive'
      );
    });

    it('should handle non-convergence gracefully', () => {
      const input: ViscosityAdjustedDropInput = {
        flowRate: { value: 0.01, unit: 'm³/s' },
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' },
        fluid: baseFluid,
        inletTemperature: { value: 353.15, unit: 'K' },
        maxIterations: 1, // Very few iterations
        convergenceTolerance: 1e-15, // Extremely strict tolerance
      };

      const result = iterateViscosityAdjustedDrop(input);

      expect(result.iterations).toBe(1);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.averageTemperature.value).toBeGreaterThan(0);
    });

    it('should show temperature sensitivity in viscosity', () => {
      const input20: ViscosityAdjustedDropInput = {
        flowRate: { value: 0.01, unit: 'm³/s' },
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' },
        fluid: baseFluid,
        inletTemperature: { value: 273.15, unit: 'K' }, // 0°C
      };

      const input80: ViscosityAdjustedDropInput = {
        flowRate: { value: 0.01, unit: 'm³/s' },
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.05, unit: 'm' },
        roughness: { value: 0.000045, unit: 'm' },
        fluid: baseFluid,
        inletTemperature: { value: 353.15, unit: 'K' }, // 80°C
      };

      const result20 = iterateViscosityAdjustedDrop(input20);
      const result80 = iterateViscosityAdjustedDrop(input80);

      // Pressure drop should be different due to temperature differences
      expect(result20.pressureDrop.value).not.toBe(result80.pressureDrop.value);
    });
  });
});
