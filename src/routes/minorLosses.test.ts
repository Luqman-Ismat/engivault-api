import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import minorLossesRoutes from './minorLosses';

describe('Minor Losses API Routes', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    fastify = Fastify();
    await fastify.register(minorLossesRoutes);
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('POST /api/v1/hydraulics/minor-losses', () => {
    it('should calculate minor losses with velocity input', async () => {
      const requestBody = {
        fluid: {
          name: 'water',
          temperature: { value: 20, unit: 'C' },
        },
        pipe: {
          diameter: { value: 2, unit: 'in' },
        },
        fittings: [
          { type: 'elbow-90-long-radius', count: 2 },
          { type: 'globe-valve', count: 1, nominalSize: '2', schedule: '40' },
        ],
        velocity: { value: 5, unit: 'ft/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('deltaP');
      expect(body).toHaveProperty('Keq');
      expect(body).toHaveProperty('warnings');
      expect(body.deltaP).toHaveProperty('value');
      expect(body.deltaP).toHaveProperty('unit');
      expect(body.Keq).toBeGreaterThan(0);
      expect(Array.isArray(body.warnings)).toBe(true);
    });

    it('should calculate minor losses with flow input', async () => {
      const requestBody = {
        fluid: {
          name: 'water',
        },
        pipe: {
          diameter: { value: 50, unit: 'mm' },
        },
        fittings: [
          { type: 'elbow-90-long-radius', count: 1 },
          { type: 'tee-through', count: 1 },
        ],
        flow: { value: 0.01, unit: 'm³/s' },
        diameter: { value: 50, unit: 'mm' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('deltaP');
      expect(body).toHaveProperty('Keq');
      expect(body.Keq).toBe(0.5); // 0.3 + 0.2
      expect(body.deltaP.value).toBeGreaterThan(0);
    });

    it('should handle K-factor overrides', async () => {
      const requestBody = {
        fluid: {
          name: 'water',
        },
        pipe: {
          diameter: { value: 2, unit: 'in' },
        },
        fittings: [{ type: 'elbow-90-long-radius', count: 1, k: 0.5 }],
        velocity: { value: 3, unit: 'm/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.Keq).toBe(0.5);
      expect(body.warnings).toContain(
        'Using provided K-factor (0.5) for elbow-90-long-radius'
      );
    });

    it('should handle unknown fitting types', async () => {
      const requestBody = {
        fluid: {
          name: 'water',
        },
        pipe: {
          diameter: { value: 2, unit: 'in' },
        },
        fittings: [{ type: 'unknown-fitting', count: 1 }],
        velocity: { value: 2, unit: 'm/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.Keq).toBe(1.0); // Default K-factor
      expect(body.warnings).toContain(
        'K-factor not found for unknown-fitting, using default value of 1.0'
      );
    });

    it('should handle air fluid properties', async () => {
      const requestBody = {
        fluid: {
          name: 'air',
          temperature: { value: 25, unit: 'C' },
        },
        pipe: {
          diameter: { value: 100, unit: 'mm' },
        },
        fittings: [{ type: 'elbow-90-long-radius', count: 1 }],
        velocity: { value: 10, unit: 'm/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('deltaP');
      expect(body.Keq).toBe(0.3);
      expect(body.deltaP.value).toBeGreaterThan(0);
    });

    it('should validate required fields', async () => {
      const requestBody = {
        fluid: {
          name: 'water',
        },
        // Missing pipe and fittings
        velocity: { value: 2, unit: 'm/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBe('Validation error');
    });

    it('should validate fitting count', async () => {
      const requestBody = {
        fluid: {
          name: 'water',
        },
        pipe: {
          diameter: { value: 2, unit: 'in' },
        },
        fittings: [
          { type: 'elbow-90-long-radius', count: 0 }, // Invalid count
        ],
        velocity: { value: 2, unit: 'm/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBe('Validation error');
    });

    it('should require either velocity or flow+diameter', async () => {
      const requestBody = {
        fluid: {
          name: 'water',
        },
        pipe: {
          diameter: { value: 2, unit: 'in' },
        },
        fittings: [{ type: 'elbow-90-long-radius', count: 1 }],
        // Missing both velocity and flow
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBe('Validation error');
    });
  });

  describe('GET /api/v1/hydraulics/k-factors', () => {
    it('should return generic K-factors', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/hydraulics/k-factors',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('kFactors');
      expect(body.kFactors).toHaveProperty('elbow-90-long-radius');
      expect(body.kFactors).toHaveProperty('tee-through');
      expect(body.kFactors).toHaveProperty('entrance-sharp');
      expect(body.kFactors['elbow-90-long-radius'].k).toBe(0.3);
    });

    it('should return size-specific K-factors', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/hydraulics/k-factors?nominalSize=2&schedule=40',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('kFactors');
      expect(body.kFactors).toHaveProperty('globe-valve');
      expect(body.kFactors).toHaveProperty('gate-valve');
      expect(body.kFactors).toHaveProperty('elbow-90-long-radius');
      expect(body.kFactors['globe-valve'].k).toBe(6.0);
      expect(body.kFactors['gate-valve'].k).toBe(0.15);
    });

    it('should handle unknown size/schedule gracefully', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/hydraulics/k-factors?nominalSize=999&schedule=999',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('kFactors');
      // Should still return generic K-factors
      expect(body.kFactors).toHaveProperty('elbow-90-long-radius');
    });
  });

  describe('GET /api/v1/hydraulics/fitting-types', () => {
    it('should return all available fitting types', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/hydraulics/fitting-types',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('fittingTypes');
      expect(Array.isArray(body.fittingTypes)).toBe(true);
      expect(body.fittingTypes).toContain('elbow-90-long-radius');
      expect(body.fittingTypes).toContain('tee-through');
      expect(body.fittingTypes).toContain('globe-valve');
      expect(body.fittingTypes).toContain('gate-valve');
    });

    it('should include both generic and valve types', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/hydraulics/fitting-types',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      const fittingTypes = body.fittingTypes;

      // Check for generic fittings
      expect(fittingTypes).toContain('elbow-90-long-radius');
      expect(fittingTypes).toContain('tee-through');
      expect(fittingTypes).toContain('entrance-sharp');
      expect(fittingTypes).toContain('exit');

      // Check for valve types
      expect(fittingTypes).toContain('globe-valve');
      expect(fittingTypes).toContain('gate-valve');
      expect(fittingTypes).toContain('ball-valve');
      expect(fittingTypes).toContain('check-valve-swing');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle realistic piping system', async () => {
      const requestBody = {
        fluid: {
          name: 'water',
          temperature: { value: 20, unit: 'C' },
        },
        pipe: {
          diameter: { value: 2, unit: 'in' },
        },
        fittings: [
          { type: 'entrance-sharp', count: 1 },
          { type: 'elbow-90-long-radius', count: 4 },
          { type: 'tee-through', count: 2 },
          { type: 'globe-valve', count: 1, nominalSize: '2', schedule: '40' },
          { type: 'exit', count: 1 },
        ],
        velocity: { value: 3, unit: 'm/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      // K = 0.5 + 4*0.3 + 2*0.2 + 1*6.0 + 1*1.0 = 9.1
      expect(body.Keq).toBe(9.1);
      expect(body.deltaP.value).toBeGreaterThan(0);
    });

    it('should handle mixed K-factor sources', async () => {
      const requestBody = {
        fluid: {
          name: 'water',
        },
        pipe: {
          diameter: { value: 50, unit: 'mm' },
        },
        fittings: [
          { type: 'elbow-90-long-radius', count: 1 }, // From catalog
          { type: 'custom-fitting', count: 2, k: 1.5 }, // Override
          { type: 'globe-valve', count: 1, nominalSize: '1', schedule: '40' }, // Size-specific
        ],
        velocity: { value: 2, unit: 'm/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      // K = 0.3 + 2*1.5 + 6.0 = 9.3
      expect(body.Keq).toBe(9.3);
      expect(body.warnings).toContain(
        'Using provided K-factor (1.5) for custom-fitting'
      );
      // Note: When K-factor is provided as override, it doesn't check the catalog
    });

    it('should handle different units', async () => {
      const requestBody = {
        fluid: {
          name: 'water',
        },
        pipe: {
          diameter: { value: 2, unit: 'in' },
        },
        fittings: [{ type: 'elbow-90-long-radius', count: 1 }],
        velocity: { value: 10, unit: 'ft/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body).toHaveProperty('deltaP');
      expect(body.Keq).toBe(0.3);
      expect(body.deltaP.value).toBeGreaterThan(0);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid fluid name', async () => {
      const requestBody = {
        fluid: {
          name: 'invalid-fluid',
        },
        pipe: {
          diameter: { value: 2, unit: 'in' },
        },
        fittings: [{ type: 'elbow-90-long-radius', count: 1 }],
        velocity: { value: 2, unit: 'm/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBe('Internal server error');
    });

    it('should handle invalid unit conversions', async () => {
      const requestBody = {
        fluid: {
          name: 'water',
        },
        pipe: {
          diameter: { value: 2, unit: 'invalid-unit' },
        },
        fittings: [{ type: 'elbow-90-long-radius', count: 1 }],
        velocity: { value: 2, unit: 'm/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/minor-losses',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(500);
      const body = response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toBe('Internal server error');
    });
  });
});
