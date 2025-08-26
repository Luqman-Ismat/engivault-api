import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../index';

describe('Slurries Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/slurries/pressure-drop', () => {
    it('should calculate slurry pressure drop with volume concentration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/slurries/pressure-drop',
        payload: {
          slurry: {
            carrierFluid: {
              density: { value: 1000, unit: 'kg/m³' },
              viscosity: { value: 0.001, unit: 'Pa·s' }
            },
            particles: {
              density: { value: 2650, unit: 'kg/m³' },
              diameter: { value: 0.001, unit: 'm' },
              shape: 'spherical'
            },
            concentration: { value: 0.1, unit: 'dimensionless' },
            concentrationType: 'volume'
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          velocity: { value: 2.0, unit: 'm/s' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.headloss).toBeDefined();
      expect(result.headloss.value).toBeGreaterThan(0);
      expect(result.pressureDrop).toBeDefined();
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.relativeRoughness).toBeGreaterThan(0);
      expect(result.durandFactor).toBeGreaterThan(0);
      expect(result.froudeNumber).toBeGreaterThan(0);
      expect(result.concentrationEffect).toBeGreaterThan(1.0);
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.calculations.reynoldsNumber).toBeGreaterThan(0);
      expect(result.metadata.calculations.settlingVelocity).toBeGreaterThan(0);
      expect(result.metadata.calculations.concentration).toBe(0.1);
    });

    it('should calculate slurry pressure drop with weight concentration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/slurries/pressure-drop',
        payload: {
          slurry: {
            carrierFluid: {
              density: { value: 1000, unit: 'kg/m³' },
              viscosity: { value: 0.001, unit: 'Pa·s' }
            },
            particles: {
              density: { value: 2650, unit: 'kg/m³' },
              diameter: { value: 0.001, unit: 'm' },
              shape: 'angular'
            },
            concentration: { value: 0.2, unit: 'dimensionless' },
            concentrationType: 'weight'
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          velocity: { value: 2.0, unit: 'm/s' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.headloss.value).toBeGreaterThan(0);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.concentrationEffect).toBeGreaterThan(1.0);
    });

    it('should return 400 for particle density less than carrier fluid density', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/slurries/pressure-drop',
        payload: {
          slurry: {
            carrierFluid: {
              density: { value: 1000, unit: 'kg/m³' },
              viscosity: { value: 0.001, unit: 'Pa·s' }
            },
            particles: {
              density: { value: 800, unit: 'kg/m³' }, // Less than carrier fluid
              diameter: { value: 0.001, unit: 'm' },
              shape: 'spherical'
            },
            concentration: { value: 0.1, unit: 'dimensionless' },
            concentrationType: 'volume'
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          velocity: { value: 2.0, unit: 'm/s' }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid concentration range', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/slurries/pressure-drop',
        payload: {
          slurry: {
            carrierFluid: {
              density: { value: 1000, unit: 'kg/m³' },
              viscosity: { value: 0.001, unit: 'Pa·s' }
            },
            particles: {
              density: { value: 2650, unit: 'kg/m³' },
              diameter: { value: 0.001, unit: 'm' },
              shape: 'spherical'
            },
            concentration: { value: 1.5, unit: 'dimensionless' }, // Invalid > 1
            concentrationType: 'volume'
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          velocity: { value: 2.0, unit: 'm/s' }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for negative velocity', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/slurries/pressure-drop',
        payload: {
          slurry: {
            carrierFluid: {
              density: { value: 1000, unit: 'kg/m³' },
              viscosity: { value: 0.001, unit: 'Pa·s' }
            },
            particles: {
              density: { value: 2650, unit: 'kg/m³' },
              diameter: { value: 0.001, unit: 'm' },
              shape: 'spherical'
            },
            concentration: { value: 0.1, unit: 'dimensionless' },
            concentrationType: 'volume'
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          velocity: { value: -1.0, unit: 'm/s' } // Negative velocity
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid pipe geometry', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/slurries/pressure-drop',
        payload: {
          slurry: {
            carrierFluid: {
              density: { value: 1000, unit: 'kg/m³' },
              viscosity: { value: 0.001, unit: 'Pa·s' }
            },
            particles: {
              density: { value: 2650, unit: 'kg/m³' },
              diameter: { value: 0, unit: 'm' }, // Invalid diameter
              shape: 'spherical'
            },
            concentration: { value: 0.1, unit: 'dimensionless' },
            concentrationType: 'volume'
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          velocity: { value: 2.0, unit: 'm/s' }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for large particle-to-pipe diameter ratio', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/slurries/pressure-drop',
        payload: {
          slurry: {
            carrierFluid: {
              density: { value: 1000, unit: 'kg/m³' },
              viscosity: { value: 0.001, unit: 'Pa·s' }
            },
            particles: {
              density: { value: 2650, unit: 'kg/m³' },
              diameter: { value: 0.02, unit: 'm' }, // 20% of pipe diameter
              shape: 'spherical'
            },
            concentration: { value: 0.1, unit: 'dimensionless' },
            concentrationType: 'volume'
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          velocity: { value: 2.0, unit: 'm/s' }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle different particle shapes', async () => {
      const sphericalResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/slurries/pressure-drop',
        payload: {
          slurry: {
            carrierFluid: {
              density: { value: 1000, unit: 'kg/m³' },
              viscosity: { value: 0.001, unit: 'Pa·s' }
            },
            particles: {
              density: { value: 2650, unit: 'kg/m³' },
              diameter: { value: 0.001, unit: 'm' },
              shape: 'spherical'
            },
            concentration: { value: 0.1, unit: 'dimensionless' },
            concentrationType: 'volume'
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          velocity: { value: 2.0, unit: 'm/s' }
        }
      });

      const angularResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/slurries/pressure-drop',
        payload: {
          slurry: {
            carrierFluid: {
              density: { value: 1000, unit: 'kg/m³' },
              viscosity: { value: 0.001, unit: 'Pa·s' }
            },
            particles: {
              density: { value: 2650, unit: 'kg/m³' },
              diameter: { value: 0.001, unit: 'm' },
              shape: 'angular'
            },
            concentration: { value: 0.1, unit: 'dimensionless' },
            concentrationType: 'volume'
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          velocity: { value: 2.0, unit: 'm/s' }
        }
      });

      expect(sphericalResponse.statusCode).toBe(200);
      expect(angularResponse.statusCode).toBe(200);
      
      const sphericalResult = JSON.parse(sphericalResponse.payload);
      const angularResult = JSON.parse(angularResponse.payload);
      
      // Angular particles should have different settling velocity and headloss
      expect(sphericalResult.metadata.calculations.settlingVelocity).not.toBe(
        angularResult.metadata.calculations.settlingVelocity
      );
    });
  });
});
