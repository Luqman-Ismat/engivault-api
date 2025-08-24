"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const pressureDrop_1 = require("./pressureDrop");
(0, vitest_1.describe)('calculatePressureDrop', () => {
    (0, vitest_1.it)('should calculate pressure drop for laminar flow', () => {
        const inputs = {
            flowRate: 0.00001, // m^3/s
            pipeDiameter: 0.01, // m
            pipeLength: 1, // m
            fluidDensity: 1000, // kg/m^3
            fluidViscosity: 0.1, // Pa.s (high viscosity for laminar flow)
            roughness: 0.000001, // m
        };
        const result = (0, pressureDrop_1.calculatePressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBeCloseTo(4074.3665);
        (0, vitest_1.expect)(result.reynoldsNumber).toBeCloseTo(12.732395);
        (0, vitest_1.expect)(result.frictionFactor).toBeCloseTo(5.0265);
    });
    (0, vitest_1.it)('should calculate pressure drop for turbulent flow', () => {
        const inputs = {
            flowRate: 0.01, // m^3/s
            pipeDiameter: 0.1, // m
            pipeLength: 100, // m
            fluidDensity: 1000, // kg/m^3
            fluidViscosity: 0.001, // Pa.s
            roughness: 0.0001, // m
        };
        const result = (0, pressureDrop_1.calculatePressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBeCloseTo(17731.12);
        (0, vitest_1.expect)(result.reynoldsNumber).toBeCloseTo(127323.95);
        (0, vitest_1.expect)(result.frictionFactor).toBeCloseTo(0.0218); // Updated for Churchill equation
    });
    (0, vitest_1.it)('should handle zero flow rate', () => {
        const inputs = {
            flowRate: 0, // m^3/s
            pipeDiameter: 0.1, // m
            pipeLength: 100, // m
            fluidDensity: 1000, // kg/m^3
            fluidViscosity: 0.001, // Pa.s
            roughness: 0.0001, // m
        };
        const result = (0, pressureDrop_1.calculatePressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBe(0);
        (0, vitest_1.expect)(result.reynoldsNumber).toBe(0);
        (0, vitest_1.expect)(result.frictionFactor).toBe(0);
    });
    (0, vitest_1.it)('should handle zero pipe length', () => {
        const inputs = {
            flowRate: 0.01,
            pipeDiameter: 0.1,
            pipeLength: 0, // Zero length
            fluidDensity: 1000,
            fluidViscosity: 0.001,
            roughness: 0.0001,
        };
        const result = (0, pressureDrop_1.calculatePressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBe(0);
        (0, vitest_1.expect)(result.reynoldsNumber).toBeCloseTo(127323.95);
        (0, vitest_1.expect)(result.frictionFactor).toBeCloseTo(0.02535);
    });
    (0, vitest_1.it)('should handle zero fluid density', () => {
        const inputs = {
            flowRate: 0.01,
            pipeDiameter: 0.1,
            pipeLength: 100,
            fluidDensity: 0, // Zero density
            fluidViscosity: 0.001,
            roughness: 0.0001,
        };
        const result = (0, pressureDrop_1.calculatePressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBeNaN();
        (0, vitest_1.expect)(result.reynoldsNumber).toBeNaN();
        (0, vitest_1.expect)(result.frictionFactor).toBeNaN();
    });
    (0, vitest_1.it)('should handle zero pipe diameter (expect NaN)', () => {
        const inputs = {
            flowRate: 0.01,
            pipeDiameter: 0, // Zero diameter
            pipeLength: 100,
            fluidDensity: 1000,
            fluidViscosity: 0.001,
            roughness: 0.0001,
        };
        const result = (0, pressureDrop_1.calculatePressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBeNaN();
        (0, vitest_1.expect)(result.reynoldsNumber).toBeNaN();
        (0, vitest_1.expect)(result.frictionFactor).toBeNaN();
    });
    (0, vitest_1.it)('should handle zero fluid viscosity (expect NaN)', () => {
        const inputs = {
            flowRate: 0.01,
            pipeDiameter: 0.1,
            pipeLength: 100,
            fluidDensity: 1000,
            fluidViscosity: 0, // Zero viscosity
            roughness: 0.0001,
        };
        const result = (0, pressureDrop_1.calculatePressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBeNaN();
        (0, vitest_1.expect)(result.reynoldsNumber).toBeNaN();
        (0, vitest_1.expect)(result.frictionFactor).toBeNaN();
    });
    (0, vitest_1.it)('should handle negative flow rate', () => {
        const inputs = {
            flowRate: -0.01,
            pipeDiameter: 0.1,
            pipeLength: 100,
            fluidDensity: 1000,
            fluidViscosity: 0.001,
            roughness: 0.0001,
        };
        const result = (0, pressureDrop_1.calculatePressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBeCloseTo(17731.12);
        (0, vitest_1.expect)(result.reynoldsNumber).toBeCloseTo(-127323.95);
        (0, vitest_1.expect)(result.frictionFactor).toBeCloseTo(0.0218);
    });
    (0, vitest_1.it)('should handle negative pipe length', () => {
        const inputs = {
            flowRate: 0.01,
            pipeDiameter: 0.1,
            pipeLength: -100,
            fluidDensity: 1000,
            fluidViscosity: 0.001,
            roughness: 0.0001,
        };
        const result = (0, pressureDrop_1.calculatePressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBeNaN();
        (0, vitest_1.expect)(result.reynoldsNumber).toBeNaN();
        (0, vitest_1.expect)(result.frictionFactor).toBeNaN();
    });
    (0, vitest_1.it)('should handle negative fluid density', () => {
        const inputs = {
            flowRate: 0.01,
            pipeDiameter: 0.1,
            pipeLength: 100,
            fluidDensity: -1000,
            fluidViscosity: 0.001,
            roughness: 0.0001,
        };
        const result = (0, pressureDrop_1.calculatePressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBeNaN();
        (0, vitest_1.expect)(result.reynoldsNumber).toBeNaN();
        (0, vitest_1.expect)(result.frictionFactor).toBeNaN();
    });
    (0, vitest_1.it)('should handle negative roughness', () => {
        const inputs = {
            flowRate: 0.01,
            pipeDiameter: 0.1,
            pipeLength: 100,
            fluidDensity: 1000,
            fluidViscosity: 0.001,
            roughness: -0.0001,
        };
        const result = (0, pressureDrop_1.calculatePressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBeNaN();
        (0, vitest_1.expect)(result.reynoldsNumber).toBeNaN();
        (0, vitest_1.expect)(result.frictionFactor).toBeNaN();
    });
});
