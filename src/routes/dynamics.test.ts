import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../index';

describe('Dynamics Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/dynamics/tank-level', () => {
    it('should simulate tank with constant inflow and orifice outflow', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/dynamics/tank-level',
        payload: {
          tank: {
            area: { value: 10, unit: 'm²' },
            initialLevel: { value: 1, unit: 'm' },
            maxLevel: { value: 5, unit: 'm' },
            minLevel: { value: 0, unit: 'm' }
          },
          inflow: {
            type: 'constant',
            value: { value: 0.1, unit: 'm³/s' }
          },
          outflow: {
            type: 'orifice',
            orifice: {
              coefficient: 0.6,
              area: { value: 0.01, unit: 'm²' }
            }
          },
          simulation: {
            endTime: { value: 100, unit: 's' },
            timeStep: { value: 1, unit: 's' }
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.timeSeries).toBeDefined();
      expect(result.timeSeries).toHaveLength(101); // 0 to 100 seconds
      expect(result.summary).toBeDefined();
      expect(result.summary.finalLevel).toBeGreaterThan(1.0);
      expect(result.summary.maxLevel).toBeGreaterThan(1.0);
      expect(result.summary.minLevel).toBe(1.0);
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should simulate tank with pump outflow and control', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/dynamics/tank-level',
        payload: {
          tank: {
            area: { value: 10, unit: 'm²' },
            initialLevel: { value: 1, unit: 'm' },
            maxLevel: { value: 5, unit: 'm' },
            minLevel: { value: 0, unit: 'm' }
          },
          inflow: {
            type: 'constant',
            value: { value: 0.2, unit: 'm³/s' }
          },
          outflow: {
            type: 'pump',
            pump: {
              curve: [
                { head: 5, flow: { value: 0, unit: 'm³/s' } },
                { head: 3, flow: { value: 0.08, unit: 'm³/s' } },
                { head: 1, flow: { value: 0.15, unit: 'm³/s' } },
                { head: 0, flow: { value: 0.18, unit: 'm³/s' } }
              ],
              onOffControl: {
                highLevel: { value: 2.5, unit: 'm' },
                lowLevel: { value: 2, unit: 'm' }
              }
            }
          },
          simulation: {
            endTime: { value: 100, unit: 's' },
            timeStep: { value: 1, unit: 's' }
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.timeSeries).toBeDefined();
      expect(result.timeSeries).toHaveLength(101);
      
      // Check that pump states are recorded
      const pumpStates = result.timeSeries.map((point: any) => point.pumpOn);
      expect(pumpStates).toBeDefined();
      expect(pumpStates.length).toBeGreaterThan(0);
      
      // Check that at least some pump states are false (pump off)
      expect(pumpStates.some((state: boolean) => !state)).toBe(true);
    });

    it('should return 400 for missing tank area', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/dynamics/tank-level',
        payload: {
          tank: {
            // Missing area
            initialLevel: { value: 1, unit: 'm' }
          },
          inflow: {
            type: 'constant',
            value: { value: 0.1, unit: 'm³/s' }
          },
          outflow: {
            type: 'orifice',
            orifice: {
              coefficient: 0.6,
              area: { value: 0.01, unit: 'm²' }
            }
          },
          simulation: {
            endTime: { value: 100, unit: 's' },
            timeStep: { value: 1, unit: 's' }
          }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid orifice configuration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/dynamics/tank-level',
        payload: {
          tank: {
            area: { value: 10, unit: 'm²' },
            initialLevel: { value: 1, unit: 'm' }
          },
          inflow: {
            type: 'constant',
            value: { value: 0.1, unit: 'm³/s' }
          },
          outflow: {
            type: 'orifice'
            // Missing orifice configuration
          },
          simulation: {
            endTime: { value: 100, unit: 's' },
            timeStep: { value: 1, unit: 's' }
          }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid pump configuration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/dynamics/tank-level',
        payload: {
          tank: {
            area: { value: 10, unit: 'm²' },
            initialLevel: { value: 1, unit: 'm' }
          },
          inflow: {
            type: 'constant',
            value: { value: 0.1, unit: 'm³/s' }
          },
          outflow: {
            type: 'pump'
            // Missing pump configuration
          },
          simulation: {
            endTime: { value: 100, unit: 's' },
            timeStep: { value: 1, unit: 's' }
          }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid pump control levels', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/dynamics/tank-level',
        payload: {
          tank: {
            area: { value: 10, unit: 'm²' },
            initialLevel: { value: 1, unit: 'm' }
          },
          inflow: {
            type: 'constant',
            value: { value: 0.1, unit: 'm³/s' }
          },
          outflow: {
            type: 'pump',
            pump: {
              curve: [
                { head: 5, flow: { value: 0, unit: 'm³/s' } },
                { head: 3, flow: { value: 0.08, unit: 'm³/s' } }
              ],
              onOffControl: {
                highLevel: { value: 2, unit: 'm' }, // Same as low level
                lowLevel: { value: 2, unit: 'm' }
              }
            }
          },
          simulation: {
            endTime: { value: 100, unit: 's' },
            timeStep: { value: 1, unit: 's' }
          }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for missing constant inflow value', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/dynamics/tank-level',
        payload: {
          tank: {
            area: { value: 10, unit: 'm²' },
            initialLevel: { value: 1, unit: 'm' }
          },
          inflow: {
            type: 'constant'
            // Missing value
          },
          outflow: {
            type: 'orifice',
            orifice: {
              coefficient: 0.6,
              area: { value: 0.01, unit: 'm²' }
            }
          },
          simulation: {
            endTime: { value: 100, unit: 's' },
            timeStep: { value: 1, unit: 's' }
          }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for empty curve inflow', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/dynamics/tank-level',
        payload: {
          tank: {
            area: { value: 10, unit: 'm²' },
            initialLevel: { value: 1, unit: 'm' }
          },
          inflow: {
            type: 'curve',
            curve: [] // Empty curve
          },
          outflow: {
            type: 'orifice',
            orifice: {
              coefficient: 0.6,
              area: { value: 0.01, unit: 'm²' }
            }
          },
          simulation: {
            endTime: { value: 100, unit: 's' },
            timeStep: { value: 1, unit: 's' }
          }
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
