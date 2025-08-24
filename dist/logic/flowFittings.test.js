"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const flowFittings_1 = require("./flowFittings");
(0, vitest_1.describe)('calculateFittingPressureDrop', () => {
    (0, vitest_1.it)('should calculate pressure drop correctly with valid inputs', () => {
        const inputs = {
            kFactor: 1.5,
            fluidDensity: 1000, // kg/m^3
            velocity: 2, // m/s
        };
        const result = (0, flowFittings_1.calculateFittingPressureDrop)(inputs);
        // Delta P = K * (rho * v^2) / 2
        // Delta P = 1.5 * (1000 * 2^2) / 2
        // Delta P = 1.5 * (1000 * 4) / 2
        // Delta P = 1.5 * 4000 / 2
        // Delta P = 1.5 * 2000 = 3000
        (0, vitest_1.expect)(result.pressureDrop).toBe(3000);
    });
    (0, vitest_1.it)('should handle zero kFactor', () => {
        const inputs = {
            kFactor: 0,
            fluidDensity: 1000,
            velocity: 2,
        };
        const result = (0, flowFittings_1.calculateFittingPressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBe(0);
    });
    (0, vitest_1.it)('should handle zero velocity', () => {
        const inputs = {
            kFactor: 1.5,
            fluidDensity: 1000,
            velocity: 0,
        };
        const result = (0, flowFittings_1.calculateFittingPressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBe(0);
    });
    (0, vitest_1.it)('should handle zero fluid density', () => {
        const inputs = {
            kFactor: 1.5,
            fluidDensity: 0,
            velocity: 2,
        };
        const result = (0, flowFittings_1.calculateFittingPressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBe(0);
    });
    (0, vitest_1.it)('should handle negative kFactor', () => {
        const inputs = {
            kFactor: -1.5,
            fluidDensity: 1000,
            velocity: 2,
        };
        const result = (0, flowFittings_1.calculateFittingPressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBeNaN();
    });
    (0, vitest_1.it)('should handle negative fluid density', () => {
        const inputs = {
            kFactor: 1.5,
            fluidDensity: -1000,
            velocity: 2,
        };
        const result = (0, flowFittings_1.calculateFittingPressureDrop)(inputs);
        (0, vitest_1.expect)(result.pressureDrop).toBe(0);
    });
    (0, vitest_1.it)('should handle negative velocity', () => {
        const inputs = {
            kFactor: 1.5,
            fluidDensity: 1000,
            velocity: -2,
        };
        const result = (0, flowFittings_1.calculateFittingPressureDrop)(inputs);
        // Velocity squared will make it positive, so pressure drop should be positive
        (0, vitest_1.expect)(result.pressureDrop).toBe(3000);
    });
});
