import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  zQuantity,
  Quantity,
  zFluid,
  Fluid,
  zWarning,
  Warning,
  zCalcMeta,
  CalcMeta,
  zCalcResponse,
  CalcResponse,
  quantityJsonSchema,
  fluidJsonSchema,
  warningJsonSchema,
  calcMetaJsonSchema,
  createCalcResponseJsonSchema,
} from './common';

describe('zQuantity', () => {
  it('should validate a valid quantity', () => {
    const validQuantity = {
      value: 100.5,
      unit: 'm/s',
    };

    const result = zQuantity.safeParse(validQuantity);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validQuantity);
    }
  });

  it('should reject quantity with empty unit', () => {
    const invalidQuantity = {
      value: 100.5,
      unit: '',
    };

    const result = zQuantity.safeParse(invalidQuantity);
    expect(result.success).toBe(false);
  });

  it('should reject quantity with non-string unit', () => {
    const invalidQuantity = {
      value: 100.5,
      unit: 123,
    };

    const result = zQuantity.safeParse(invalidQuantity);
    expect(result.success).toBe(false);
  });

  it('should reject quantity with non-number value', () => {
    const invalidQuantity = {
      value: 'not a number',
      unit: 'm/s',
    };

    const result = zQuantity.safeParse(invalidQuantity);
    expect(result.success).toBe(false);
  });

  it('should create type-safe instance', () => {
    const quantity: Quantity = {
      value: 42.0,
      unit: 'kPa',
    };

    expect(quantity.value).toBe(42.0);
    expect(quantity.unit).toBe('kPa');
  });
});

describe('zFluid', () => {
  it('should validate a complete fluid', () => {
    const validFluid = {
      name: 'Water',
      density: { value: 1000, unit: 'kg/m³' },
      viscosity: { value: 0.001, unit: 'Pa·s' },
      temperature: { value: 20, unit: '°C' },
      vaporPressure: { value: 2.34, unit: 'kPa' },
    };

    const result = zFluid.safeParse(validFluid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validFluid);
    }
  });

  it('should validate a minimal fluid', () => {
    const minimalFluid = {
      density: { value: 1000, unit: 'kg/m³' },
      viscosity: { value: 0.001, unit: 'Pa·s' },
    };

    const result = zFluid.safeParse(minimalFluid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(minimalFluid);
    }
  });

  it('should reject fluid with invalid density', () => {
    const invalidFluid = {
      name: 'Water',
      density: { value: 'not a number', unit: 'kg/m³' },
      viscosity: { value: 0.001, unit: 'Pa·s' },
    };

    const result = zFluid.safeParse(invalidFluid);
    expect(result.success).toBe(false);
  });

  it('should reject fluid with missing required fields', () => {
    const invalidFluid = {
      name: 'Water',
      density: { value: 1000, unit: 'kg/m³' },
      // missing viscosity
    };

    const result = zFluid.safeParse(invalidFluid);
    expect(result.success).toBe(false);
  });

  it('should create type-safe instance', () => {
    const fluid: Fluid = {
      name: 'Oil',
      density: { value: 850, unit: 'kg/m³' },
      viscosity: { value: 0.05, unit: 'Pa·s' },
      temperature: { value: 25, unit: '°C' },
    };

    expect(fluid.name).toBe('Oil');
    expect(fluid.density.value).toBe(850);
    expect(fluid.viscosity.unit).toBe('Pa·s');
    expect(fluid.temperature?.value).toBe(25);
  });
});

describe('zWarning', () => {
  it('should validate a warning without context', () => {
    const validWarning = {
      code: 'WARN_001',
      message: 'Flow rate is approaching maximum capacity',
    };

    const result = zWarning.safeParse(validWarning);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validWarning);
    }
  });

  it('should validate a warning with context', () => {
    const validWarning = {
      code: 'WARN_002',
      message: 'High pressure detected',
      context: {
        pressure: 1500,
        threshold: 1200,
        location: 'pump_outlet',
      },
    };

    const result = zWarning.safeParse(validWarning);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validWarning);
    }
  });

  it('should reject warning with invalid code', () => {
    const invalidWarning = {
      code: 123,
      message: 'Invalid input parameters',
    };

    const result = zWarning.safeParse(invalidWarning);
    expect(result.success).toBe(false);
  });

  it('should create type-safe instance', () => {
    const warning: Warning = {
      code: 'ERROR_001',
      message: 'Invalid input parameters',
      context: { field: 'flowRate', value: -5 },
    };

    expect(warning.code).toBe('ERROR_001');
    expect(warning.message).toBe('Invalid input parameters');
    expect(warning.context).toEqual({ field: 'flowRate', value: -5 });
  });
});

describe('zCalcMeta', () => {
  it('should validate complete calc meta', () => {
    const validMeta = {
      iterations: 15,
      residual: 0.0001,
      runtimeMs: 45.2,
    };

    const result = zCalcMeta.safeParse(validMeta);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validMeta);
    }
  });

  it('should validate partial calc meta', () => {
    const partialMeta = {
      iterations: 10,
    };

    const result = zCalcMeta.safeParse(partialMeta);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(partialMeta);
    }
  });

  it('should validate empty calc meta', () => {
    const emptyMeta = {};

    const result = zCalcMeta.safeParse(emptyMeta);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(emptyMeta);
    }
  });

  it('should create type-safe instance', () => {
    const meta: CalcMeta = {
      iterations: 20,
      residual: 0.001,
      runtimeMs: 100.5,
    };

    expect(meta.iterations).toBe(20);
    expect(meta.residual).toBe(0.001);
    expect(meta.runtimeMs).toBe(100.5);
  });
});

describe('zCalcResponse', () => {
  it('should validate a complete calculation response', () => {
    const resultSchema = z.object({
      pressureDrop: z.number(),
      reynoldsNumber: z.number(),
    });

    const responseSchema = zCalcResponse(resultSchema);

    const validResponse = {
      input: { flowRate: 0.1, pipeDiameter: 0.05 },
      result: {
        pressureDrop: 1250.5,
        reynoldsNumber: 25400,
      },
      warnings: [
        {
          code: 'WARN_001',
          message: 'High Reynolds number detected',
        },
      ],
      meta: {
        iterations: 5,
        residual: 0.0001,
        runtimeMs: 12.5,
      },
    };

    const result = responseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validResponse);
    }
  });

  it('should validate a minimal calculation response', () => {
    const resultSchema = z.number();
    const responseSchema = zCalcResponse(resultSchema);

    const minimalResponse = {
      input: { value: 42 },
      result: 123.45,
    };

    const result = responseSchema.safeParse(minimalResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(minimalResponse);
    }
  });

  it('should create type-safe instance', () => {
    const response: CalcResponse<{ pressureDrop: number }> = {
      input: { flowRate: 0.1 },
      result: { pressureDrop: 1000 },
      warnings: [
        {
          code: 'INFO_001',
          message: 'Calculation completed successfully',
        },
      ],
      meta: {
        iterations: 3,
        runtimeMs: 5.2,
      },
    };

    expect(response.input).toEqual({ flowRate: 0.1 });
    expect(response.result.pressureDrop).toBe(1000);
    expect(response.warnings).toHaveLength(1);
    expect(response.meta?.iterations).toBe(3);
  });
});

describe('JSON Schema Generation', () => {
  it('should generate JSON schemas', () => {
    // Test that JSON schemas are generated (basic structure check)
    expect(quantityJsonSchema).toBeDefined();
    expect(fluidJsonSchema).toBeDefined();
    expect(warningJsonSchema).toBeDefined();
    expect(calcMetaJsonSchema).toBeDefined();
  });

  it('should generate calc response JSON schema', () => {
    const resultSchema = z.object({
      pressureDrop: z.number(),
      reynoldsNumber: z.number(),
    });

    const responseJsonSchema = createCalcResponseJsonSchema(resultSchema);
    expect(responseJsonSchema).toBeDefined();
  });

  it('should generate OpenAPI 3.0 compatible schemas', () => {
    // Check that schemas are valid objects
    expect(typeof quantityJsonSchema).toBe('object');
    expect(typeof fluidJsonSchema).toBe('object');
    expect(typeof warningJsonSchema).toBe('object');
    expect(typeof calcMetaJsonSchema).toBe('object');
  });

  it('should debug JSON schema structure', () => {
    console.log('Quantity JSON Schema:', JSON.stringify(quantityJsonSchema, null, 2));
    console.log('Fluid JSON Schema:', JSON.stringify(fluidJsonSchema, null, 2));
    console.log('Warning JSON Schema:', JSON.stringify(warningJsonSchema, null, 2));
    console.log('CalcMeta JSON Schema:', JSON.stringify(calcMetaJsonSchema, null, 2));
  });
});
