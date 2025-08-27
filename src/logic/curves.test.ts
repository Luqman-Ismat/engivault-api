import { describe, it, expect } from 'vitest';
import { fitPumpCurve, predictHead, predictHeadWithConfidence, CurvePoint } from './curves';

describe('Curve Fitting', () => {
  describe('fitPumpCurve', () => {
    it('should fit quadratic curve to synthetic data', () => {
      // Synthetic data: h = 100 - 0.5*q - 0.01*q² + noise
      const points: CurvePoint[] = [
        { q: 10, h: 94.5 },
        { q: 20, h: 88.0 },
        { q: 30, h: 80.5 },
        { q: 40, h: 72.0 },
        { q: 50, h: 62.5 },
        { q: 60, h: 52.0 },
        { q: 70, h: 40.5 },
        { q: 80, h: 28.0 }
      ];

      const result = fitPumpCurve(points, 'quadratic');

      expect(result.model).toBe('quadratic');
      expect(result.coefficients).toHaveLength(3);
      expect(result.rSquared).toBeGreaterThan(0.95); // Should fit well
      expect(result.residuals).toHaveLength(points.length);
      expect(result.predictedValues).toHaveLength(points.length);
      expect(result.standardError).toBeGreaterThan(0);
      expect(result.maxResidual).toBeGreaterThan(0);
      expect(result.meanResidual).toBeGreaterThan(0);
      expect(result.equation).toMatch(/^h = [\d.-]+[\s+]?[\d.-]*q[\s+]?[\d.-]*q²$/);

      // Check that coefficients are reasonable
      expect(result.coefficients[0]).toBeCloseTo(100, 0); // Intercept around 100
      expect(result.coefficients[1]).toBeCloseTo(-0.5, 0); // Linear term around -0.5
      expect(result.coefficients[2]).toBeCloseTo(-0.01, 1); // Quadratic term around -0.01
    });

    it('should fit cubic curve to synthetic data', () => {
      // Synthetic data: h = 100 - 0.5*q - 0.01*q² - 0.0001*q³ + noise
      const points: CurvePoint[] = [
        { q: 10, h: 94.4 },
        { q: 20, h: 87.8 },
        { q: 30, h: 80.1 },
        { q: 40, h: 71.2 },
        { q: 50, h: 61.1 },
        { q: 60, h: 49.8 },
        { q: 70, h: 37.3 },
        { q: 80, h: 23.6 }
      ];

      const result = fitPumpCurve(points, 'cubic');

      expect(result.model).toBe('cubic');
      expect(result.coefficients).toHaveLength(4);
      expect(result.rSquared).toBeGreaterThan(0.95); // Should fit well
      expect(result.residuals).toHaveLength(points.length);
      expect(result.predictedValues).toHaveLength(points.length);
      expect(result.standardError).toBeGreaterThan(0);
      expect(result.maxResidual).toBeGreaterThan(0);
      expect(result.meanResidual).toBeGreaterThan(0);
      expect(result.equation).toMatch(/^h = [\d.-]+[\s+]?[\d.-]*q[\s+]?[\d.-]*q²[\s+]?[\d.-]*q³$/);

      // Check that coefficients are reasonable
      expect(result.coefficients[0]).toBeCloseTo(100, 0); // Intercept around 100
      expect(result.coefficients[1]).toBeCloseTo(-0.5, 0); // Linear term around -0.5
      expect(result.coefficients[2]).toBeCloseTo(-0.01, 1); // Quadratic term around -0.01
      expect(result.coefficients[3]).toBeCloseTo(-0.0001, 3); // Cubic term around -0.0001
    });

    it('should handle perfect quadratic data', () => {
      // Perfect quadratic: h = 100 - 2*q + 0.01*q²
      const points: CurvePoint[] = [
        { q: 10, h: 81.0 },
        { q: 20, h: 64.0 },
        { q: 30, h: 49.0 },
        { q: 40, h: 36.0 },
        { q: 50, h: 25.0 }
      ];

      const result = fitPumpCurve(points, 'quadratic');

      expect(result.rSquared).toBeCloseTo(1.0, 10); // Perfect fit
      expect(result.residuals.every(r => Math.abs(r) < 1e-10)).toBe(true);
      expect(result.standardError).toBeCloseTo(0, 10);
      expect(result.maxResidual).toBeCloseTo(0, 10);
      expect(result.meanResidual).toBeCloseTo(0, 10);
    });

    it('should handle perfect cubic data', () => {
      // Perfect cubic: h = 100 - 2*q + 0.01*q² - 0.0001*q³
      const points: CurvePoint[] = [
        { q: 10, h: 80.9 },
        { q: 20, h: 63.6 },
        { q: 30, h: 48.1 },
        { q: 40, h: 34.4 },
        { q: 50, h: 22.5 },
        { q: 60, h: 12.4 }
      ];

      const result = fitPumpCurve(points, 'cubic');

      expect(result.rSquared).toBeCloseTo(1.0, 10); // Perfect fit
      expect(result.residuals.every(r => Math.abs(r) < 1e-10)).toBe(true);
      expect(result.standardError).toBeCloseTo(0, 10);
      expect(result.maxResidual).toBeCloseTo(0, 10);
      expect(result.meanResidual).toBeCloseTo(0, 10);
    });

    it('should handle noisy data', () => {
      // Noisy data with some random variation
      const points: CurvePoint[] = [
        { q: 10, h: 95.2 },
        { q: 20, h: 87.8 },
        { q: 30, h: 79.9 },
        { q: 40, h: 71.5 },
        { q: 50, h: 62.8 },
        { q: 60, h: 53.1 },
        { q: 70, h: 42.3 },
        { q: 80, h: 30.7 }
      ];

      const result = fitPumpCurve(points, 'quadratic');

      expect(result.rSquared).toBeGreaterThan(0.9); // Should still fit reasonably well
      expect(result.standardError).toBeGreaterThan(0);
      expect(result.maxResidual).toBeGreaterThan(0);
      expect(result.meanResidual).toBeGreaterThan(0);
    });

    it('should throw error for insufficient points (quadratic)', () => {
      const points: CurvePoint[] = [
        { q: 10, h: 90 },
        { q: 20, h: 80 }
      ];

      expect(() => fitPumpCurve(points, 'quadratic')).toThrow('At least 3 points are required for quadratic fitting');
    });

    it('should throw error for insufficient points (cubic)', () => {
      const points: CurvePoint[] = [
        { q: 10, h: 90 },
        { q: 20, h: 80 },
        { q: 30, h: 70 }
      ];

      expect(() => fitPumpCurve(points, 'cubic')).toThrow('At least 4 points are required for cubic fitting');
    });

    it('should handle edge case with minimum points', () => {
      const points: CurvePoint[] = [
        { q: 10, h: 90 },
        { q: 20, h: 80 },
        { q: 30, h: 70 }
      ];

      const result = fitPumpCurve(points, 'quadratic');

      expect(result.model).toBe('quadratic');
      expect(result.coefficients).toHaveLength(3);
      expect(result.rSquared).toBeCloseTo(1.0, 10); // Perfect fit with 3 points
    });

    it('should handle edge case with minimum points for cubic', () => {
      const points: CurvePoint[] = [
        { q: 10, h: 90 },
        { q: 20, h: 80 },
        { q: 30, h: 70 },
        { q: 40, h: 60 }
      ];

      const result = fitPumpCurve(points, 'cubic');

      expect(result.model).toBe('cubic');
      expect(result.coefficients).toHaveLength(4);
      expect(result.rSquared).toBeCloseTo(1.0, 10); // Perfect fit with 4 points
    });

    it('should handle large numbers', () => {
      // Test with larger flow rates and head values
      const points: CurvePoint[] = [
        { q: 1000, h: 950 },
        { q: 2000, h: 880 },
        { q: 3000, h: 805 },
        { q: 4000, h: 720 },
        { q: 5000, h: 625 }
      ];

      const result = fitPumpCurve(points, 'quadratic');

      expect(result.model).toBe('quadratic');
      expect(result.coefficients).toHaveLength(3);
      expect(result.rSquared).toBeGreaterThan(0.9);
      expect(result.standardError).toBeGreaterThan(0);
    });

    it('should handle small numbers', () => {
      // Test with very small flow rates and head values
      const points: CurvePoint[] = [
        { q: 0.1, h: 0.095 },
        { q: 0.2, h: 0.088 },
        { q: 0.3, h: 0.0805 },
        { q: 0.4, h: 0.072 },
        { q: 0.5, h: 0.0625 }
      ];

      const result = fitPumpCurve(points, 'quadratic');

      expect(result.model).toBe('quadratic');
      expect(result.coefficients).toHaveLength(3);
      expect(result.rSquared).toBeGreaterThan(0.9);
      expect(result.standardError).toBeGreaterThan(0);
    });
  });

  describe('predictHead', () => {
    it('should predict head values correctly', () => {
      const coefficients = [100, -0.5, -0.01]; // h = 100 - 0.5*q - 0.01*q²
      
      expect(predictHead(coefficients, 0)).toBe(100);
      expect(predictHead(coefficients, 10)).toBeCloseTo(94.0, 1);
      expect(predictHead(coefficients, 20)).toBeCloseTo(86.0, 1);
      expect(predictHead(coefficients, 50)).toBeCloseTo(50.0, 1); // 100 - 0.5*50 - 0.01*50² = 100 - 25 - 25 = 50
    });

    it('should handle cubic coefficients', () => {
      const coefficients = [100, -0.5, -0.01, -0.0001]; // h = 100 - 0.5*q - 0.01*q² - 0.0001*q³
      
      expect(predictHead(coefficients, 0)).toBe(100);
      expect(predictHead(coefficients, 10)).toBeCloseTo(93.9, 1);
      expect(predictHead(coefficients, 20)).toBeCloseTo(85.2, 1); // 100 - 0.5*20 - 0.01*20² - 0.0001*20³ = 100 - 10 - 4 - 0.8 = 85.2
      expect(predictHead(coefficients, 50)).toBeCloseTo(37.5, 1); // 100 - 0.5*50 - 0.01*50² - 0.0001*50³ = 100 - 25 - 25 - 12.5 = 37.5
    });
  });

  describe('predictHeadWithConfidence', () => {
    it('should calculate confidence intervals', () => {
      const coefficients = [100, -0.5, -0.01];
      const standardError = 2.0;
      
      const result = predictHeadWithConfidence(coefficients, 20, standardError, 0.95);
      
      expect(result.predicted).toBeCloseTo(86.0, 1);
      expect(result.lower).toBeLessThan(result.predicted);
      expect(result.upper).toBeGreaterThan(result.predicted);
      expect(result.upper - result.lower).toBeCloseTo(2 * 1.96 * standardError, 1);
    });

    it('should handle different confidence levels', () => {
      const coefficients = [100, -0.5, -0.01];
      const standardError = 2.0;
      
      const result95 = predictHeadWithConfidence(coefficients, 20, standardError, 0.95);
      const result90 = predictHeadWithConfidence(coefficients, 20, standardError, 0.90);
      
      expect(result90.upper - result90.lower).toBeLessThan(result95.upper - result95.lower);
    });
  });

  describe('Equation Generation', () => {
    it('should generate correct equation for quadratic', () => {
      const points: CurvePoint[] = [
        { q: 10, h: 95.0 },
        { q: 20, h: 80.0 },
        { q: 30, h: 55.0 },
        { q: 40, h: 20.0 },
        { q: 50, h: -25.0 }
      ];

      const result = fitPumpCurve(points, 'quadratic');
      
      expect(result.equation).toMatch(/^h = [\d.-]+[\s+]?[\d.-]*q?[\s+]?[\d.-]*q²$/);
      expect(result.equation).toContain('h =');
    });

    it('should generate correct equation for cubic', () => {
      const points: CurvePoint[] = [
        { q: 10, h: 90.0 },
        { q: 20, h: 60.0 },
        { q: 30, h: 10.0 },
        { q: 40, h: -60.0 },
        { q: 50, h: -150.0 },
        { q: 60, h: -270.0 }
      ];

      const result = fitPumpCurve(points, 'cubic');
      
      expect(result.equation).toMatch(/^h = [\d.-]+[\s+]?[\d.-]*q?[\s+]?[\d.-]*q²?[\s+]?[\d.-]*q³$/);
      expect(result.equation).toContain('h =');
    });

    it('should handle zero coefficients', () => {
      const points: CurvePoint[] = [
        { q: 10, h: 100 },
        { q: 20, h: 100 },
        { q: 30, h: 100 }
      ];

      const result = fitPumpCurve(points, 'quadratic');
      
      expect(result.equation).toMatch(/^h = [\d.]+$/);
      expect(result.coefficients[1]).toBeCloseTo(0, 10);
      expect(result.coefficients[2]).toBeCloseTo(0, 10);
    });
  });

  describe('Statistical Properties', () => {
    it('should calculate residuals correctly', () => {
      const points: CurvePoint[] = [
        { q: 10, h: 90 },
        { q: 20, h: 80 },
        { q: 30, h: 70 }
      ];

      const result = fitPumpCurve(points, 'quadratic');
      
      // For perfect fit, residuals should be zero
      expect(result.residuals.every(r => Math.abs(r) < 1e-10)).toBe(true);
      expect(result.maxResidual).toBeCloseTo(0, 10);
      expect(result.meanResidual).toBeCloseTo(0, 10);
    });

    it('should calculate R-squared correctly', () => {
      const points: CurvePoint[] = [
        { q: 10, h: 90 },
        { q: 20, h: 80 },
        { q: 30, h: 70 }
      ];

      const result = fitPumpCurve(points, 'quadratic');
      
      expect(result.rSquared).toBeCloseTo(1.0, 10);
      expect(result.rSquared).toBeGreaterThanOrEqual(0);
      expect(result.rSquared).toBeLessThanOrEqual(1);
    });

    it('should calculate standard error correctly', () => {
      const points: CurvePoint[] = [
        { q: 10, h: 90 },
        { q: 20, h: 80 },
        { q: 30, h: 70 }
      ];

      const result = fitPumpCurve(points, 'quadratic');
      
      expect(result.standardError).toBeCloseTo(0, 10); // Perfect fit
      expect(result.standardError).toBeGreaterThanOrEqual(0);
    });
  });
});
