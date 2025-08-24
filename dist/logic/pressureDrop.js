"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePressureDrop = calculatePressureDrop;
const fluidProperties_1 = require("./fluidProperties");
function calculatePressureDrop(inputs) {
    const { flowRate, pipeDiameter, pipeLength, fluidDensity, fluidViscosity, roughness } = inputs;
    // Validate non-physical inputs
    if (pipeDiameter <= 0 || fluidDensity <= 0 || fluidViscosity <= 0 || roughness < 0 || pipeLength < 0) {
        return {
            pressureDrop: NaN,
            reynoldsNumber: NaN,
            frictionFactor: NaN,
        };
    }
    // Handle zero flow rate
    if (flowRate === 0) {
        return {
            pressureDrop: 0,
            reynoldsNumber: 0,
            frictionFactor: 0,
        };
    }
    // Calculate cross-sectional area of the pipe
    const area = Math.PI * Math.pow(pipeDiameter / 2, 2);
    // Calculate fluid velocity
    const velocity = flowRate / area;
    // Calculate Reynolds Number using utility function
    const { reynoldsNumber } = (0, fluidProperties_1.calculateReynoldsNumber)({
        fluidDensity,
        velocity,
        pipeDiameter,
        fluidViscosity,
    });
    // Calculate friction factor using utility function (Churchill equation)
    const { frictionFactor } = (0, fluidProperties_1.calculateFrictionFactor)({
        reynoldsNumber,
        roughness,
        pipeDiameter,
    });
    // Calculate pressure drop using Darcy-Weisbach equation
    let pressureDrop = frictionFactor * (pipeLength / pipeDiameter) * (fluidDensity * Math.pow(velocity, 2) / 2);
    // If pipe length is zero, pressure drop is zero, but other values are calculated normally
    if (pipeLength === 0) {
        pressureDrop = 0;
    }
    return {
        pressureDrop: Math.abs(pressureDrop), // Return absolute value for pressure drop
        reynoldsNumber,
        frictionFactor,
    };
}
