import { describe, it, expect } from 'vitest';
import { computeFillDrainTime, FillDrainInput } from './fill-drain-time';

describe('Fill/Drain Time Module', () => {
  const cylindricalTank: FillDrainInput = {
    tank: {
      volume: { value: 100, unit: 'm³' },
      diameter: { value: 5, unit: 'm' },
      shape: 'cylindrical'
    },
    flowRate: {
      type: 'constant',
      value: { value: 0.1, unit: 'm³/s' }
    },
    operation: 'fill',
    initialLevel: { value: 0, unit: 'm' },
    targetLevel: { value: 5, unit: 'm' }
  };

  const rectangularTank: FillDrainInput = {
    tank: {
      volume: { value: 200, unit: 'm³' },
      height: { value: 4, unit: 'm' },
      shape: 'rectangular'
    },
    flowRate: {
      type: 'constant',
      value: { value: 0.05, unit: 'm³/s' }
    },
    operation: 'drain',
    initialLevel: { value: 4, unit: 'm' },
    targetLevel: { value: 1, unit: 'm' }
  };

  describe('computeFillDrainTime', () => {
    it('should calculate fill time for cylindrical tank', () => {
      const result = computeFillDrainTime(cylindricalTank);
      
      expect(result.totalTime.value).toBeGreaterThan(0);
      expect(result.totalTime.unit).toBe('s');
      expect(result.averageFlowRate.value).toBeCloseTo(0.1, 2);
      expect(result.averageFlowRate.unit).toBe('m³/s');
      expect(result.volumeChange.value).toBeGreaterThan(0);
      expect(result.volumeChange.unit).toBe('m³');
      expect(result.timeHistory.length).toBeGreaterThan(0);
      expect(result.warnings).toBeDefined();
      expect(result.metadata.input).toEqual(cylindricalTank);
      expect(result.metadata.calculations.method).toBe('Constant flow rate');
      expect(result.metadata.calculations.convergence).toBe(true);
    });

    it('should calculate drain time for rectangular tank', () => {
      const result = computeFillDrainTime(rectangularTank);
      
      expect(result.totalTime.value).toBeGreaterThan(0);
      expect(result.totalTime.unit).toBe('s');
      expect(result.averageFlowRate.value).toBeCloseTo(0.05, 2);
      expect(result.averageFlowRate.unit).toBe('m³/s');
      expect(result.volumeChange.value).toBeGreaterThan(0);
      expect(result.volumeChange.unit).toBe('m³');
      expect(result.timeHistory.length).toBeGreaterThan(0);
      expect(result.warnings).toBeDefined();
      expect(result.metadata.input).toEqual(rectangularTank);
      expect(result.metadata.calculations.method).toBe('Constant flow rate');
      expect(result.metadata.calculations.convergence).toBe(true);
    });

    it('should handle variable flow rate', () => {
      const variableFlowInput: FillDrainInput = {
        tank: {
          volume: { value: 50, unit: 'm³' },
          height: { value: 2, unit: 'm' },
          shape: 'rectangular'
        },
        flowRate: {
          type: 'variable',
          function: 'Q(t) = 0.1 * (1 - t/3600)'
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 1, unit: 'm' }
      };
      
      const result = computeFillDrainTime(variableFlowInput);
      
      expect(result.totalTime.value).toBeGreaterThan(0);
      expect(result.totalTime.unit).toBe('s');
      expect(result.averageFlowRate.value).toBeGreaterThan(0);
      expect(result.averageFlowRate.unit).toBe('m³/s');
      expect(result.volumeChange.value).toBeGreaterThan(0);
      expect(result.volumeChange.unit).toBe('m³');
      expect(result.timeHistory.length).toBeGreaterThan(0);
      expect(result.metadata.calculations.method).toBe('Variable flow rate');
    });

    it('should handle custom tank shape', () => {
      const customTankInput: FillDrainInput = {
        tank: {
          volume: { value: 75, unit: 'm³' },
          height: { value: 3, unit: 'm' },
          shape: 'custom'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.075, unit: 'm³/s' }
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 2, unit: 'm' }
      };
      
      const result = computeFillDrainTime(customTankInput);
      
      expect(result.totalTime.value).toBeGreaterThan(0);
      expect(result.totalTime.unit).toBe('s');
      expect(result.averageFlowRate.value).toBeCloseTo(0.075, 2);
      expect(result.averageFlowRate.unit).toBe('m³/s');
      expect(result.volumeChange.value).toBeGreaterThan(0);
      expect(result.volumeChange.unit).toBe('m³');
      expect(result.timeHistory.length).toBeGreaterThan(0);
      expect(result.metadata.calculations.method).toBe('Constant flow rate');
    });

    it('should handle different units', () => {
      const imperialInput: FillDrainInput = {
        tank: {
          volume: { value: 1000, unit: 'gal' },
          diameter: { value: 10, unit: 'ft' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 100, unit: 'gal/min' }
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'ft' },
        targetLevel: { value: 5, unit: 'ft' },
        timeStep: { value: 30, unit: 's' }
      };
      
      const result = computeFillDrainTime(imperialInput);
      
      expect(result.totalTime.value).toBeGreaterThan(0);
      expect(result.totalTime.unit).toBe('s');
      expect(result.averageFlowRate.value).toBeGreaterThan(0);
      expect(result.averageFlowRate.unit).toBe('m³/s');
      expect(result.volumeChange.value).toBeGreaterThan(0);
      expect(result.volumeChange.unit).toBe('m³');
      expect(result.timeHistory.length).toBeGreaterThan(0);
    });

    it('should generate warnings for overflow', () => {
      const overflowInput: FillDrainInput = {
        tank: {
          volume: { value: 10, unit: 'm³' },
          diameter: { value: 2, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 1, unit: 'm³/s' }
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 10, unit: 'm' } // Would overflow
      };
      
      const result = computeFillDrainTime(overflowInput);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      const overflowWarnings = result.warnings.filter(w => w.type === 'tank_capacity');
      expect(overflowWarnings.length).toBeGreaterThan(0);
    });

    it('should generate warnings for underflow', () => {
      const underflowInput: FillDrainInput = {
        tank: {
          volume: { value: 10, unit: 'm³' },
          diameter: { value: 2, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 1, unit: 'm³/s' }
        },
        operation: 'drain',
        initialLevel: { value: 1, unit: 'm' },
        targetLevel: { value: 0, unit: 'm' }
      };
      
      const result = computeFillDrainTime(underflowInput);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      const underflowWarnings = result.warnings.filter(w => w.type === 'tank_capacity');
      expect(underflowWarnings.length).toBeGreaterThan(0);
    });

    it('should generate warnings for very small flow rate', () => {
      const smallFlowInput: FillDrainInput = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 1e-12, unit: 'm³/s' } // Very small flow
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 1, unit: 'm' }
      };
      
      const result = computeFillDrainTime(smallFlowInput);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      const flowWarnings = result.warnings.filter(w => w.type === 'flow_rate');
      expect(flowWarnings.length).toBeGreaterThan(0);
    });

    it('should generate warnings for time limit exceeded', () => {
      const slowFlowInput: FillDrainInput = {
        tank: {
          volume: { value: 1000, unit: 'm³' },
          diameter: { value: 10, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 1e-6, unit: 'm³/s' } // Very slow flow
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 5, unit: 'm' }
      };
      
      const result = computeFillDrainTime(slowFlowInput);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      const timeWarnings = result.warnings.filter(w => w.type === 'time_limit');
      expect(timeWarnings.length).toBeGreaterThan(0);
    });

    it('should throw error for negative tank volume', () => {
      const invalidInput: FillDrainInput = {
        tank: {
          volume: { value: -100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill'
      };
      
      expect(() => computeFillDrainTime(invalidInput)).toThrow('Tank volume must be positive');
    });

    it('should throw error for negative time step', () => {
      const invalidInput: FillDrainInput = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill',
        timeStep: { value: -60, unit: 's' }
      };
      
      expect(() => computeFillDrainTime(invalidInput)).toThrow('Time step must be positive');
    });

    it('should throw error for negative levels', () => {
      const invalidInput: FillDrainInput = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill',
        initialLevel: { value: -1, unit: 'm' }
      };
      
      expect(() => computeFillDrainTime(invalidInput)).toThrow('Levels must be non-negative');
    });

    it('should throw error for invalid fill operation levels', () => {
      const invalidInput: FillDrainInput = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill',
        initialLevel: { value: 5, unit: 'm' },
        targetLevel: { value: 3, unit: 'm' } // Initial > target for fill
      };
      
      expect(() => computeFillDrainTime(invalidInput)).toThrow('For fill operation, initial level must be less than target level');
    });

    it('should throw error for invalid drain operation levels', () => {
      const invalidInput: FillDrainInput = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'drain',
        initialLevel: { value: 3, unit: 'm' },
        targetLevel: { value: 5, unit: 'm' } // Initial < target for drain
      };
      
      expect(() => computeFillDrainTime(invalidInput)).toThrow('For drain operation, initial level must be greater than target level');
    });

    it('should throw error for missing diameter in cylindrical tank', () => {
      const invalidInput: FillDrainInput = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill'
      };
      
      expect(() => computeFillDrainTime(invalidInput)).toThrow('Diameter is required for cylindrical tanks');
    });

    it('should throw error for missing height in rectangular tank', () => {
      const invalidInput: FillDrainInput = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          shape: 'rectangular'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill'
      };
      
      expect(() => computeFillDrainTime(invalidInput)).toThrow('Height is required for rectangular tanks');
    });

    it('should throw error for missing flow rate value in constant flow', () => {
      const invalidInput: FillDrainInput = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant'
        },
        operation: 'fill'
      };
      
      expect(() => computeFillDrainTime(invalidInput)).toThrow('Flow rate value is required for constant flow');
    });

    it('should throw error for missing function in variable flow', () => {
      const invalidInput: FillDrainInput = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'variable'
        },
        operation: 'fill'
      };
      
      expect(() => computeFillDrainTime(invalidInput)).toThrow('Flow rate function is required for variable flow');
    });

    it('should record time history correctly', () => {
      const result = computeFillDrainTime(cylindricalTank);
      
      expect(result.timeHistory.length).toBeGreaterThan(0);
      
      // Check that time history is ordered
      for (let i = 1; i < result.timeHistory.length; i++) {
        expect(result.timeHistory[i].time).toBeGreaterThan(result.timeHistory[i-1].time);
        expect(result.timeHistory[i].level).toBeGreaterThanOrEqual(result.timeHistory[i-1].level);
        expect(result.timeHistory[i].volume).toBeGreaterThanOrEqual(result.timeHistory[i-1].volume);
        expect(result.timeHistory[i].flowRate).toBeGreaterThan(0);
      }
      
      // Check final values match target
      const finalEntry = result.timeHistory[result.timeHistory.length - 1];
      expect(finalEntry.time).toBeLessThanOrEqual(result.totalTime.value);
      expect(finalEntry.level).toBeCloseTo(5, 0); // target level
    });

    it('should calculate cross-sectional area correctly for cylindrical tank', () => {
      const result = computeFillDrainTime(cylindricalTank);
      
      // For cylindrical tank: A = π * (d/2)² = π * (5/2)² = π * 6.25 ≈ 19.63 m²
      const expectedArea = Math.PI * (5/2) ** 2;
      const actualVolume = result.volumeChange.value;
      const actualLevel = 5; // target level - initial level
      const actualArea = actualVolume / actualLevel;
      
      expect(actualArea).toBeCloseTo(expectedArea, 0);
    });

    it('should calculate cross-sectional area correctly for rectangular tank', () => {
      const result = computeFillDrainTime(rectangularTank);
      
      // For rectangular tank: A = V/h = 200/4 = 50 m²
      const expectedArea = 200 / 4;
      const actualVolume = result.volumeChange.value;
      const actualLevel = 3; // initial level - target level
      const actualArea = actualVolume / actualLevel;
      
      expect(actualArea).toBeCloseTo(expectedArea, 1);
    });
  });
});
