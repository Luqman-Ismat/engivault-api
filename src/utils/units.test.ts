import { describe, it, expect } from 'vitest';
import {
  convert,
  toSI,
  sig,
  normalize,
  isSupportedUnit,
  getUnitCategory,
  getUnitsForCategory,
  getSupportedCategories,
  UNIT_CONVERSIONS,
  SI_BASE_UNITS,
} from './units';
import { zQuantity } from '../schemas/common';

describe('sig (Significant Digits)', () => {
  it('should round to specified significant digits', () => {
    expect(sig(123.456789, 3)).toBe(123);
    expect(sig(123.456789, 4)).toBe(123.5);
    expect(sig(123.456789, 5)).toBe(123.46);
    expect(sig(0.00123456, 3)).toBe(0.00123);
    expect(sig(1000.123, 4)).toBe(1000);
  });

  it('should handle zero correctly', () => {
    expect(sig(0, 3)).toBe(0);
    expect(sig(0, 5)).toBe(0);
  });

  it('should handle negative numbers', () => {
    expect(sig(-123.456789, 3)).toBe(-123);
    expect(sig(-0.00123456, 3)).toBe(-0.00123);
  });

  it('should handle very large and small numbers', () => {
    expect(sig(123456789, 3)).toBe(123000000);
    expect(sig(0.000000123456, 3)).toBe(0.000000123);
  });
});

describe('convert', () => {
  describe('Length conversions', () => {
    it('should convert meters to feet', () => {
      const result = convert({ value: 1, unit: 'm' }, 'ft');
      expect(result.value).toBeCloseTo(3.28084, 5);
      expect(result.unit).toBe('ft');
    });

    it('should convert feet to meters', () => {
      const result = convert({ value: 3.28084, unit: 'ft' }, 'm');
      expect(result.value).toBeCloseTo(1, 5);
      expect(result.unit).toBe('m');
    });

    it('should handle round-trip conversion', () => {
      const original = { value: 10.5, unit: 'm' };
      const toFeet = convert(original, 'ft');
      const backToMeters = convert(toFeet, 'm');

      expect(backToMeters.value).toBeCloseTo(original.value, 10);
      expect(backToMeters.unit).toBe(original.unit);
    });
  });

  describe('Diameter conversions', () => {
    it('should convert inches to meters', () => {
      const result = convert({ value: 1, unit: 'in' }, 'm');
      expect(result.value).toBeCloseTo(0.0254, 5);
      expect(result.unit).toBe('m');
    });

    it('should convert meters to inches', () => {
      const result = convert({ value: 0.0254, unit: 'm' }, 'in');
      expect(result.value).toBeCloseTo(1, 5);
      expect(result.unit).toBe('in');
    });
  });

  describe('Pressure conversions', () => {
    it('should convert psi to Pa', () => {
      const result = convert({ value: 1, unit: 'psi' }, 'Pa');
      expect(result.value).toBeCloseTo(6894.76, 2);
      expect(result.unit).toBe('Pa');
    });

    it('should convert bar to Pa', () => {
      const result = convert({ value: 1, unit: 'bar' }, 'Pa');
      expect(result.value).toBeCloseTo(100000, 0);
      expect(result.unit).toBe('Pa');
    });

    it('should convert Pa to psi', () => {
      const result = convert({ value: 6894.76, unit: 'Pa' }, 'psi');
      expect(result.value).toBeCloseTo(1, 5);
      expect(result.unit).toBe('psi');
    });

    it('should handle round-trip pressure conversion', () => {
      const original = { value: 100, unit: 'psi' };
      const toPa = convert(original, 'Pa');
      const backToPsi = convert(toPa, 'psi');

      expect(backToPsi.value).toBeCloseTo(original.value, 10);
      expect(backToPsi.unit).toBe(original.unit);
    });
  });

  describe('Density conversions', () => {
    it('should convert lb/ft³ to kg/m³', () => {
      const result = convert({ value: 1, unit: 'lb/ft³' }, 'kg/m³');
      expect(result.value).toBeCloseTo(16.0185, 4);
      expect(result.unit).toBe('kg/m³');
    });

    it('should convert kg/m³ to lb/ft³', () => {
      const result = convert({ value: 16.0185, unit: 'kg/m³' }, 'lb/ft³');
      expect(result.value).toBeCloseTo(1, 5);
      expect(result.unit).toBe('lb/ft³');
    });
  });

  describe('Viscosity conversions', () => {
    it('should convert cP to Pa·s', () => {
      const result = convert({ value: 1000, unit: 'cP' }, 'Pa·s');
      expect(result.value).toBeCloseTo(1, 5);
      expect(result.unit).toBe('Pa·s');
    });

    it('should convert Pa·s to cP', () => {
      const result = convert({ value: 1, unit: 'Pa·s' }, 'cP');
      expect(result.value).toBeCloseTo(1000, 0);
      expect(result.unit).toBe('cP');
    });
  });

  describe('Flow conversions', () => {
    it('should convert L/s to m³/s', () => {
      const result = convert({ value: 1000, unit: 'L/s' }, 'm³/s');
      expect(result.value).toBeCloseTo(1, 5);
      expect(result.unit).toBe('m³/s');
    });

    it('should convert gpm to m³/s', () => {
      const result = convert({ value: 1, unit: 'gpm' }, 'm³/s');
      expect(result.value).toBeCloseTo(0.0000630902, 10);
      expect(result.unit).toBe('m³/s');
    });

    it('should convert m³/s to gpm', () => {
      const result = convert({ value: 0.0000630902, unit: 'm³/s' }, 'gpm');
      expect(result.value).toBeCloseTo(1, 5);
      expect(result.unit).toBe('gpm');
    });
  });

  describe('Velocity conversions', () => {
    it('should convert ft/s to m/s', () => {
      const result = convert({ value: 1, unit: 'ft/s' }, 'm/s');
      expect(result.value).toBeCloseTo(0.3048, 5);
      expect(result.unit).toBe('m/s');
    });

    it('should convert m/s to ft/s', () => {
      const result = convert({ value: 0.3048, unit: 'm/s' }, 'ft/s');
      expect(result.value).toBeCloseTo(1, 5);
      expect(result.unit).toBe('ft/s');
    });
  });

  describe('Temperature conversions (affine)', () => {
    it('should convert Celsius to Kelvin', () => {
      const result = convert({ value: 0, unit: 'C' }, 'K');
      expect(result.value).toBeCloseTo(273.15, 2);
      expect(result.unit).toBe('K');
    });

    it('should convert Kelvin to Celsius', () => {
      const result = convert({ value: 273.15, unit: 'K' }, 'C');
      expect(result.value).toBeCloseTo(0, 2);
      expect(result.unit).toBe('C');
    });

    it('should convert Fahrenheit to Celsius', () => {
      const result = convert({ value: 32, unit: 'F' }, 'C');
      expect(result.value).toBeCloseTo(0, 2);
      expect(result.unit).toBe('C');
    });

    it('should convert Celsius to Fahrenheit', () => {
      const result = convert({ value: 0, unit: 'C' }, 'F');
      expect(result.value).toBeCloseTo(32, 2);
      expect(result.unit).toBe('F');
    });

    it('should convert Fahrenheit to Kelvin', () => {
      const result = convert({ value: 32, unit: 'F' }, 'K');
      expect(result.value).toBeCloseTo(273.15, 2);
      expect(result.unit).toBe('K');
    });

    it('should handle round-trip temperature conversion', () => {
      const original = { value: 25, unit: 'C' };
      const toF = convert(original, 'F');
      const backToC = convert(toF, 'C');

      expect(backToC.value).toBeCloseTo(original.value, 10);
      expect(backToC.unit).toBe(original.unit);
    });
  });

  describe('Power conversions', () => {
    it('should convert kW to W', () => {
      const result = convert({ value: 1, unit: 'kW' }, 'W');
      expect(result.value).toBeCloseTo(1000, 0);
      expect(result.unit).toBe('W');
    });

    it('should convert hp to W', () => {
      const result = convert({ value: 1, unit: 'hp' }, 'W');
      expect(result.value).toBeCloseTo(745.7, 1);
      expect(result.unit).toBe('W');
    });

    it('should convert W to hp', () => {
      const result = convert({ value: 745.7, unit: 'W' }, 'hp');
      expect(result.value).toBeCloseTo(1, 5);
      expect(result.unit).toBe('hp');
    });
  });

  describe('Error handling', () => {
    it('should throw error for unsupported source unit', () => {
      expect(() => convert({ value: 1, unit: 'invalid' }, 'm')).toThrow(
        'Unsupported source unit: invalid'
      );
    });

    it('should throw error for unsupported target unit', () => {
      expect(() => convert({ value: 1, unit: 'm' }, 'invalid')).toThrow(
        'Unsupported target unit: invalid'
      );
    });

    it('should throw error for incompatible units', () => {
      expect(() => convert({ value: 1, unit: 'm' }, 'Pa')).toThrow(
        'Cannot convert from m (length) to Pa (pressure)'
      );
    });
  });
});

describe('toSI', () => {
  it('should convert length to meters', () => {
    const result = toSI({ value: 3.28084, unit: 'ft' });
    expect(result.value).toBeCloseTo(1, 5);
    expect(result.unit).toBe('m');
  });

  it('should convert pressure to Pa', () => {
    const result = toSI({ value: 1, unit: 'psi' });
    expect(result.value).toBeCloseTo(6894.76, 2);
    expect(result.unit).toBe('Pa');
  });

  it('should convert temperature to K', () => {
    const result = toSI({ value: 0, unit: 'C' });
    expect(result.value).toBeCloseTo(273.15, 2);
    expect(result.unit).toBe('K');
  });

  it('should handle already SI units', () => {
    const result = toSI({ value: 100, unit: 'Pa' });
    expect(result.value).toBe(100);
    expect(result.unit).toBe('Pa');
  });

  it('should throw error for unknown unit', () => {
    expect(() => toSI({ value: 1, unit: 'unknown' })).toThrow(
      'Unknown unit category for: unknown'
    );
  });
});

describe('normalize', () => {
  it('should normalize simple object with quantity fields', () => {
    const obj = {
      length: { value: 3.28084, unit: 'ft' },
      pressure: { value: 1, unit: 'psi' },
      temperature: { value: 0, unit: 'C' },
    };

    const unitMap = {
      length: 'length',
      pressure: 'pressure',
      temperature: 'temperature',
    };

    const result = normalize(obj, unitMap);

    expect(result.length.value).toBeCloseTo(1, 5);
    expect(result.length.unit).toBe('m');
    expect(result.pressure.value).toBeCloseTo(6894.76, 2);
    expect(result.pressure.unit).toBe('Pa');
    expect(result.temperature.value).toBeCloseTo(273.15, 2);
    expect(result.temperature.unit).toBe('K');
  });

  it('should normalize nested object with quantity fields', () => {
    const obj = {
      pipe: {
        diameter: { value: 1, unit: 'in' },
        length: { value: 10, unit: 'ft' },
      },
      fluid: {
        density: { value: 62.4, unit: 'lb/ft³' },
        viscosity: { value: 1, unit: 'cP' },
      },
    };

    const unitMap = {
      'pipe.diameter': 'length',
      'pipe.length': 'length',
      'fluid.density': 'density',
      'fluid.viscosity': 'viscosity',
    };

    const result = normalize(obj, unitMap);

    expect(result.pipe.diameter.value).toBeCloseTo(0.0254, 5);
    expect(result.pipe.diameter.unit).toBe('m');
    expect(result.pipe.length.value).toBeCloseTo(3.048, 3);
    expect(result.pipe.length.unit).toBe('m');
    expect(result.fluid.density.value).toBeCloseTo(999.6, 1);
    expect(result.fluid.density.unit).toBe('kg/m³');
    expect(result.fluid.viscosity.value).toBeCloseTo(0.001, 5);
    expect(result.fluid.viscosity.unit).toBe('Pa·s');
  });

  it('should skip conversion for unsupported units', () => {
    const obj = {
      valid: { value: 1, unit: 'm' },
      invalid: { value: 1, unit: 'unsupported' },
    };

    const unitMap = {
      valid: 'length',
      invalid: 'length',
    };

    const result = normalize(obj, unitMap);

    expect(result.valid.value).toBe(1);
    expect(result.valid.unit).toBe('m');
    expect(result.invalid.value).toBe(1);
    expect(result.invalid.unit).toBe('unsupported');
  });

  it('should handle non-quantity fields gracefully', () => {
    const obj = {
      quantity: { value: 1, unit: 'm' },
      string: 'not a quantity',
      number: 42,
      null: null,
    };

    const unitMap = {
      quantity: 'length',
      string: 'length',
      number: 'length',
      null: 'length',
    };

    const result = normalize(obj, unitMap);

    expect(result.quantity.value).toBe(1);
    expect(result.quantity.unit).toBe('m');
    expect(result.string).toBe('not a quantity');
    expect(result.number).toBe(42);
    expect(result.null).toBe(null);
  });
});

describe('Utility functions', () => {
  describe('isSupportedUnit', () => {
    it('should return true for supported units', () => {
      expect(isSupportedUnit('m')).toBe(true);
      expect(isSupportedUnit('ft')).toBe(true);
      expect(isSupportedUnit('psi')).toBe(true);
      expect(isSupportedUnit('C')).toBe(true);
    });

    it('should return false for unsupported units', () => {
      expect(isSupportedUnit('unsupported')).toBe(false);
      expect(isSupportedUnit('')).toBe(false);
    });
  });

  describe('getUnitCategory', () => {
    it('should return correct categories', () => {
      expect(getUnitCategory('m')).toBe('length');
      expect(getUnitCategory('psi')).toBe('pressure');
      expect(getUnitCategory('C')).toBe('temperature');
      expect(getUnitCategory('kg/m³')).toBe('density');
    });

    it('should return undefined for unknown units', () => {
      expect(getUnitCategory('unknown')).toBeUndefined();
    });
  });

  describe('getUnitsForCategory', () => {
    it('should return all units for a category', () => {
      const lengthUnits = getUnitsForCategory('length');
      expect(lengthUnits).toContain('m');
      expect(lengthUnits).toContain('ft');
      expect(lengthUnits).toContain('in');
      expect(lengthUnits).toHaveLength(3);
    });

    it('should return empty array for unknown category', () => {
      expect(getUnitsForCategory('unknown')).toEqual([]);
    });
  });

  describe('getSupportedCategories', () => {
    it('should return all supported categories', () => {
      const categories = getSupportedCategories();
      expect(categories).toContain('length');
      expect(categories).toContain('pressure');
      expect(categories).toContain('temperature');
      expect(categories).toContain('density');
      expect(categories).toContain('viscosity');
      expect(categories).toContain('flow');
      expect(categories).toContain('velocity');
      expect(categories).toContain('power');
      expect(categories).toContain('head');
    });
  });
});

describe('Constants', () => {
  it('should export UNIT_CONVERSIONS', () => {
    expect(UNIT_CONVERSIONS).toBeDefined();
    expect(UNIT_CONVERSIONS['m']).toEqual({ factor: 1, offset: 0 });
    expect(UNIT_CONVERSIONS['ft']).toEqual({ factor: 0.3048, offset: 0 });
  });

  it('should export SI_BASE_UNITS', () => {
    expect(SI_BASE_UNITS).toBeDefined();
    expect(SI_BASE_UNITS['length']).toBe('m');
    expect(SI_BASE_UNITS['pressure']).toBe('Pa');
    expect(SI_BASE_UNITS['temperature']).toBe('K');
  });
});

describe('Integration with Zod schemas', () => {
  it('should work with zQuantity validation', () => {
    const validQuantity = { value: 100, unit: 'm' };
    const result = zQuantity.safeParse(validQuantity);
    expect(result.success).toBe(true);

    if (result.success) {
      const converted = convert(result.data, 'ft');
      expect(converted.value).toBeCloseTo(328.084, 3);
      expect(converted.unit).toBe('ft');
    }
  });
});
