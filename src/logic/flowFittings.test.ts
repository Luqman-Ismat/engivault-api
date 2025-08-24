import { describe, it, expect } from 'vitest';
import { calculateFittingPressureDrop } from './flowFittings';

describe('calculateFittingPressureDrop', () => {
  it('should calculate pressure drop correctly with valid inputs', () => {
    const inputs = {
      kFactor: 1.5,
      fluidDensity: 1000, // kg/m^3
      velocity: 2, // m/s
    };
    const result = calculateFittingPressureDrop(inputs);
    // Delta P = K * (rho * v^2) / 2
    // Delta P = 1.5 * (1000 * 2^2) / 2
    // Delta P = 1.5 * (1000 * 4) / 2
    // Delta P = 1.5 * 4000 / 2
    // Delta P = 1.5 * 2000 = 3000
    expect(result.pressureDrop).toBe(3000);
  });

  it('should handle zero kFactor', () => {
    const inputs = {
      kFactor: 0,
      fluidDensity: 1000,
      velocity: 2,
    };
    const result = calculateFittingPressureDrop(inputs);
    expect(result.pressureDrop).toBe(0);
  });

  it('should handle zero velocity', () => {
    const inputs = {
      kFactor: 1.5,
      fluidDensity: 1000,
      velocity: 0,
    };
    const result = calculateFittingPressureDrop(inputs);
    expect(result.pressureDrop).toBe(0);
  });

  it('should handle zero fluid density', () => {
    const inputs = {
      kFactor: 1.5,
      fluidDensity: 0,
      velocity: 2,
    };
    const result = calculateFittingPressureDrop(inputs);
    expect(result.pressureDrop).toBe(0);
  });

  it('should handle negative kFactor', () => {
    const inputs = {
      kFactor: -1.5,
      fluidDensity: 1000,
      velocity: 2,
    };
    const result = calculateFittingPressureDrop(inputs);
    expect(result.pressureDrop).toBeNaN();
  });

  it('should handle negative fluid density', () => {
    const inputs = {
      kFactor: 1.5,
      fluidDensity: -1000,
      velocity: 2,
    };
    const result = calculateFittingPressureDrop(inputs);
    expect(result.pressureDrop).toBe(0);
  });

  it('should handle negative velocity', () => {
    const inputs = {
      kFactor: 1.5,
      fluidDensity: 1000,
      velocity: -2,
    };
    const result = calculateFittingPressureDrop(inputs);
    // Velocity squared will make it positive, so pressure drop should be positive
    expect(result.pressureDrop).toBe(3000);
  });
});
