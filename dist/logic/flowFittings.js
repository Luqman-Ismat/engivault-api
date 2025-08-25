"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFittingPressureDrop = calculateFittingPressureDrop;
function calculateFittingPressureDrop(inputs) {
    const { kFactor, fluidDensity, velocity } = inputs;
    // Handle zero fluid density
    if (fluidDensity <= 0) {
        return {
            pressureDrop: 0,
        };
    }
    // Validate other inputs
    if (kFactor < 0) {
        return {
            pressureDrop: NaN,
        };
    }
    // Calculate pressure drop using K-factor formula
    // Delta P = K * (rho * v^2) / 2
    const pressureDrop = (kFactor * (fluidDensity * Math.pow(Math.abs(velocity), 2))) / 2;
    return {
        pressureDrop,
    };
}
//# sourceMappingURL=flowFittings.js.map