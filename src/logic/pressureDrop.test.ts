import { describe, it, expect } from 'vitest';
import { calculatePressureDrop } from './pressureDrop';

describe('calculatePressureDrop', () => {
  it('should calculate pressure drop for laminar flow', () => {
    const inputs = {
      flowRate: 0.00001, // m^3/s
      pipeDiameter: 0.01, // m
      pipeLength: 1, // m
      fluidDensity: 1000, // kg/m^3
      fluidViscosity: 0.1, // Pa.s (high viscosity for laminar flow)
      roughness: 0.000001, // m
    };
    const result = calculatePressureDrop(inputs);
    expect(result.pressureDrop).toBeCloseTo(4074.3665);
    expect(result.reynoldsNumber).toBeCloseTo(12.732395);
    expect(result.frictionFactor).toBeCloseTo(5.0265);
  });

  it('should calculate pressure drop for turbulent flow', () => {
    const inputs = {
      flowRate: 0.01, // m^3/s
      pipeDiameter: 0.1, // m
      pipeLength: 100, // m
      fluidDensity: 1000, // kg/m^3
      fluidViscosity: 0.001, // Pa.s
      roughness: 0.0001, // m
    };
    const result = calculatePressureDrop(inputs);
    expect(result.pressureDrop).toBeCloseTo(17731.12);
    expect(result.reynoldsNumber).toBeCloseTo(127323.95);
    expect(result.frictionFactor).toBeCloseTo(0.0218); // Updated for Churchill equation
  });

  it('should handle zero flow rate', () => {
    const inputs = {
      flowRate: 0, // m^3/s
      pipeDiameter: 0.1, // m
      pipeLength: 100, // m
      fluidDensity: 1000, // kg/m^3
      fluidViscosity: 0.001, // Pa.s
      roughness: 0.0001, // m
    };
    const result = calculatePressureDrop(inputs);
    expect(result.pressureDrop).toBe(0);
    expect(result.reynoldsNumber).toBe(0);
    expect(result.frictionFactor).toBe(0);
  });

  it('should handle zero pipe length', () => {
    const inputs = {
      flowRate: 0.01,
      pipeDiameter: 0.1,
      pipeLength: 0, // Zero length
      fluidDensity: 1000,
      fluidViscosity: 0.001,
      roughness: 0.0001,
    };
    const result = calculatePressureDrop(inputs);
    expect(result.pressureDrop).toBe(0);
    expect(result.reynoldsNumber).toBeCloseTo(127323.95);
    expect(result.frictionFactor).toBeCloseTo(0.02535);
  });

  it('should handle zero fluid density', () => {
    const inputs = {
      flowRate: 0.01,
      pipeDiameter: 0.1,
      pipeLength: 100,
      fluidDensity: 0, // Zero density
      fluidViscosity: 0.001,
      roughness: 0.0001,
    };
    const result = calculatePressureDrop(inputs);
    expect(result.pressureDrop).toBeNaN();
    expect(result.reynoldsNumber).toBeNaN();
    expect(result.frictionFactor).toBeNaN();
  });

  it('should handle zero pipe diameter (expect NaN)', () => {
    const inputs = {
      flowRate: 0.01,
      pipeDiameter: 0, // Zero diameter
      pipeLength: 100,
      fluidDensity: 1000,
      fluidViscosity: 0.001,
      roughness: 0.0001,
    };
    const result = calculatePressureDrop(inputs);
    expect(result.pressureDrop).toBeNaN();
    expect(result.reynoldsNumber).toBeNaN();
    expect(result.frictionFactor).toBeNaN();
  });

  it('should handle zero fluid viscosity (expect NaN)', () => {
    const inputs = {
      flowRate: 0.01,
      pipeDiameter: 0.1,
      pipeLength: 100,
      fluidDensity: 1000,
      fluidViscosity: 0, // Zero viscosity
      roughness: 0.0001,
    };
    const result = calculatePressureDrop(inputs);
    expect(result.pressureDrop).toBeNaN();
    expect(result.reynoldsNumber).toBeNaN();
    expect(result.frictionFactor).toBeNaN();
  });

  it('should handle negative flow rate', () => {
    const inputs = {
      flowRate: -0.01,
      pipeDiameter: 0.1,
      pipeLength: 100,
      fluidDensity: 1000,
      fluidViscosity: 0.001,
      roughness: 0.0001,
    };
    const result = calculatePressureDrop(inputs);
    expect(result.pressureDrop).toBeCloseTo(17731.12);
    expect(result.reynoldsNumber).toBeCloseTo(-127323.95);
    expect(result.frictionFactor).toBeCloseTo(0.0218);
  });

  it('should handle negative pipe length', () => {
    const inputs = {
      flowRate: 0.01,
      pipeDiameter: 0.1,
      pipeLength: -100,
      fluidDensity: 1000,
      fluidViscosity: 0.001,
      roughness: 0.0001,
    };
    const result = calculatePressureDrop(inputs);
    expect(result.pressureDrop).toBeNaN();
    expect(result.reynoldsNumber).toBeNaN();
    expect(result.frictionFactor).toBeNaN();
  });

  it('should handle negative fluid density', () => {
    const inputs = {
      flowRate: 0.01,
      pipeDiameter: 0.1,
      pipeLength: 100,
      fluidDensity: -1000,
      fluidViscosity: 0.001,
      roughness: 0.0001,
    };
    const result = calculatePressureDrop(inputs);
    expect(result.pressureDrop).toBeNaN();
    expect(result.reynoldsNumber).toBeNaN();
    expect(result.frictionFactor).toBeNaN();
  });

  it('should handle negative roughness', () => {
    const inputs = {
      flowRate: 0.01,
      pipeDiameter: 0.1,
      pipeLength: 100,
      fluidDensity: 1000,
      fluidViscosity: 0.001,
      roughness: -0.0001,
    };
    const result = calculatePressureDrop(inputs);
    expect(result.pressureDrop).toBeNaN();
    expect(result.reynoldsNumber).toBeNaN();
    expect(result.frictionFactor).toBeNaN();
  });
});