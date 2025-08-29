"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateOperatingPoint = calculateOperatingPoint;
/**
 * Calculates the operating point of a pump by finding the intersection of the pump curve and system curve.
 * @param pumpCurve An array of flow/head data points for the pump.
 * @param systemCurveEquation A function that takes flow as input and returns the system head.
 * @returns The operating point (flow and head) where the pump curve and system curve intersect.
 */
function calculateOperatingPoint(pumpCurve, systemCurveEquation) {
    if (pumpCurve.length < 2) {
        throw new Error('Pump curve must have at least two points.');
    }
    // Sort pump curve by flow to ensure proper interpolation
    pumpCurve.sort((a, b) => a.flow - b.flow);
    let prevPoint = null;
    for (const currentPoint of pumpCurve) {
        if (prevPoint) {
            const prevPumpHead = prevPoint.head;
            const prevSystemHead = systemCurveEquation(prevPoint.flow);
            const currentPumpHead = currentPoint.head;
            const currentSystemHead = systemCurveEquation(currentPoint.flow);
            // Check if the intersection occurs between prevPoint and currentPoint
            // This happens if (PumpHead - SystemHead) changes sign
            const prevDiff = prevPumpHead - prevSystemHead;
            const currentDiff = currentPumpHead - currentSystemHead;
            if (prevDiff * currentDiff <= 0) {
                // Intersection found or very close to a point
                // Interpolate to find the exact intersection point
                // Using linear interpolation: (y - y1) / (x - x1) = (y2 - y1) / (x2 - x1)
                // Here, y is the difference (PumpHead - SystemHead), and x is the flow
                // We want to find x when y = 0
                const flow = prevPoint.flow -
                    (prevDiff * (currentPoint.flow - prevPoint.flow)) /
                        (currentDiff - prevDiff);
                // Calculate head at the intersection flow using either pump curve interpolation or system curve equation
                // Using system curve equation as it's a continuous function
                const head = systemCurveEquation(flow);
                return { flow, head };
            }
        }
        prevPoint = currentPoint;
    }
    // If no intersection found within the given pump curve range, return the last point or throw an error
    // For now, let's throw an error indicating no intersection found within the range
    throw new Error('No intersection found within the provided pump curve range.');
}
