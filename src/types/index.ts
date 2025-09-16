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
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
};