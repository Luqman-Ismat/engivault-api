import { describe, it, expect } from 'vitest';
import {
  calculateOrificeFlow,
  interpolateInflowCurve,
  interpolatePumpCurve,
  calculateOutflow,
  determinePumpState,
  simulateTank,
  TankSimulationInput,
  OutflowCurve,
} from './tank';

describe('Tank Module', () => {
  describe('calculateOrificeFlow', () => {
    it('should calculate orifice flow correctly', () => {
      const coefficient = 0.6;
      const area = 0.01; // 10 cm²
      const head = 2.0; // 2 m head

      const flow = calculateOrificeFlow(coefficient, area, head);

      // Q = C * A * sqrt(2 * g * H)
      // Q = 0.6 * 0.01 * sqrt(2 * 9.81 * 2)
      // Q = 0.6 * 0.01 * sqrt(39.24)
      // Q = 0.6 * 0.01 * 6.264
      // Q = 0.0376 m³/s
      expect(flow).toBeCloseTo(0.0376, 4);
    });

    it('should return zero flow for negative head', () => {
      const flow = calculateOrificeFlow(0.6, 0.01, -1.0);
      expect(flow).toBe(0);
    });

    it('should throw error for invalid coefficient', () => {
      expect(() => calculateOrificeFlow(1.5, 0.01, 2.0)).toThrow(
        'Discharge coefficient must be between 0 and 1'
      );
      expect(() => calculateOrificeFlow(-0.1, 0.01, 2.0)).toThrow(
        'Discharge coefficient must be between 0 and 1'
      );
    });

    it('should throw error for invalid area', () => {
      expect(() => calculateOrificeFlow(0.6, -0.01, 2.0)).toThrow(
        'Orifice area must be positive'
      );
      expect(() => calculateOrificeFlow(0.6, 0, 2.0)).toThrow(
        'Orifice area must be positive'
      );
    });
  });

  describe('interpolateInflowCurve', () => {
    it('should interpolate inflow curve correctly', () => {
      const curve = [
        { time: 0, flow: { value: 0.1, unit: 'm³/s' } },
        { time: 10, flow: { value: 0.2, unit: 'm³/s' } },
        { time: 20, flow: { value: 0.1, unit: 'm³/s' } },
      ];

      expect(interpolateInflowCurve(curve, 5)).toBeCloseTo(0.15, 3);
      expect(interpolateInflowCurve(curve, 15)).toBeCloseTo(0.15, 3);
    });

    it('should handle extrapolation', () => {
      const curve = [
        { time: 10, flow: { value: 0.1, unit: 'm³/s' } },
        { time: 20, flow: { value: 0.2, unit: 'm³/s' } },
      ];

      expect(interpolateInflowCurve(curve, 5)).toBe(0.1);
      expect(interpolateInflowCurve(curve, 25)).toBe(0.2);
    });

    it('should return zero for empty curve', () => {
      expect(interpolateInflowCurve([], 10)).toBe(0);
    });
  });

  describe('interpolatePumpCurve', () => {
    it('should interpolate pump curve correctly', () => {
      const curve = [
        { head: 20, flow: { value: 0, unit: 'm³/s' } },
        { head: 15, flow: { value: 0.05, unit: 'm³/s' } },
        { head: 10, flow: { value: 0.1, unit: 'm³/s' } },
        { head: 0, flow: { value: 0.15, unit: 'm³/s' } },
      ];

      expect(interpolatePumpCurve(curve, 12.5)).toBeCloseTo(0.075, 3);
      expect(interpolatePumpCurve(curve, 5)).toBeCloseTo(0.125, 3);
    });

    it('should handle extrapolation', () => {
      const curve = [
        { head: 15, flow: { value: 0.05, unit: 'm³/s' } },
        { head: 10, flow: { value: 0.1, unit: 'm³/s' } },
      ];

      expect(interpolatePumpCurve(curve, 20)).toBe(0.05);
      expect(interpolatePumpCurve(curve, 5)).toBe(0.1);
    });

    it('should return zero for empty curve', () => {
      expect(interpolatePumpCurve([], 10)).toBe(0);
    });
  });

  describe('calculateOutflow', () => {
    it('should calculate orifice outflow correctly', () => {
      const outflow: OutflowCurve = {
        type: 'orifice',
        orifice: {
          coefficient: 0.6,
          area: { value: 0.01, unit: 'm²' },
        },
      };

      const flow = calculateOutflow(outflow, 2.0);
      expect(flow).toBeCloseTo(0.0376, 4);
    });

    it('should calculate pump outflow correctly', () => {
      const outflow: OutflowCurve = {
        type: 'pump',
        pump: {
          curve: [
            { head: 20, flow: { value: 0, unit: 'm³/s' } },
            { head: 10, flow: { value: 0.1, unit: 'm³/s' } },
            { head: 0, flow: { value: 0.15, unit: 'm³/s' } },
          ],
        },
      };

      const flow = calculateOutflow(outflow, 15, true);
      expect(flow).toBeCloseTo(0.05, 3);
    });

    it('should return zero for pump when off', () => {
      const outflow: OutflowCurve = {
        type: 'pump',
        pump: {
          curve: [
            { head: 20, flow: { value: 0, unit: 'm³/s' } },
            { head: 10, flow: { value: 0.1, unit: 'm³/s' } },
          ],
        },
      };

      const flow = calculateOutflow(outflow, 15, false);
      expect(flow).toBe(0);
    });

    it('should calculate constant outflow correctly', () => {
      const outflow: OutflowCurve = {
        type: 'constant',
        constant: {
          flow: { value: 0.05, unit: 'm³/s' },
        },
      };

      const flow = calculateOutflow(outflow, 2.0);
      expect(flow).toBe(0.05);
    });

    it('should throw error for missing orifice configuration', () => {
      const outflow: OutflowCurve = { type: 'orifice' };
      expect(() => calculateOutflow(outflow, 2.0)).toThrow(
        'Orifice configuration required for orifice outflow'
      );
    });

    it('should throw error for missing pump configuration', () => {
      const outflow: OutflowCurve = { type: 'pump' };
      expect(() => calculateOutflow(outflow, 2.0)).toThrow(
        'Pump configuration required for pump outflow'
      );
    });

    it('should throw error for missing constant configuration', () => {
      const outflow: OutflowCurve = { type: 'constant' };
      expect(() => calculateOutflow(outflow, 2.0)).toThrow(
        'Constant flow configuration required for constant outflow'
      );
    });
  });

  describe('determinePumpState', () => {
    it('should turn pump on when level reaches high level', () => {
      const outflow: OutflowCurve = {
        type: 'pump',
        pump: {
          curve: [{ head: 10, flow: { value: 0.1, unit: 'm³/s' } }],
          onOffControl: {
            highLevel: { value: 8, unit: 'm' },
            lowLevel: { value: 2, unit: 'm' },
          },
        },
      };

      expect(determinePumpState(outflow, 7, false)).toBe(false);
      expect(determinePumpState(outflow, 8, false)).toBe(true);
      expect(determinePumpState(outflow, 9, false)).toBe(true);
    });

    it('should turn pump off when level drops below low level', () => {
      const outflow: OutflowCurve = {
        type: 'pump',
        pump: {
          curve: [{ head: 10, flow: { value: 0.1, unit: 'm³/s' } }],
          onOffControl: {
            highLevel: { value: 8, unit: 'm' },
            lowLevel: { value: 2, unit: 'm' },
          },
        },
      };

      expect(determinePumpState(outflow, 3, true)).toBe(true);
      expect(determinePumpState(outflow, 2, true)).toBe(false);
      expect(determinePumpState(outflow, 1, true)).toBe(false);
    });

    it('should maintain pump state for non-pump outflow', () => {
      const outflow: OutflowCurve = {
        type: 'orifice',
        orifice: { coefficient: 0.6, area: { value: 0.01, unit: 'm²' } },
      };
      expect(determinePumpState(outflow, 5, true)).toBe(true);
      expect(determinePumpState(outflow, 5, false)).toBe(false);
    });

    it('should maintain pump state when no control is configured', () => {
      const outflow: OutflowCurve = {
        type: 'pump',
        pump: {
          curve: [{ head: 10, flow: { value: 0.1, unit: 'm³/s' } }],
        },
      };
      expect(determinePumpState(outflow, 5, true)).toBe(true);
      expect(determinePumpState(outflow, 5, false)).toBe(false);
    });
  });

  describe('simulateTank - Constant Inflow and Orifice Outflow', () => {
    it('should simulate tank with constant inflow and orifice outflow', () => {
      const input: TankSimulationInput = {
        tank: {
          area: { value: 10, unit: 'm²' },
          initialLevel: { value: 1, unit: 'm' },
          maxLevel: { value: 5, unit: 'm' },
          minLevel: { value: 0, unit: 'm' },
        },
        inflow: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' },
        },
        outflow: {
          type: 'orifice',
          orifice: {
            coefficient: 0.6,
            area: { value: 0.01, unit: 'm²' },
          },
        },
        simulation: {
          endTime: { value: 100, unit: 's' },
          timeStep: { value: 1, unit: 's' },
        },
      };

      const result = simulateTank(input);

      // Verify time series structure
      expect(result.timeSeries).toHaveLength(101); // 0 to 100 seconds
      expect(result.timeSeries[0].time).toBe(0);
      expect(result.timeSeries[100].time).toBe(100);

      // Verify initial conditions
      expect(result.timeSeries[0].level).toBe(1.0);
      expect(result.timeSeries[0].inflow).toBe(0.1);
      expect(result.timeSeries[0].outflow).toBeCloseTo(0.0266, 4);
      expect(result.timeSeries[0].pumpOn).toBe(true);

      // Verify summary statistics
      expect(result.summary.finalLevel).toBeGreaterThan(1.0);
      expect(result.summary.maxLevel).toBeGreaterThan(1.0);
      expect(result.summary.minLevel).toBe(1.0);
      expect(result.summary.averageInflow).toBeCloseTo(0.1, 10);
      expect(result.summary.averageOutflow).toBeGreaterThan(0);
      expect(result.summary.overflow).toBe(false);
      expect(result.summary.empty).toBe(false);

      // Verify metadata
      expect(result.metadata.calculations.totalSteps).toBe(100);
      expect(result.metadata.calculations.simulationTime).toBe(100);
    });

    it('should handle tank overflow scenario', () => {
      const input: TankSimulationInput = {
        tank: {
          area: { value: 1, unit: 'm²' }, // Small tank
          initialLevel: { value: 4, unit: 'm' },
          maxLevel: { value: 5, unit: 'm' },
          minLevel: { value: 0, unit: 'm' },
        },
        inflow: {
          type: 'constant',
          value: { value: 0.2, unit: 'm³/s' }, // High inflow
        },
        outflow: {
          type: 'orifice',
          orifice: {
            coefficient: 0.6,
            area: { value: 0.001, unit: 'm²' }, // Small orifice
          },
        },
        simulation: {
          endTime: { value: 50, unit: 's' },
          timeStep: { value: 1, unit: 's' },
        },
      };

      const result = simulateTank(input);

      expect(result.summary.overflow).toBe(true);
      expect(result.summary.maxLevel).toBe(5.0);
      expect(
        result.warnings.some(
          w =>
            typeof w === 'object' &&
            'message' in w &&
            w.message.includes('overflow')
        )
      ).toBe(true);
    });

    it('should handle tank empty scenario', () => {
      const input: TankSimulationInput = {
        tank: {
          area: { value: 1, unit: 'm²' },
          initialLevel: { value: 1, unit: 'm' },
          maxLevel: { value: 5, unit: 'm' },
          minLevel: { value: 0, unit: 'm' },
        },
        inflow: {
          type: 'constant',
          value: { value: 0.0001, unit: 'm³/s' }, // Extremely low inflow
        },
        outflow: {
          type: 'orifice',
          orifice: {
            coefficient: 0.6,
            area: { value: 0.05, unit: 'm²' }, // Extremely large orifice
          },
        },
        simulation: {
          endTime: { value: 200, unit: 's' },
          timeStep: { value: 1, unit: 's' },
        },
      };

      const result = simulateTank(input);

      expect(result.summary.empty).toBe(true);
      expect(result.summary.minLevel).toBe(0.0);
      expect(
        result.warnings.some(
          w =>
            typeof w === 'object' &&
            'message' in w &&
            w.message.includes('empty')
        )
      ).toBe(true);
    });

    it('should handle pump with on/off control', () => {
      const input: TankSimulationInput = {
        tank: {
          area: { value: 10, unit: 'm²' },
          initialLevel: { value: 1, unit: 'm' }, // Start below low level to ensure pump turns on
          maxLevel: { value: 5, unit: 'm' },
          minLevel: { value: 0, unit: 'm' },
        },
        inflow: {
          type: 'constant',
          value: { value: 0.3, unit: 'm³/s' }, // Much higher inflow to ensure level changes quickly
        },
        outflow: {
          type: 'pump',
          pump: {
            curve: [
              { head: 5, flow: { value: 0, unit: 'm³/s' } },
              { head: 3, flow: { value: 0.08, unit: 'm³/s' } },
              { head: 1, flow: { value: 0.15, unit: 'm³/s' } },
              { head: 0, flow: { value: 0.18, unit: 'm³/s' } },
            ],
            onOffControl: {
              highLevel: { value: 2.5, unit: 'm' }, // Lower high level to make it easier to reach
              lowLevel: { value: 2, unit: 'm' },
            },
          },
        },
        simulation: {
          endTime: { value: 100, unit: 's' },
          timeStep: { value: 1, unit: 's' },
        },
      };

      const result = simulateTank(input);

      // Check that pump state changes occur
      const pumpStates = result.timeSeries.map(point => point.pumpOn);
      const stateChanges = pumpStates.filter(
        (state, index) => index > 0 && state !== pumpStates[index - 1]
      );
      expect(stateChanges.length).toBeGreaterThan(0);

      // Verify pump control logic
      const highLevelPoints = result.timeSeries.filter(
        point => point.level >= 4
      );
      const lowLevelPoints = result.timeSeries.filter(
        point => point.level <= 2
      );

      // Pump should be on when level is high
      highLevelPoints.forEach(point => {
        expect(point.pumpOn).toBe(true);
      });

      // Pump should be off when level is low
      lowLevelPoints.forEach(point => {
        expect(point.pumpOn).toBe(false);
      });
    });

    it('should validate input parameters', () => {
      const invalidInput: TankSimulationInput = {
        tank: {
          area: { value: -10, unit: 'm²' }, // Invalid negative area
          initialLevel: { value: 1, unit: 'm' },
        },
        inflow: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' },
        },
        outflow: {
          type: 'orifice',
          orifice: {
            coefficient: 0.6,
            area: { value: 0.01, unit: 'm²' },
          },
        },
        simulation: {
          endTime: { value: 100, unit: 's' },
          timeStep: { value: 1, unit: 's' },
        },
      };

      expect(() => simulateTank(invalidInput)).toThrow(
        'Tank area must be positive'
      );
    });

    it('should validate time step constraints', () => {
      const invalidInput: TankSimulationInput = {
        tank: {
          area: { value: 10, unit: 'm²' },
          initialLevel: { value: 1, unit: 'm' },
        },
        inflow: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' },
        },
        outflow: {
          type: 'orifice',
          orifice: {
            coefficient: 0.6,
            area: { value: 0.01, unit: 'm²' },
          },
        },
        simulation: {
          endTime: { value: 10, unit: 's' },
          timeStep: { value: 20, unit: 's' }, // Time step > end time
        },
      };

      expect(() => simulateTank(invalidInput)).toThrow(
        'Time step cannot be greater than end time'
      );
    });

    it('should validate initial level bounds', () => {
      const invalidInput: TankSimulationInput = {
        tank: {
          area: { value: 10, unit: 'm²' },
          initialLevel: { value: 6, unit: 'm' }, // Above max level
          maxLevel: { value: 5, unit: 'm' },
          minLevel: { value: 0, unit: 'm' },
        },
        inflow: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' },
        },
        outflow: {
          type: 'orifice',
          orifice: {
            coefficient: 0.6,
            area: { value: 0.01, unit: 'm²' },
          },
        },
        simulation: {
          endTime: { value: 100, unit: 's' },
          timeStep: { value: 1, unit: 's' },
        },
      };

      expect(() => simulateTank(invalidInput)).toThrow(
        'Initial level must be within tank bounds'
      );
    });
  });
});
