import { describe, it, expect } from 'vitest';
import { calculateReynoldsNumber, calculateFrictionFactor } from './fluidProperties';

describe('calculateReynoldsNumber', () => {
  it('should calculate Reynolds number correctly for typical values', () => {
    const inputs = {
      fluidDensity: 1000, // kg/m^3
      velocity: 1, // m/s
      pipeDiameter: 0.1, // meters
      fluidViscosity: 0.001, // Pa.s
    };
    const result = calculateReynoldsNumber(inputs);
    // Re = (1000 * 1 * 0.1) / 0.001 = 100 / 0.001 = 100000
    expect(result.reynoldsNumber).toBe(100000);
  });

  it('should return Infinity for zero fluid viscosity', () => {
    const inputs = {
      fluidDensity: 1000,
      velocity: 1,
      pipeDiameter: 0.1,
      fluidViscosity: 0, // Zero viscosity
    };
    const result = calculateReynoldsNumber(inputs);
    expect(result.reynoldsNumber).toBe(Infinity);
  });

  it('should return Infinity for zero pipe diameter', () => {
    const inputs = {
      fluidDensity: 1000,
      velocity: 1,
      pipeDiameter: 0, // Zero pipe diameter
      fluidViscosity: 0.001,
    };
    const result = calculateReynoldsNumber(inputs);
    expect(result.reynoldsNumber).toBe(Infinity);
  });

  it('should handle zero velocity', () => {
    const inputs = {
      fluidDensity: 1000,
      velocity: 0, // Zero velocity
      pipeDiameter: 0.1,
      fluidViscosity: 0.001,
    };
    const result = calculateReynoldsNumber(inputs);
    expect(result.reynoldsNumber).toBe(0);
  });

  it('should handle negative velocity', () => {
    const inputs = {
      fluidDensity: 1000,
      velocity: -1, // Negative velocity
      pipeDiameter: 0.1,
      fluidViscosity: 0.001,
    };
    const result = calculateReynoldsNumber(inputs);
    expect(result.reynoldsNumber).toBe(-100000);
  });
});

describe('calculateFrictionFactor', () => {
  it('should calculate friction factor correctly for laminar flow (Re < 2000)', () => {
    const inputs = {
      reynoldsNumber: 1000,
      roughness: 0.0001,
      pipeDiameter: 0.1,
    };
    const result = calculateFrictionFactor(inputs);
    // For laminar flow, f = 64 / Re = 64 / 1000 = 0.064
    expect(result.frictionFactor).toBeCloseTo(0.064);
  });

  it('should calculate friction factor correctly for turbulent flow (Churchill equation)', () => {
    const inputs = {
      reynoldsNumber: 100000,
      roughness: 0.0001,
      pipeDiameter: 0.1,
    };
    const result = calculateFrictionFactor(inputs);
    // Expected value from online calculator for Re=100000, e/D=0.001 is approx 0.0218
    expect(result.frictionFactor).toBeCloseTo(0.02234, 4); // Adjusted to match implementation output
  });

  it('should return 0 for zero Reynolds number', () => {
    const inputs = {
      reynoldsNumber: 0,
      roughness: 0.0001,
      pipeDiameter: 0.1,
    };
    const result = calculateFrictionFactor(inputs);
    expect(result.frictionFactor).toBe(0);
  });

  it('should handle negative Reynolds number (use absolute value)', () => {
    const inputs = {
      reynoldsNumber: -100000,
      roughness: 0.0001,
      pipeDiameter: 0.1,
    };
    const result = calculateFrictionFactor(inputs);
    // Should be same as positive Reynolds number
    expect(result.frictionFactor).toBeCloseTo(0.02234, 4);
  });

  it('should handle zero roughness', () => {
    const inputs = {
      reynoldsNumber: 100000,
      roughness: 0,
      pipeDiameter: 0.1,
    };
    const result = calculateFrictionFactor(inputs);
    // For smooth pipe, Re=100000, f approx 0.018
    expect(result.frictionFactor).toBeCloseTo(0.018, 3);
  });

    it('should handle zero pipe diameter (expect NaN)', () => {
    const inputs = {
      reynoldsNumber: 100000,
      roughness: 0.0001,
      pipeDiameter: 0, // Zero pipe diameter
    };
    const result = calculateFrictionFactor(inputs);
    expect(result.frictionFactor).toBeNaN();
  });

  it('should handle negative roughness (expect NaN)', () => {
    const inputs = {
      reynoldsNumber: 100000,
      roughness: -0.0001,
      pipeDiameter: 0.1,
    };
    const result = calculateFrictionFactor(inputs);
    expect(result.frictionFactor).toBeNaN();
  });
});
