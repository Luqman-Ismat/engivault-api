"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateReynoldsNumber = calculateReynoldsNumber;
exports.calculateFrictionFactor = calculateFrictionFactor;
/**
 * Calculates the Reynolds number.
 * @param inputs Fluid density, velocity, pipe diameter, and fluid viscosity.
 * @returns The calculated Reynolds number.
 */
function calculateReynoldsNumber(inputs) {
    const { fluidDensity, velocity, pipeDiameter, fluidViscosity } = inputs;
    if (fluidViscosity <= 0 || pipeDiameter <= 0) {
        return { reynoldsNumber: Infinity }; // Or NaN, depending on desired behavior for non-physical inputs
    }
    const reynoldsNumber = (fluidDensity * velocity * pipeDiameter) / fluidViscosity;
    return { reynoldsNumber };
}
/**
 * Calculates the Darcy friction factor using the Churchill equation.
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
        return calculateFrictionFactor({ reynoldsNumber: Math.abs(reynoldsNumber), roughness, pipeDiameter });
    }
    const relativeRoughness = roughness / pipeDiameter;
    // Churchill Equation components
    const term1 = Math.pow(8 / reynoldsNumber, 12);
    const termA = Math.pow(2.457 * Math.log(Math.pow(7 / reynoldsNumber, 0.9) + 0.27 * relativeRoughness), 16);
    const termB = Math.pow(37530 / reynoldsNumber, 16);
    const frictionFactor = 8 * Math.pow(term1 + Math.pow(termA + termB, -1.5), 1 / 12);
    return { frictionFactor };
}
