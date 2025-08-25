import { z } from 'zod';

// Engineering quantity with value and unit
export const EngineeringQuantitySchema = z.object({
  value: z.number(),
  unit: z.string(),
});

export type EngineeringQuantity = z.infer<typeof EngineeringQuantitySchema>;

// Warning with code, message, and optional context
export const WarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  context: z.object({}).passthrough().optional(),
});

export type Warning = z.infer<typeof WarningSchema>;

// Calculation metadata
export const CalcMetaSchema = z.object({
  iterations: z.number().optional(),
  residual: z.number().optional(),
  runtimeMs: z.number().optional(),
});

export type CalcMeta = z.infer<typeof CalcMetaSchema>;

// Generic calculation response
export const CalcResponseSchema = <T extends z.ZodTypeAny>(resultSchema: T) =>
  z.object({
    input: z.unknown(),
    result: resultSchema,
    warnings: z.array(WarningSchema).optional(),
    meta: CalcMetaSchema.optional(),
  });

export type CalcResponse<T> = {
  input: unknown;
  result: T;
  warnings?: Warning[];
  meta?: CalcMeta;
};
