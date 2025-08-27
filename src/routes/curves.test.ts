import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../index';

describe('Curves Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/curves/fit', () => {
    it('should fit quadratic curve to valid data', async () => {
      const requestData = {
        points: [
          { q: 10, h: 94.5 },
          { q: 20, h: 88.0 },
          { q: 30, h: 80.5 },
          { q: 40, h: 72.0 },
          { q: 50, h: 62.5 }
        ],
        model: 'quadratic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.model).toBe('quadratic');
      expect(result.coefficients).toHaveLength(3);
      expect(result.rSquared).toBeGreaterThan(0.95);
      expect(result.residuals).toHaveLength(5);
      expect(result.predictedValues).toHaveLength(5);
      expect(result.standardError).toBeGreaterThanOrEqual(0);
      expect(result.maxResidual).toBeGreaterThanOrEqual(0);
      expect(result.meanResidual).toBeGreaterThanOrEqual(0);
      expect(result.equation).toMatch(/^h = [\d.-]+[\s+]?[\d.-]*q[\s+]?[\d.-]*q²$/);
      expect(result.metadata.input.points).toHaveLength(5);
      expect(result.metadata.input.model).toBe('quadratic');
      expect(result.metadata.statistics.nPoints).toBe(5);
      expect(result.metadata.statistics.degreesOfFreedom).toBe(2);
      expect(result.metadata.statistics.adjustedRSquared).toBeGreaterThan(0.9);
    });

    it('should fit cubic curve to valid data', async () => {
      const requestData = {
        points: [
          { q: 10, h: 94.4 },
          { q: 20, h: 87.8 },
          { q: 30, h: 80.1 },
          { q: 40, h: 71.2 },
          { q: 50, h: 61.1 },
          { q: 60, h: 49.8 }
        ],
        model: 'cubic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.model).toBe('cubic');
      expect(result.coefficients).toHaveLength(4);
      expect(result.rSquared).toBeGreaterThan(0.95);
      expect(result.residuals).toHaveLength(6);
      expect(result.predictedValues).toHaveLength(6);
      expect(result.standardError).toBeGreaterThanOrEqual(0);
      expect(result.maxResidual).toBeGreaterThanOrEqual(0);
      expect(result.meanResidual).toBeGreaterThanOrEqual(0);
      expect(result.equation).toMatch(/^h = [\d.-]+[\s+]?[\d.-]*q[\s+]?[\d.-]*q²[\s+]?[\d.-]*q³$/);
      expect(result.metadata.input.points).toHaveLength(6);
      expect(result.metadata.input.model).toBe('cubic');
      expect(result.metadata.statistics.nPoints).toBe(6);
      expect(result.metadata.statistics.degreesOfFreedom).toBe(2);
      expect(result.metadata.statistics.adjustedRSquared).toBeGreaterThan(0.9);
    });

    it('should handle perfect quadratic data', async () => {
      const requestData = {
        points: [
          { q: 10, h: 81.0 },
          { q: 20, h: 64.0 },
          { q: 30, h: 49.0 },
          { q: 40, h: 36.0 },
          { q: 50, h: 25.0 }
        ],
        model: 'quadratic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.rSquared).toBeCloseTo(1.0, 10);
      expect(result.residuals.every((r: number) => Math.abs(r) < 1e-10)).toBe(true);
      expect(result.standardError).toBeCloseTo(0, 10);
      expect(result.maxResidual).toBeCloseTo(0, 10);
      expect(result.meanResidual).toBeCloseTo(0, 10);
    });

    it('should handle perfect cubic data', async () => {
      const requestData = {
        points: [
          { q: 10, h: 80.9 },
          { q: 20, h: 63.6 },
          { q: 30, h: 48.1 },
          { q: 40, h: 34.4 },
          { q: 50, h: 22.5 },
          { q: 60, h: 12.4 }
        ],
        model: 'cubic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.rSquared).toBeCloseTo(1.0, 10);
      expect(result.residuals.every((r: number) => Math.abs(r) < 1e-10)).toBe(true);
      expect(result.standardError).toBeCloseTo(0, 10);
      expect(result.maxResidual).toBeCloseTo(0, 10);
      expect(result.meanResidual).toBeCloseTo(0, 10);
    });

    it('should return 400 for insufficient points (quadratic)', async () => {
      const requestData = {
        points: [
          { q: 10, h: 90 },
          { q: 20, h: 80 }
        ],
        model: 'quadratic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('At least 3 points are required for quadratic fitting');
    });

    it('should return 400 for insufficient points (cubic)', async () => {
      const requestData = {
        points: [
          { q: 10, h: 90 },
          { q: 20, h: 80 },
          { q: 30, h: 70 }
        ],
        model: 'cubic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('At least 4 points are required for cubic fitting');
    });

    it('should return 400 for duplicate flow rates', async () => {
      const requestData = {
        points: [
          { q: 10, h: 90 },
          { q: 20, h: 80 },
          { q: 10, h: 85 } // Duplicate q value
        ],
        model: 'quadratic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Duplicate flow rate values are not allowed');
    });

    it('should return 400 for negative flow rates', async () => {
      const requestData = {
        points: [
          { q: -10, h: 90 },
          { q: 20, h: 80 },
          { q: 30, h: 70 }
        ],
        model: 'quadratic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for negative head values', async () => {
      const requestData = {
        points: [
          { q: 10, h: -90 },
          { q: 20, h: 80 },
          { q: 30, h: 70 }
        ],
        model: 'quadratic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid model', async () => {
      const requestData = {
        points: [
          { q: 10, h: 90 },
          { q: 20, h: 80 },
          { q: 30, h: 70 }
        ],
        model: 'linear' // Invalid model
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for empty points array', async () => {
      const requestData = {
        points: [],
        model: 'quadratic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle unsorted points correctly', async () => {
      const requestData = {
        points: [
          { q: 50, h: 62.5 },
          { q: 10, h: 94.5 },
          { q: 30, h: 80.5 },
          { q: 20, h: 88.0 },
          { q: 40, h: 72.0 }
        ],
        model: 'quadratic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.model).toBe('quadratic');
      expect(result.coefficients).toHaveLength(3);
      expect(result.rSquared).toBeGreaterThan(0.95);
      
      // Check that points are sorted in the metadata
      const sortedPoints = result.metadata.input.points;
      for (let i = 1; i < sortedPoints.length; i++) {
        expect(sortedPoints[i].q).toBeGreaterThan(sortedPoints[i-1].q);
      }
    });

    it('should handle large numbers', async () => {
      const requestData = {
        points: [
          { q: 1000, h: 950 },
          { q: 2000, h: 880 },
          { q: 3000, h: 805 },
          { q: 4000, h: 720 },
          { q: 5000, h: 625 }
        ],
        model: 'quadratic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.model).toBe('quadratic');
      expect(result.coefficients).toHaveLength(3);
      expect(result.rSquared).toBeGreaterThan(0.9);
      expect(result.standardError).toBeGreaterThan(0);
    });

    it('should handle small numbers', async () => {
      const requestData = {
        points: [
          { q: 0.1, h: 0.095 },
          { q: 0.2, h: 0.088 },
          { q: 0.3, h: 0.0805 },
          { q: 0.4, h: 0.072 },
          { q: 0.5, h: 0.0625 }
        ],
        model: 'quadratic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.model).toBe('quadratic');
      expect(result.coefficients).toHaveLength(3);
      expect(result.rSquared).toBeGreaterThan(0.9);
      expect(result.standardError).toBeGreaterThan(0);
    });

    it('should handle edge case with minimum points for quadratic', async () => {
      const requestData = {
        points: [
          { q: 10, h: 90 },
          { q: 20, h: 80 },
          { q: 30, h: 70 }
        ],
        model: 'quadratic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.model).toBe('quadratic');
      expect(result.coefficients).toHaveLength(3);
      expect(result.rSquared).toBeCloseTo(1.0, 10);
      expect(result.metadata.statistics.nPoints).toBe(3);
      expect(result.metadata.statistics.degreesOfFreedom).toBe(0);
    });

    it('should handle edge case with minimum points for cubic', async () => {
      const requestData = {
        points: [
          { q: 10, h: 90 },
          { q: 20, h: 80 },
          { q: 30, h: 70 },
          { q: 40, h: 60 }
        ],
        model: 'cubic'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: requestData
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.model).toBe('cubic');
      expect(result.coefficients).toHaveLength(4);
      expect(result.rSquared).toBeCloseTo(1.0, 10);
      expect(result.metadata.statistics.nPoints).toBe(4);
      expect(result.metadata.statistics.degreesOfFreedom).toBe(0);
    });
  });
});
