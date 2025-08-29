"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateReynoldsNumber = calculateReynoldsNumber;
exports.calculateFrictionFactor = calculateFrictionFactor;
const cache_1 = require("../utils/cache");
/**
 * Calculates the Reynolds number with caching for performance.
 * @param inputs Fluid density, velocity, pipe diameter, and fluid viscosity.
 * @returns The calculated Reynolds number.
 */
function calculateReynoldsNumber(inputs) {
    const { fluidDensity, velocity, pipeDiameter, fluidViscosity } = inputs;
    if (fluidViscosity <= 0 || pipeDiameter <= 0) {
        return { reynoldsNumber: Infinity };
    }
    // Create cache key for this calculation
    const cacheKey = (0, cache_1.createCacheKey)('reynolds', {
        fluidDensity,
        velocity,
        pipeDiameter,
        fluidViscosity,
    });
    // Check cache first
    const cached = cache_1.calculationCache.get(cacheKey);
    if (cached !== null) {
        return { reynoldsNumber: cached };
    }
    const reynoldsNumber = (fluidDensity * velocity * pipeDiameter) / fluidViscosity;
    // Cache the result
    cache_1.calculationCache.set(cacheKey, reynoldsNumber);
    return { reynoldsNumber };
}
/**
 * Calculates the Darcy friction factor using the Churchill equation with caching.
 * Valid for laminar, transition, and turbulent flow.
 * @param inputs Reynolds number, roughness, and pipe diameter.
 * @returns The calculated Darcy friction factor.
 */
function calculateFrictionFactor(inputs) {
    const { reynoldsNumber, roughness, pipeDiameter } = inputs;
    if (pipeDiameter <= 0) {
        return { frictionFactor: NaN };
    }
    if (reynoldsNumber === 0) {
        return { frictionFactor: 0 }; // No friction for zero flow
    }
    if (reynoldsNumber < 0) {
        // Friction factor is typically for positive Reynolds number. Use absolute value.
        return calculateFrictionFactor({
            reynoldsNumber: Math.abs(reynoldsNumber),
            roughness,
            pipeDiameter,
        });
    }
    // Create cache key for this calculation
    const cacheKey = (0, cache_1.createCacheKey)('friction', {
        reynoldsNumber,
        roughness,
        pipeDiameter,
    });
    // Check cache first
    const cached = cache_1.calculationCache.get(cacheKey);
    if (cached !== null) {
        return { frictionFactor: cached };
    }
    const relativeRoughness = roughness / pipeDiameter;
    // Churchill Equation components
    const term1 = Math.pow(8 / reynoldsNumber, 12);
    const termA = Math.pow(2.457 *
        Math.log(Math.pow(7 / reynoldsNumber, 0.9) + 0.27 * relativeRoughness), 16);
    const termB = Math.pow(37530 / reynoldsNumber, 16);
    const frictionFactor = 8 * Math.pow(term1 + Math.pow(termA + termB, -1.5), 1 / 12);
    // Cache the result
    cache_1.calculationCache.set(cacheKey, frictionFactor);
    return { frictionFactor };
}
