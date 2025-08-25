import { describe, it, expect } from 'vitest';
import { calculateOperatingPoint, PumpCurvePoint } from './pumpSystemCurve';

describe('calculateOperatingPoint', () => {
  it('should calculate the correct operating point for a typical scenario', () => {
    const pumpCurve: PumpCurvePoint[] = [
      { flow: 0, head: 50 },
      { flow: 10, head: 45 },
      { flow: 20, head: 30 },
      { flow: 30, head: 10 },
    ];
    const systemCurveEquation = (flow: number) => 10 + 0.05 * Math.pow(flow, 2);

    const operatingPoint = calculateOperatingPoint(
      pumpCurve,
      systemCurveEquation
    );

    // Expected intersection: flow ~20, head ~30
    expect(operatingPoint.flow).toBeCloseTo(20);
    expect(operatingPoint.head).toBeCloseTo(30);
  });

  it('should throw an error if pump curve has less than two points', () => {
    const pumpCurve: PumpCurvePoint[] = [{ flow: 0, head: 50 }];
    const systemCurveEquation = (flow: number) => 10 + 0.05 * Math.pow(flow, 2);

    expect(() =>
      calculateOperatingPoint(pumpCurve, systemCurveEquation)
    ).toThrow('Pump curve must have at least two points.');
  });

  it('should throw an error if no intersection is found within the range', () => {
    const pumpCurve: PumpCurvePoint[] = [
      { flow: 0, head: 10 },
      { flow: 10, head: 5 },
    ];
    const systemCurveEquation = (flow: number) => 50 + 0.05 * Math.pow(flow, 2); // System curve always above pump curve

    expect(() =>
      calculateOperatingPoint(pumpCurve, systemCurveEquation)
    ).toThrow('No intersection found within the provided pump curve range.');
  });

  it('should handle a pump curve that is always above the system curve', () => {
    const pumpCurve: PumpCurvePoint[] = [
      { flow: 0, head: 100 },
      { flow: 10, head: 90 },
      { flow: 20, head: 80 },
    ];
    const systemCurveEquation = (flow: number) => 10 + 0.05 * Math.pow(flow, 2);

    expect(() =>
      calculateOperatingPoint(pumpCurve, systemCurveEquation)
    ).toThrow('No intersection found within the provided pump curve range.');
  });

  it('should handle a pump curve that is always below the system curve', () => {
    const pumpCurve: PumpCurvePoint[] = [
      { flow: 0, head: 10 },
      { flow: 10, head: 5 },
      { flow: 20, head: 2 },
    ];
    const systemCurveEquation = (flow: number) => 50 + 0.05 * Math.pow(flow, 2);

    expect(() =>
      calculateOperatingPoint(pumpCurve, systemCurveEquation)
    ).toThrow('No intersection found within the provided pump curve range.');
  });

  it('should handle a system curve with zero resistance', () => {
    const pumpCurve: PumpCurvePoint[] = [
      { flow: 0, head: 50 },
      { flow: 10, head: 45 },
      { flow: 20, head: 30 },
      { flow: 30, head: 10 },
    ];
    const systemCurveEquation = () => 20; // Constant head system curve

    const operatingPoint = calculateOperatingPoint(
      pumpCurve,
      systemCurveEquation
    );

    // Expected intersection: between flow 20 and 30, head 20
    // Pump head at flow 20 is 30, at flow 30 is 10. Linear interpolation:
    // (20 - 30) / (flow - 20) = (10 - 30) / (30 - 20)
    // -10 / (flow - 20) = -20 / 10 = -2
    // -10 = -2 * (flow - 20)
    // 5 = flow - 20
    // flow = 25
    expect(operatingPoint.flow).toBeCloseTo(25);
    expect(operatingPoint.head).toBeCloseTo(20);
  });
});
