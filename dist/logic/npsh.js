"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateNpsh = calculateNpsh;
exports.calculateNpshr = calculateNpshr;
function calculateNpsh(inputs) {
    const { atmosphericPressure, vaporPressure, fluidDensity, staticHead, frictionLosses, velocityHead, flowRate, pipeDiameter, } = inputs;
    const g = 9.81; // Acceleration due to gravity in m/s^2
    // Calculate velocity head if not provided
    let actualVelocityHead = velocityHead;
    if (actualVelocityHead === undefined &&
        flowRate !== undefined &&
        pipeDiameter !== undefined) {
        const velocity = (4 * flowRate) / (Math.PI * Math.pow(pipeDiameter, 2));
        actualVelocityHead = Math.pow(velocity, 2) / (2 * g);
    }
    // Convert pressures to head (meters)
    const atmosphericPressureHead = atmosphericPressure / (fluidDensity * g);
    const vaporPressureHead = vaporPressure / (fluidDensity * g);
    const frictionLossesHead = frictionLosses / (fluidDensity * g);
    // Calculate NPSHa
    const npsha = atmosphericPressureHead -
        vaporPressureHead +
        staticHead -
        frictionLossesHead -
        (actualVelocityHead || 0);
    return { npsha };
}
function calculateNpshr(flowRate, npshrCurve) {
    if (npshrCurve.length < 2) {
        throw new Error('NPSHr curve must have at least two points.');
    }
    // Sort curve by flow rate
    const sortedCurve = [...npshrCurve].sort((a, b) => a.flow - b.flow);
    // Check if flow rate is within the curve range
    if (flowRate < sortedCurve[0].flow ||
        flowRate > sortedCurve[sortedCurve.length - 1].flow) {
        throw new Error('Flow rate is outside the provided NPSHr curve range.');
    }
    // Find the two points for linear interpolation
    let p1;
    let p2;
    for (let i = 0; i < sortedCurve.length - 1; i++) {
        if (flowRate >= sortedCurve[i].flow &&
            flowRate <= sortedCurve[i + 1].flow) {
            p1 = sortedCurve[i];
            p2 = sortedCurve[i + 1];
            break;
        }
    }
    if (!p1 || !p2) {
        throw new Error('Could not find interpolation points for the given flow rate.');
    }
    // Linear interpolation
    const npshr = p1.npshr +
        ((flowRate - p1.flow) * (p2.npshr - p1.npshr)) / (p2.flow - p1.flow);
    return { npshr };
}
//# sourceMappingURL=npsh.js.map