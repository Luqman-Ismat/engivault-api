import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  EngineeringQuantitySchema,
  EngineeringQuantity,
  WarningSchema,
  Warning,
  CalcMetaSchema,
  CalcMeta,
  CalcResponseSchema,
  CalcResponse,
} from './shared';

describe('EngineeringQuantity', () => {
  it('should validate a valid engineering quantity', () => {
    const validQuantity = {
      value: 100.5,
      unit: 'm/s',
    };

    const result = EngineeringQuantitySchema.safeParse(validQuantity);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validQuantity);
    }
  });

  it('should reject invalid engineering quantity', () => {
    const invalidQuantity = {
      value: 'not a number',
      unit: 123,
    };

    const result = EngineeringQuantitySchema.safeParse(invalidQuantity);
    expect(result.success).toBe(false);
  });

  it('should create type-safe instance', () => {
    const quantity: EngineeringQuantity = {
      value: 42.0,
      unit: 'kPa',
    };

    expect(quantity.value).toBe(42.0);
    expect(quantity.unit).toBe('kPa');
  });
});

describe('Warning', () => {
  it('should validate a valid warning without context', () => {
    const validWarning = {
      code: 'WARN_001',
      message: 'Flow rate is approaching maximum capacity',
    };

    const result = WarningSchema.safeParse(validWarning);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validWarning);
    }
  });

  it('should validate a valid warning with context', () => {
    const validWarning = {
      code: 'WARN_002',
      message: 'High pressure detected',
      context: {
        pressure: 1500,
        threshold: 1200,
        location: 'pump_outlet',
      },
    };

    const result = WarningSchema.safeParse(validWarning);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validWarning);
    }
  });

  it('should reject invalid warning', () => {
    const invalidWarning = {
      code: 123,
      message: null,
    };

    const result = WarningSchema.safeParse(invalidWarning);
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

describe('CalcMeta', () => {
  it('should validate complete calc meta', () => {
    const validMeta = {
      iterations: 15,
      residual: 0.0001,
      runtimeMs: 45.2,
    };

    const result = CalcMetaSchema.safeParse(validMeta);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validMeta);
    }
  });

  it('should validate partial calc meta', () => {
    const partialMeta = {
      iterations: 10,
    };

    const result = CalcMetaSchema.safeParse(partialMeta);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(partialMeta);
    }
  });

  it('should validate empty calc meta', () => {
    const emptyMeta = {};

    const result = CalcMetaSchema.safeParse(emptyMeta);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(emptyMeta);
    }
  });

  it('should reject invalid calc meta', () => {
    const invalidMeta = {
      iterations: 'not a number',
      runtimeMs: 'invalid',
    };

    const result = CalcMetaSchema.safeParse(invalidMeta);
    expect(result.success).toBe(false);
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

describe('CalcResponse', () => {
  it('should validate a complete calculation response', () => {
    const resultSchema = z.object({
      pressureDrop: z.number(),
      reynoldsNumber: z.number(),
    });

    const responseSchema = CalcResponseSchema(resultSchema);

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
    const responseSchema = CalcResponseSchema(resultSchema);

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

  it('should reject invalid calculation response', () => {
    const resultSchema = z.number();
    const responseSchema = CalcResponseSchema(resultSchema);

    const invalidResponse = {
      input: 'not an object',
      result: 'not a number',
    };

    const result = responseSchema.safeParse(invalidResponse);
    expect(result.success).toBe(false);
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

  it('should work with complex nested schemas', () => {
    const complexResultSchema = z.object({
      quantities: z.array(EngineeringQuantitySchema),
      summary: z.string(),
    });

    const responseSchema = CalcResponseSchema(complexResultSchema);

    const complexResponse = {
      input: { parameters: { a: 1, b: 2 } },
      result: {
        quantities: [
          { value: 100, unit: 'm/s' },
          { value: 50, unit: 'kPa' },
        ],
        summary: 'Calculation completed with 2 quantities',
      },
      meta: {
        iterations: 10,
        runtimeMs: 25.0,
      },
    };

    const result = responseSchema.safeParse(complexResponse);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.result.quantities).toHaveLength(2);
      expect(result.data.result.quantities[0].unit).toBe('m/s');
    }
  });
});
