import { z } from 'zod';

// User schemas
export const UserRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().optional(),
});

export const UserLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const ApiKeyCreateSchema = z.object({
  keyName: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
});

// Calculation schemas
export const PressureDropSchema = z.object({
  flowRate: z.number().positive(),
  pipeDiameter: z.number().positive(),
  pipeLength: z.number().positive(),
  fluidDensity: z.number().positive(),
  fluidViscosity: z.number().positive(),
  pipeRoughness: z.number().positive().optional(),
});

export const PumpPerformanceSchema = z.object({
  flowRate: z.number().positive(),
  head: z.number().positive(),
  efficiency: z.number().min(0).max(1),
  power: z.number().positive(),
});

export const NPSHSchema = z.object({
  suctionPressure: z.number(),
  vaporPressure: z.number(),
  fluidDensity: z.number().positive(),
  suctionVelocity: z.number().positive(),
  suctionLosses: z.number().positive(),
});

// Equipment Sizing Schemas
export const PumpSizingSchema = z.object({
  flowRate: z.number().positive(),
  head: z.number().positive(),
  fluidDensity: z.number().positive(),
  fluidViscosity: z.number().positive(),
  npshAvailable: z.number().positive(),
  efficiencyTarget: z.number().min(0).max(1).optional(),
  pumpType: z.enum(['centrifugal', 'positive_displacement', 'specialty']).optional(),
  operatingHours: z.number().positive().optional(),
  designTemperature: z.number().optional(),
  designPressure: z.number().positive().optional(),
});

export const HeatExchangerSizingSchema = z.object({
  heatDuty: z.number().positive(),
  hotFluidInlet: z.number().positive(),
  hotFluidOutlet: z.number().positive(),
  coldFluidInlet: z.number().positive(),
  coldFluidOutlet: z.number().positive(),
  hotFlowRate: z.number().positive(),
  coldFlowRate: z.number().positive(),
  designPressure: z.number().positive(),
  designTemperature: z.number().positive(),
  hotFluidProperties: z.object({
    density: z.number().positive(),
    viscosity: z.number().positive(),
    thermalConductivity: z.number().positive(),
    specificHeat: z.number().positive(),
  }),
  coldFluidProperties: z.object({
    density: z.number().positive(),
    viscosity: z.number().positive(),
    thermalConductivity: z.number().positive(),
    specificHeat: z.number().positive(),
  }),
  exchangerType: z.enum(['shell_tube', 'plate', 'air_cooled', 'compact']).optional(),
  flowArrangement: z.enum(['counterflow', 'parallel', 'crossflow']).optional(),
});

export const VesselSizingSchema = z.object({
  volume: z.number().positive(),
  designPressure: z.number().positive(),
  designTemperature: z.number().positive(),
  material: z.string().optional(),
  vesselType: z.enum(['storage_tank', 'pressure_vessel', 'separator', 'reactor']),
  diameter: z.number().positive().optional(),
  length: z.number().positive().optional(),
  height: z.number().positive().optional(),
  operatingConditions: z.object({
    pressure: z.number().positive(),
    temperature: z.number().positive(),
    fluidDensity: z.number().positive(),
  }),
  standards: z.array(z.string()).optional(),
});

export const PipingSizingSchema = z.object({
  flowRate: z.number().positive(),
  fluidDensity: z.number().positive(),
  fluidViscosity: z.number().positive(),
  pressureDrop: z.number().positive().optional(),
  velocityLimit: z.number().positive().optional(),
  pipeMaterial: z.string().optional(),
  pipeSchedule: z.string().optional(),
  designPressure: z.number().positive().optional(),
  designTemperature: z.number().positive().optional(),
  pipeLength: z.number().positive().optional(),
  fittings: z.array(z.object({
    type: z.string(),
    quantity: z.number().positive(),
    equivalentLength: z.number().positive(),
  })).optional(),
});

// Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});

// Type exports
export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type ApiKeyCreate = z.infer<typeof ApiKeyCreateSchema>;
export type PressureDropInput = z.infer<typeof PressureDropSchema>;
export type PumpPerformanceInput = z.infer<typeof PumpPerformanceSchema>;
export type NPSHInput = z.infer<typeof NPSHSchema>;

// Equipment Sizing Types
export type PumpSizingInput = z.infer<typeof PumpSizingSchema>;
export type HeatExchangerSizingInput = z.infer<typeof HeatExchangerSizingSchema>;
export type VesselSizingInput = z.infer<typeof VesselSizingSchema>;
export type PipingSizingInput = z.infer<typeof PipingSizingSchema>;

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
};