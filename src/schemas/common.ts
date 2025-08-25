import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Engineering quantity with value and non-empty unit
export const zQuantity = z.object({
  value: z.number(),
  unit: z.string().min(1, 'Unit must not be empty'),
});

export type Quantity = z.infer<typeof zQuantity>;

// Fluid properties with optional fields
export const zFluid = z.object({
  name: z.string().optional(),
  density: zQuantity.optional(),
  viscosity: zQuantity.optional(),
  temperature: zQuantity.optional(),
  vaporPressure: zQuantity.optional(),
});

export type Fluid = z.infer<typeof zFluid>;

// Warning with code, message, and optional context
export const zWarning = z.object({
  code: z.string(),
  message: z.string(),
  context: z.object({}).passthrough().optional(),
});

export type Warning = z.infer<typeof zWarning>;

// Calculation metadata
export const zCalcMeta = z.object({
  iterations: z.number().optional(),
  residual: z.number().optional(),
  runtimeMs: z.number().optional(),
});

export type CalcMeta = z.infer<typeof zCalcMeta>;

// Generic calculation response
export const zCalcResponse = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z.object({
    input: z.unknown(),
    result: resultSchema,
    warnings: z.array(zWarning).optional(),
    meta: zCalcMeta.optional(),
  });

export type CalcResponse<T> = {
  input: unknown;
  result: T;
  warnings?: Warning[];
  meta?: CalcMeta;
};

// JSON Schema exports for Fastify Swagger
export const quantityJsonSchema = zodToJsonSchema(zQuantity, {
  target: 'openApi3',
});

export const fluidJsonSchema = zodToJsonSchema(zFluid, {
  target: 'openApi3',
});

export const warningJsonSchema = zodToJsonSchema(zWarning, {
  target: 'openApi3',
});

export const calcMetaJsonSchema = zodToJsonSchema(zCalcMeta, {
  target: 'openApi3',
});

export const createCalcResponseJsonSchema = <T extends z.ZodTypeAny>(
  resultSchema: T
) => {
  const responseSchema = zCalcResponse(resultSchema);
  return zodToJsonSchema(responseSchema, {
    target: 'openApi3',
  });
};
