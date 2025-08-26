import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../index';

describe('Pump Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/pumps/bep-check', () => {
    it('should calculate BEP distance with warnings for far operation', async () => {
      const requestBody = {
        operatingPoint: {
          q: 0.25,
          h: 30
        },
        curve: {
          points: [
            { q: 0, h: 100, efficiency: 0 },
            { q: 0.05, h: 95, efficiency: 0.6 },
            { q: 0.1, h: 85, efficiency: 0.8 },
            { q: 0.15, h: 70, efficiency: 0.75 },
            { q: 0.2, h: 50, efficiency: 0.6 },
            { q: 0.25, h: 25, efficiency: 0.4 },
            { q: 0.3, h: 0, efficiency: 0 }
          ]
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.bepPoint.q).toBe(0.1);
      expect(result.bepPoint.h).toBe(85);
      expect(result.bepPoint.efficiency).toBe(0.8);
      expect(result.method).toBe('efficiency');
      expect(result.distance).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);

      // Should have warnings for being far from BEP
      const bepWarnings = result.warnings.filter((w: any) => w.type === 'bep_distance');
      expect(bepWarnings.length).toBeGreaterThan(0);

      expect(result.metadata.input).toEqual(requestBody);
      expect(result.metadata.calculations.normalizedDistance).toBeGreaterThan(0);
      expect(result.metadata.calculations.curveRange.minFlow).toBe(0);
      expect(result.metadata.calculations.curveRange.maxFlow).toBe(0.3);
    });

    it('should calculate BEP distance with warnings for operation outside curve range', async () => {
      const requestBody = {
        operatingPoint: {
          q: 0.4,
          h: 10
        },
        curve: {
          points: [
            { q: 0, h: 100, efficiency: 0 },
            { q: 0.05, h: 95, efficiency: 0.6 },
            { q: 0.1, h: 85, efficiency: 0.8 },
            { q: 0.15, h: 70, efficiency: 0.75 },
            { q: 0.2, h: 50, efficiency: 0.6 },
            { q: 0.25, h: 25, efficiency: 0.4 },
            { q: 0.3, h: 0, efficiency: 0 }
          ]
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.warnings.length).toBeGreaterThan(0);

      // Should have warnings for being outside curve range
      const rangeWarnings = result.warnings.filter((w: any) => w.type === 'curve_range');
      expect(rangeWarnings.length).toBeGreaterThan(0);
    });

    it('should calculate BEP distance with efficiency warnings', async () => {
      const requestBody = {
        operatingPoint: {
          q: 0.05,
          h: 95
        },
        curve: {
          points: [
            { q: 0, h: 100, efficiency: 0 },
            { q: 0.05, h: 95, efficiency: 0.6 },
            { q: 0.1, h: 85, efficiency: 0.8 },
            { q: 0.15, h: 70, efficiency: 0.75 },
            { q: 0.2, h: 50, efficiency: 0.6 },
            { q: 0.25, h: 25, efficiency: 0.4 },
            { q: 0.3, h: 0, efficiency: 0 }
          ]
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.warnings.length).toBeGreaterThan(0);

      // Should have efficiency warnings for low efficiency operation
      const efficiencyWarnings = result.warnings.filter((w: any) => w.type === 'efficiency');
      expect(efficiencyWarnings.length).toBeGreaterThan(0);
    });

    it('should handle operation close to BEP with minimal warnings', async () => {
      const requestBody = {
        operatingPoint: {
          q: 0.11,
          h: 83
        },
        curve: {
          points: [
            { q: 0, h: 100, efficiency: 0 },
            { q: 0.05, h: 95, efficiency: 0.6 },
            { q: 0.1, h: 85, efficiency: 0.8 },
            { q: 0.15, h: 70, efficiency: 0.75 },
            { q: 0.2, h: 50, efficiency: 0.6 },
            { q: 0.25, h: 25, efficiency: 0.4 },
            { q: 0.3, h: 0, efficiency: 0 }
          ]
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.bepPoint.q).toBe(0.1);
      expect(result.bepPoint.h).toBe(85);
      expect(result.distance).toBeGreaterThan(0);

      // Should have fewer warnings for operation close to BEP
      const bepWarnings = result.warnings.filter((w: any) => w.type === 'bep_distance');
      expect(bepWarnings.length).toBeLessThanOrEqual(1);
    });

    it('should handle curve without efficiency data', async () => {
      const requestBody = {
        operatingPoint: {
          q: 0.12,
          h: 75
        },
        curve: {
          points: [
            { q: 0, h: 100 },
            { q: 0.05, h: 95 },
            { q: 0.1, h: 85 },
            { q: 0.15, h: 70 },
            { q: 0.2, h: 50 },
            { q: 0.25, h: 25 },
            { q: 0.3, h: 0 }
          ]
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.method).toBe('midpoint');
      expect(result.bepIndex).toBe(3); // Middle point
      expect(result.distance).toBeGreaterThan(0);
      expect(result.warnings).toBeDefined();
    });

    it('should return 400 for invalid operating point', async () => {
      const requestBody = {
        operatingPoint: {
          q: -0.1, // Negative flow rate
          h: 30
        },
        curve: {
          points: [
            { q: 0, h: 100, efficiency: 0 },
            { q: 0.1, h: 85, efficiency: 0.8 },
            { q: 0.2, h: 50, efficiency: 0.6 }
          ]
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid curve data', async () => {
      const requestBody = {
        operatingPoint: {
          q: 0.1,
          h: 30
        },
        curve: {
          points: [
            { q: 0, h: -100, efficiency: 0 }, // Negative head
            { q: 0.1, h: 85, efficiency: 1.5 }, // Efficiency > 1
            { q: 0.2, h: 50, efficiency: 0.6 }
          ]
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for empty curve', async () => {
      const requestBody = {
        operatingPoint: {
          q: 0.1,
          h: 30
        },
        curve: {
          points: []
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        operatingPoint: {
          q: 0.1
          // Missing h
        },
        curve: {
          points: [
            { q: 0, h: 100, efficiency: 0 },
            { q: 0.1, h: 85, efficiency: 0.8 }
          ]
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: requestBody
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle curve with metadata', async () => {
      const requestBody = {
        operatingPoint: {
          q: 0.15,
          h: 70
        },
        curve: {
          points: [
            { q: 0, h: 100, efficiency: 0 },
            { q: 0.05, h: 95, efficiency: 0.6 },
            { q: 0.1, h: 85, efficiency: 0.8 },
            { q: 0.15, h: 70, efficiency: 0.75 },
            { q: 0.2, h: 50, efficiency: 0.6 },
            { q: 0.25, h: 25, efficiency: 0.4 },
            { q: 0.3, h: 0, efficiency: 0 }
          ],
          name: 'Test Pump',
          units: {
            flow: 'm³/s',
            head: 'm',
            efficiency: 'decimal'
          }
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: requestBody
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.bepPoint.q).toBe(0.1);
      expect(result.bepPoint.h).toBe(85);
      expect(result.bepPoint.efficiency).toBe(0.8);
      expect(result.method).toBe('efficiency');
      expect(result.distance).toBeGreaterThan(0);
      expect(result.warnings).toBeDefined();
      expect(result.metadata.input).toEqual(requestBody);
    });
  });
});
