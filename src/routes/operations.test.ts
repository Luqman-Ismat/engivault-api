import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../index';

describe('Operations Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/operations/fill-drain-time', () => {
    it('should calculate fill time for cylindrical tank', async () => {
      const requestBody = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 5, unit: 'm' }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.totalTime.value).toBeGreaterThan(0);
      expect(result.totalTime.unit).toBe('s');
      expect(result.averageFlowRate.value).toBeCloseTo(0.1, 2);
      expect(result.averageFlowRate.unit).toBe('m³/s');
      expect(result.volumeChange.value).toBeGreaterThan(0);
      expect(result.volumeChange.unit).toBe('m³');
      expect(result.timeHistory.length).toBeGreaterThan(0);
      expect(result.warnings).toBeDefined();
      expect(result.metadata.input).toEqual(requestBody);
      expect(result.metadata.calculations.method).toBe('Constant flow rate');
      expect(result.metadata.calculations.convergence).toBe(true);
    });

    it('should calculate drain time for rectangular tank', async () => {
      const requestBody = {
        tank: {
          volume: { value: 200, unit: 'm³' },
          height: { value: 4, unit: 'm' },
          shape: 'rectangular'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.05, unit: 'm³/s' }
        },
        operation: 'drain',
        initialLevel: { value: 4, unit: 'm' },
        targetLevel: { value: 1, unit: 'm' }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.totalTime.value).toBeGreaterThan(0);
      expect(result.totalTime.unit).toBe('s');
      expect(result.averageFlowRate.value).toBeCloseTo(0.05, 2);
      expect(result.averageFlowRate.unit).toBe('m³/s');
      expect(result.volumeChange.value).toBeGreaterThan(0);
      expect(result.volumeChange.unit).toBe('m³');
      expect(result.timeHistory.length).toBeGreaterThan(0);
      expect(result.warnings).toBeDefined();
      expect(result.metadata.input).toEqual(requestBody);
      expect(result.metadata.calculations.method).toBe('Constant flow rate');
      expect(result.metadata.calculations.convergence).toBe(true);
    });

    it('should handle variable flow rate', async () => {
      const requestBody = {
        tank: {
          volume: { value: 50, unit: 'm³' },
          height: { value: 2, unit: 'm' },
          shape: 'rectangular'
        },
        flowRate: {
          type: 'variable',
          function: 'Q(t) = 0.1 * (1 - t/3600)'
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 1, unit: 'm' }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.totalTime.value).toBeGreaterThan(0);
      expect(result.totalTime.unit).toBe('s');
      expect(result.averageFlowRate.value).toBeGreaterThan(0);
      expect(result.averageFlowRate.unit).toBe('m³/s');
      expect(result.volumeChange.value).toBeGreaterThan(0);
      expect(result.volumeChange.unit).toBe('m³');
      expect(result.timeHistory.length).toBeGreaterThan(0);
      expect(result.metadata.calculations.method).toBe('Variable flow rate');
    });

    it('should handle custom tank shape', async () => {
      const requestBody = {
        tank: {
          volume: { value: 75, unit: 'm³' },
          height: { value: 3, unit: 'm' },
          shape: 'custom'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.075, unit: 'm³/s' }
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 2, unit: 'm' }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.totalTime.value).toBeGreaterThan(0);
      expect(result.totalTime.unit).toBe('s');
      expect(result.averageFlowRate.value).toBeCloseTo(0.075, 2);
      expect(result.averageFlowRate.unit).toBe('m³/s');
      expect(result.volumeChange.value).toBeGreaterThan(0);
      expect(result.volumeChange.unit).toBe('m³');
      expect(result.timeHistory.length).toBeGreaterThan(0);
      expect(result.metadata.calculations.method).toBe('Constant flow rate');
    });

    it('should handle different units', async () => {
      const requestBody = {
        tank: {
          volume: { value: 1000, unit: 'gal' },
          diameter: { value: 10, unit: 'ft' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 100, unit: 'gal/min' }
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'ft' },
        targetLevel: { value: 5, unit: 'ft' },
        timeStep: { value: 30, unit: 's' }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.totalTime.value).toBeGreaterThan(0);
      expect(result.totalTime.unit).toBe('s');
      expect(result.averageFlowRate.value).toBeGreaterThan(0);
      expect(result.averageFlowRate.unit).toBe('m³/s');
      expect(result.volumeChange.value).toBeGreaterThan(0);
      expect(result.volumeChange.unit).toBe('m³');
      expect(result.timeHistory.length).toBeGreaterThan(0);
    });

    it('should return 400 for missing diameter in cylindrical tank', async () => {
      const requestBody = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Diameter is required for cylindrical tanks');
    });

    it('should return 400 for missing height in rectangular tank', async () => {
      const requestBody = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          shape: 'rectangular'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Height is required for rectangular and custom tanks');
    });

    it('should return 400 for missing flow rate value in constant flow', async () => {
      const requestBody = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant'
        },
        operation: 'fill'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Constant flow rate must be positive');
    });

    it('should return 400 for missing function in variable flow', async () => {
      const requestBody = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'variable'
        },
        operation: 'fill'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Variable flow rate requires a function');
    });

    it('should return 400 for negative tank volume', async () => {
      const requestBody = {
        tank: {
          volume: { value: -100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for negative flow rate', async () => {
      const requestBody = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: -0.1, unit: 'm³/s' }
        },
        operation: 'fill'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid operation type', async () => {
      const requestBody = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'invalid' // Invalid operation
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid tank shape', async () => {
      const requestBody = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'invalid' // Invalid shape
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill'
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        tank: {
          volume: { value: 100, unit: 'm³' }
          // Missing shape and diameter
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        }
        // Missing operation
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle overflow scenario with warnings', async () => {
      const requestBody = {
        tank: {
          volume: { value: 10, unit: 'm³' },
          diameter: { value: 2, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 1, unit: 'm³/s' }
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 10, unit: 'm' } // Would overflow
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.warnings.length).toBeGreaterThan(0);
      const overflowWarnings = result.warnings.filter((w: any) => w.type === 'tank_capacity');
      expect(overflowWarnings.length).toBeGreaterThan(0);
    });

    it('should handle underflow scenario with warnings', async () => {
      const requestBody = {
        tank: {
          volume: { value: 10, unit: 'm³' },
          diameter: { value: 2, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 1, unit: 'm³/s' }
        },
        operation: 'drain',
        initialLevel: { value: 1, unit: 'm' },
        targetLevel: { value: 0, unit: 'm' }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.warnings.length).toBeGreaterThan(0);
      const underflowWarnings = result.warnings.filter((w: any) => w.type === 'tank_capacity');
      expect(underflowWarnings.length).toBeGreaterThan(0);
    });

    it('should handle very small flow rate with warnings', async () => {
      const requestBody = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 1e-12, unit: 'm³/s' } // Very small flow
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 1, unit: 'm' }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.warnings.length).toBeGreaterThan(0);
      const flowWarnings = result.warnings.filter((w: any) => w.type === 'flow_rate');
      expect(flowWarnings.length).toBeGreaterThan(0);
    });

    it('should handle time limit exceeded with warnings', async () => {
      const requestBody = {
        tank: {
          volume: { value: 1000, unit: 'm³' },
          diameter: { value: 10, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 1e-6, unit: 'm³/s' } // Very slow flow
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 5, unit: 'm' }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.warnings.length).toBeGreaterThan(0);
      const timeWarnings = result.warnings.filter((w: any) => w.type === 'time_limit');
      expect(timeWarnings.length).toBeGreaterThan(0);
    });

    it('should record time history correctly', async () => {
      const requestBody = {
        tank: {
          volume: { value: 100, unit: 'm³' },
          diameter: { value: 5, unit: 'm' },
          shape: 'cylindrical'
        },
        flowRate: {
          type: 'constant',
          value: { value: 0.1, unit: 'm³/s' }
        },
        operation: 'fill',
        initialLevel: { value: 0, unit: 'm' },
        targetLevel: { value: 5, unit: 'm' }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/fill-drain-time',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.timeHistory.length).toBeGreaterThan(0);

      // Check that time history is ordered
      for (let i = 1; i < result.timeHistory.length; i++) {
        expect(result.timeHistory[i].time).toBeGreaterThan(result.timeHistory[i-1].time);
        expect(result.timeHistory[i].level).toBeGreaterThanOrEqual(result.timeHistory[i-1].level);
        expect(result.timeHistory[i].volume).toBeGreaterThanOrEqual(result.timeHistory[i-1].volume);
        expect(result.timeHistory[i].flowRate).toBeGreaterThan(0);
      }

      // Check final values match target
      const finalEntry = result.timeHistory[result.timeHistory.length - 1];
      expect(finalEntry.time).toBeLessThanOrEqual(result.totalTime.value);
      expect(finalEntry.level).toBeCloseTo(5, 0); // target level
    });
  });
});
