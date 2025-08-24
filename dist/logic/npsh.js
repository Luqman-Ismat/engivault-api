"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateNpsh = calculateNpsh;
exports.calculateNpshr = calculateNpshr;
function calculateNpsh(inputs) {
    const { atmosphericPressure, vaporPressure, fluidDensity, staticHead, frictionLosses, velocityHead, flowRate, pipeDiameter } = inputs;
    const g = 9.81; // Acceleration due to gravity in m/s^2
    let actualVelocityHead = velocityHead;
    // If velocityHead is not provided, try to calculate it from flowRate and pipeDiameter
    if (actualVelocityHead === undefined && flowRate !== undefined && pipeDiameter !== undefined) {
        const area = Math.PI * Math.pow(pipeDiameter / 2, 2);
        const velocity = flowRate / area;
        actualVelocityHead = Math.pow(velocity, 2) / (2 * g);
    }
    else if (actualVelocityHead === undefined) {
        // If velocityHead is still undefined, assume 0 if not provided and cannot be calculated
        actualVelocityHead = 0;
    }
    // Convert friction losses from Pascals to meters of head
    const frictionLossesHead = frictionLosses / (fluidDensity * g);
    // Calculate NPSHa
    // NPSHa = (P_atm / (rho * g)) - (P_v / (rho * g)) + H_st - H_f - H_v
    const atmosphericPressureHead = atmosphericPressure / (fluidDensity * g);
    const vaporPressureHead = vaporPressure / (fluidDensity * g);
    const npsha = atmosphericPressureHead - vaporPressureHead + staticHead - frictionLossesHead - actualVelocityHead;
    return {
        npsha,
    };
}
/**
 * Calculates the Net Positive Suction Head Required (NPSHr) by interpolating a pump's NPSHr curve.
 * @param flowRate The flow rate at which to determine NPSHr.
 * @param npshrCurve An array of flow/NPSHr data points from the pump manufacturer.
 * @returns The NPSHr value at the given flow rate.
 */
function calculateNpshr(flowRate, npshrCurve) {
    if (npshrCurve.length < 2) {
        throw new Error("NPSHr curve must have at least two points.");
    }
    // Sort NPSHr curve by flow to ensure proper interpolation
    npshrCurve.sort((a, b) => a.flow - b.flow);
    // Check if flowRate is outside the curve range
    if (flowRate < npshrCurve[0].flow || flowRate > npshrCurve[npshrCurve.length - 1].flow) {
        throw new Error("Flow rate is outside the provided NPSHr curve range.");
    }
    // Find the two points for interpolation
    let p1;
    let p2;
    for (let i = 0; i < npshrCurve.length - 1; i++) {
        if (flowRate >= npshrCurve[i].flow && flowRate <= npshrCurve[i + 1].flow) {
            p1 = npshrCurve[i];
            p2 = npshrCurve[i + 1];
            break;
        }
    }
    if (!p1 || !p2) {
        // This case should ideally not be reached due to the range check above
        throw new Error("Could not find interpolation points for the given flow rate.");
    }
    // Perform linear interpolation
    // y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
    // NPSHr = NPSHr1 + (flowRate - flow1) * (NPSHr2 - NPSHr1) / (flow2 - flow1)
    const npshr = p1.npshr + (flowRate - p1.flow) * (p2.npshr - p1.npshr) / (p2.flow - p1.flow);
    return {
        npshr,
    };
}
