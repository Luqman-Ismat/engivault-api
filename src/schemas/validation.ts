import { z } from 'zod';

// Pressure Drop Schemas
export const pressureDropSchema = z.object({
  flowRate: z.number(),
  pipeDiameter: z.number().positive(),
  pipeLength: z.number().nonnegative(),
  fluidDensity: z.number().positive(),
  fluidViscosity: z.number().positive(),
  roughness: z.number().nonnegative(),
});

// NPSH Schemas
export const npshSchema = z
  .object({
    atmosphericPressure: z.number().positive(),
    vaporPressure: z.number().positive(),
    fluidDensity: z.number().positive(),
    staticHead: z.number(),
    frictionLosses: z.number().nonnegative(),
    velocityHead: z.number().nonnegative().optional(),
    flowRate: z.number().nonnegative().optional(),
    pipeDiameter: z.number().positive().optional(),
  })
  .refine(
    data => {
      // Custom validation: if velocityHead is not provided, flowRate and pipeDiameter must be provided
      if (data.velocityHead === undefined) {
        return data.flowRate !== undefined && data.pipeDiameter !== undefined;
      }
      return true;
    },
    {
      message:
        'If velocityHead is not provided, flowRate and pipeDiameter must be provided.',
      path: ['velocityHead', 'flowRate', 'pipeDiameter'],
    }
  );

// Flow Fittings Schemas
export const flowFittingsSchema = z.object({
  kFactor: z.number().nonnegative(),
  fluidDensity: z.number().positive(),
  velocity: z.number(),
});

// Pump System Curve Schemas
export const pumpCurvePointSchema = z.object({
  flow: z.number(),
  head: z.number(),
});

export const pumpSystemCurveSchema = z.object({
  pumpCurve: z
    .array(pumpCurvePointSchema)
    .min(2, 'Pump curve must have at least two points.'),
  systemCurve: z.object({
    staticHead: z.number(),
    resistanceCoefficient: z.number().nonnegative(),
  }),
});

// NPSH Required Schemas
export const npshrCurvePointSchema = z.object({
  flow: z.number(),
  npshr: z.number(),
});

export const npshrSchema = z.object({
  flowRate: z.number(),
  npshrCurve: z
    .array(npshrCurvePointSchema)
    .min(2, 'NPSHr curve must have at least two points.'),
});

// Type exports
export type PressureDropInput = z.infer<typeof pressureDropSchema>;
export type NpshInput = z.infer<typeof npshSchema>;
export type FlowFittingsInput = z.infer<typeof flowFittingsSchema>;
export type PumpSystemCurveInput = z.infer<typeof pumpSystemCurveSchema>;
export type NpshrInput = z.infer<typeof npshrSchema>;
export type PumpCurvePoint = z.infer<typeof pumpCurvePointSchema>;
export type NpshrCurvePoint = z.infer<typeof npshrCurvePointSchema>;
