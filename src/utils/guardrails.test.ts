import { describe, it, expect } from 'vitest';
import {
  warnTransition,
  warnMach,
  warnCorrelationRange,
  warnGeneral,
  accumulateWarnings,
  calculateReynoldsNumber,
  calculateMachNumber,
  checkFlowWarnings,
  warnTemperatureRange,
  warnPressureRange,
} from './guardrails';

describe('Guardrails', () => {
  describe('warnTransition', () => {
    it('should return warning for Reynolds number in transition region', () => {
      const warning = warnTransition(2500);

      expect(warning).not.toBeNull();
      expect(warning!.type).toBe('transition');
      expect(warning!.severity).toBe('medium');
      expect(warning!.message).toContain('2500');
      expect(warning!.message).toContain('1800-4000');
      expect(warning!.context).toEqual({
        reynoldsNumber: 2500,
        lowerBound: 1800,
        upperBound: 4000,
      });
    });

    it('should return null for Reynolds number below transition region', () => {
      const warning = warnTransition(1500);
      expect(warning).toBeNull();
    });

    it('should return null for Reynolds number above transition region', () => {
      const warning = warnTransition(5000);
      expect(warning).toBeNull();
    });

    it('should return null for Reynolds number at transition boundaries', () => {
      expect(warnTransition(1800)).toBeNull();
      expect(warnTransition(4000)).toBeNull();
    });

    it('should handle edge cases within transition region', () => {
      expect(warnTransition(1801)).not.toBeNull();
      expect(warnTransition(3999)).not.toBeNull();
      expect(warnTransition(2900)).not.toBeNull();
    });
  });

  describe('warnMach', () => {
    it('should return warning for Mach number above 0.3', () => {
      const warning = warnMach(0.5);

      expect(warning).not.toBeNull();
      expect(warning!.type).toBe('mach');
      expect(warning!.severity).toBe('high');
      expect(warning!.message).toContain('0.500');
      expect(warning!.message).toContain('0.3');
      expect(warning!.context).toEqual({
        machNumber: 0.5,
        threshold: 0.3,
      });
    });

    it('should return null for Mach number at or below 0.3', () => {
      expect(warnMach(0.3)).toBeNull();
      expect(warnMach(0.2)).toBeNull();
      expect(warnMach(0.1)).toBeNull();
    });

    it('should handle high Mach numbers', () => {
      const warning = warnMach(0.8);
      expect(warning).not.toBeNull();
      expect(warning!.message).toContain('0.800');
    });

    it('should handle very high Mach numbers', () => {
      const warning = warnMach(1.5);
      expect(warning).not.toBeNull();
      expect(warning!.message).toContain('1.500');
    });
  });

  describe('warnCorrelationRange', () => {
    it('should return warning when correlation is outside valid range', () => {
      const warning = warnCorrelationRange('waterProps', false, {
        temperature: 150,
        maxTemp: 100,
      });

      expect(warning).not.toBeNull();
      expect(warning!.type).toBe('correlation');
      expect(warning!.severity).toBe('medium');
      expect(warning!.message).toContain('waterProps');
      expect(warning!.message).toContain('outside its valid range');
      expect(warning!.context).toEqual({
        correlationName: 'waterProps',
        temperature: 150,
        maxTemp: 100,
      });
    });

    it('should return null when correlation is within valid range', () => {
      const warning = warnCorrelationRange('waterProps', true);
      expect(warning).toBeNull();
    });

    it('should handle empty context', () => {
      const warning = warnCorrelationRange('testCorrelation', false);
      expect(warning).not.toBeNull();
      expect(warning!.context).toEqual({
        correlationName: 'testCorrelation',
      });
    });

    it('should handle complex context objects', () => {
      const context = {
        temperature: 25,
        pressure: 101325,
        flowRate: 0.001,
        units: 'SI',
      };

      const warning = warnCorrelationRange(
        'complexCorrelation',
        false,
        context
      );
      expect(warning).not.toBeNull();
      expect(warning!.context).toEqual({
        correlationName: 'complexCorrelation',
        ...context,
      });
    });
  });

  describe('warnGeneral', () => {
    it('should create general warning with default severity', () => {
      const warning = warnGeneral('Test warning message');

      expect(warning.type).toBe('general');
      expect(warning.severity).toBe('medium');
      expect(warning.message).toBe('Test warning message');
      expect(warning.context).toEqual({});
    });

    it('should create general warning with custom severity', () => {
      const warning = warnGeneral('High priority warning', 'high');

      expect(warning.type).toBe('general');
      expect(warning.severity).toBe('high');
      expect(warning.message).toBe('High priority warning');
    });

    it('should create general warning with context', () => {
      const context = { userId: 123, operation: 'calculation' };
      const warning = warnGeneral('User warning', 'low', context);

      expect(warning.context).toEqual(context);
    });
  });

  describe('accumulateWarnings', () => {
    it('should filter out null warnings', () => {
      const warnings = accumulateWarnings(
        warnTransition(2500),
        warnMach(0.2), // null
        warnCorrelationRange('test', false),
        null
      );

      expect(warnings).toHaveLength(2);
      expect(warnings[0].type).toBe('transition');
      expect(warnings[1].type).toBe('correlation');
    });

    it('should return empty array for all null warnings', () => {
      const warnings = accumulateWarnings(
        warnTransition(1500), // null
        warnMach(0.2), // null
        null
      );

      expect(warnings).toHaveLength(0);
    });

    it('should return all non-null warnings', () => {
      const warnings = accumulateWarnings(
        warnTransition(2500),
        warnMach(0.5),
        warnCorrelationRange('test', false),
        warnGeneral('Custom warning')
      );

      expect(warnings).toHaveLength(4);
      expect(warnings[0].type).toBe('transition');
      expect(warnings[1].type).toBe('mach');
      expect(warnings[2].type).toBe('correlation');
      expect(warnings[3].type).toBe('general');
    });

    it('should handle empty input', () => {
      const warnings = accumulateWarnings();
      expect(warnings).toHaveLength(0);
    });
  });

  describe('calculateReynoldsNumber', () => {
    it('should calculate Reynolds number correctly', () => {
      const velocity = { value: 2, unit: 'm/s' };
      const diameter = { value: 0.05, unit: 'm' };
      const density = { value: 1000, unit: 'kg/m³' };
      const viscosity = { value: 0.001, unit: 'Pa·s' };

      const Re = calculateReynoldsNumber(
        velocity,
        diameter,
        density,
        viscosity
      );

      // Re = (1000 * 2 * 0.05) / 0.001 = 100,000
      expect(Re).toBe(100000);
    });

    it('should handle different units (assuming SI conversion)', () => {
      const velocity = { value: 2, unit: 'm/s' }; // 2 m/s
      const diameter = { value: 0.05, unit: 'm' }; // 0.05 m
      const density = { value: 1000, unit: 'kg/m³' }; // 1000 kg/m³
      const viscosity = { value: 0.001, unit: 'Pa·s' }; // 0.001 Pa·s

      const Re = calculateReynoldsNumber(
        velocity,
        diameter,
        density,
        viscosity
      );

      // Re = (1000 * 2 * 0.05) / 0.001 = 100,000
      expect(Re).toBe(100000);
    });
  });

  describe('calculateMachNumber', () => {
    it('should calculate Mach number correctly', () => {
      const velocity = { value: 340, unit: 'm/s' };
      const speedOfSound = { value: 340, unit: 'm/s' };

      const M = calculateMachNumber(velocity, speedOfSound);

      expect(M).toBe(1.0);
    });

    it('should handle subsonic flow', () => {
      const velocity = { value: 170, unit: 'm/s' };
      const speedOfSound = { value: 340, unit: 'm/s' };

      const M = calculateMachNumber(velocity, speedOfSound);

      expect(M).toBe(0.5);
    });

    it('should handle supersonic flow', () => {
      const velocity = { value: 680, unit: 'm/s' };
      const speedOfSound = { value: 340, unit: 'm/s' };

      const M = calculateMachNumber(velocity, speedOfSound);

      expect(M).toBe(2.0);
    });
  });

  describe('checkFlowWarnings', () => {
    it('should return warnings for transition and Mach number', () => {
      const velocity = { value: 1, unit: 'm/s' };
      const diameter = { value: 0.01, unit: 'm' };
      const density = { value: 1000, unit: 'kg/m³' };
      const viscosity = { value: 0.001, unit: 'Pa·s' };
      const speedOfSound = { value: 340, unit: 'm/s' };

      const warnings = checkFlowWarnings(
        velocity,
        diameter,
        density,
        viscosity,
        speedOfSound
      );

      // Re = (1000 * 1 * 0.01) / 0.001 = 10,000 (no transition warning)
      // M = 1 / 340 = 0.0029 (no Mach warning)
      expect(warnings).toHaveLength(0);
    });

    it('should return transition warning for appropriate Reynolds number', () => {
      const velocity = { value: 0.3, unit: 'm/s' };
      const diameter = { value: 0.01, unit: 'm' };
      const density = { value: 1000, unit: 'kg/m³' };
      const viscosity = { value: 0.001, unit: 'Pa·s' };

      const warnings = checkFlowWarnings(
        velocity,
        diameter,
        density,
        viscosity
      );

      // Re = (1000 * 0.3 * 0.01) / 0.001 = 3000 (transition warning)
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('transition');
    });

    it('should return Mach warning for high velocity', () => {
      const velocity = { value: 150, unit: 'm/s' };
      const diameter = { value: 0.01, unit: 'm' };
      const density = { value: 1000, unit: 'kg/m³' };
      const viscosity = { value: 0.001, unit: 'Pa·s' };
      const speedOfSound = { value: 340, unit: 'm/s' };

      const warnings = checkFlowWarnings(
        velocity,
        diameter,
        density,
        viscosity,
        speedOfSound
      );

      // M = 150 / 340 = 0.441 (Mach warning)
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('mach');
    });

    it('should return both warnings when applicable', () => {
      const velocity = { value: 0.3, unit: 'm/s' };
      const diameter = { value: 0.01, unit: 'm' };
      const density = { value: 1000, unit: 'kg/m³' };
      const viscosity = { value: 0.001, unit: 'Pa·s' };
      const speedOfSound = { value: 340, unit: 'm/s' };

      const warnings = checkFlowWarnings(
        velocity,
        diameter,
        density,
        viscosity,
        speedOfSound
      );

      // Re = 3000 (transition warning), M = 0.0009 (no Mach warning)
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('transition');
    });
  });

  describe('warnTemperatureRange', () => {
    it('should return warning for temperature below range', () => {
      const temperature = { value: -10, unit: 'C' };
      const warning = warnTemperatureRange(temperature, 0, 100, 'waterProps');

      expect(warning).not.toBeNull();
      expect(warning!.type).toBe('correlation');
      expect(warning!.message).toContain('-10 C');
      expect(warning!.message).toContain('0-100 C');
      expect(warning!.context).toEqual({
        correlationName: 'waterProps',
        temperature: -10,
        unit: 'C',
        minTemp: 0,
        maxTemp: 100,
      });
    });

    it('should return warning for temperature above range', () => {
      const temperature = { value: 150, unit: 'C' };
      const warning = warnTemperatureRange(temperature, 0, 100, 'waterProps');

      expect(warning).not.toBeNull();
      expect(warning!.message).toContain('150 C');
    });

    it('should return null for temperature within range', () => {
      const temperature = { value: 50, unit: 'C' };
      const warning = warnTemperatureRange(temperature, 0, 100, 'waterProps');

      expect(warning).toBeNull();
    });

    it('should handle boundary temperatures', () => {
      const temp1 = { value: 0, unit: 'C' };
      const temp2 = { value: 100, unit: 'C' };

      expect(warnTemperatureRange(temp1, 0, 100, 'test')).toBeNull();
      expect(warnTemperatureRange(temp2, 0, 100, 'test')).toBeNull();
    });
  });

  describe('warnPressureRange', () => {
    it('should return warning for pressure below range', () => {
      const pressure = { value: 50000, unit: 'Pa' };
      const warning = warnPressureRange(pressure, 100000, 1000000, 'airProps');

      expect(warning).not.toBeNull();
      expect(warning!.type).toBe('correlation');
      expect(warning!.message).toContain('50000 Pa');
      expect(warning!.message).toContain('100000-1000000 Pa');
    });

    it('should return warning for pressure above range', () => {
      const pressure = { value: 2000000, unit: 'Pa' };
      const warning = warnPressureRange(pressure, 100000, 1000000, 'airProps');

      expect(warning).not.toBeNull();
      expect(warning!.message).toContain('2000000 Pa');
    });

    it('should return null for pressure within range', () => {
      const pressure = { value: 500000, unit: 'Pa' };
      const warning = warnPressureRange(pressure, 100000, 1000000, 'airProps');

      expect(warning).toBeNull();
    });

    it('should handle different pressure units', () => {
      const pressure = { value: 50, unit: 'bar' };
      const warning = warnPressureRange(pressure, 1, 10, 'testCorrelation');

      expect(warning).not.toBeNull();
      expect(warning!.message).toContain('50 bar');
      expect(warning!.message).toContain('1-10 bar');
    });
  });

  describe('Integration tests', () => {
    it('should handle multiple warnings in a realistic scenario', () => {
      // Simulate a high-speed, small-diameter flow
      const velocity = { value: 200, unit: 'm/s' };
      const diameter = { value: 0.005, unit: 'm' };
      const density = { value: 1000, unit: 'kg/m³' };
      const viscosity = { value: 0.001, unit: 'Pa·s' };
      const speedOfSound = { value: 340, unit: 'm/s' };

      const warnings = checkFlowWarnings(
        velocity,
        diameter,
        density,
        viscosity,
        speedOfSound
      );

      // Re = (1000 * 200 * 0.005) / 0.001 = 1,000,000 (no transition warning)
      // M = 200 / 340 = 0.588 (Mach warning)
      expect(warnings).toHaveLength(1);
      expect(warnings[0].type).toBe('mach');
    });

    it('should accumulate warnings from different sources', () => {
      const warnings = accumulateWarnings(
        warnTransition(2500),
        warnMach(0.4),
        warnTemperatureRange({ value: 150, unit: 'C' }, 0, 100, 'waterProps'),
        warnPressureRange(
          { value: 50000, unit: 'Pa' },
          100000,
          1000000,
          'airProps'
        )
      );

      expect(warnings).toHaveLength(4);
      expect(warnings[0].type).toBe('transition');
      expect(warnings[1].type).toBe('mach');
      expect(warnings[2].type).toBe('correlation');
      expect(warnings[3].type).toBe('correlation');
    });
  });
});
