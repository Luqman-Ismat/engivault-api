import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import cavitationRiskRoutes from './cavitationRisk';

describe('Cavitation Risk API', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    fastify = Fastify();
    await fastify.register(cavitationRiskRoutes);
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('POST /api/v1/pumps/cavitation-risk', () => {
    const validRequest = {
      atmosphericPressure: { value: 101325, unit: 'Pa' },
      staticHead: { value: 5, unit: 'm' },
      losses: { value: 5000, unit: 'Pa' },
      flowRate: { value: 0.15, unit: 'm³/s' },
      npshCurve: {
        points: [
          { q: 0, npshr: 2.0 },
          { q: 0.1, npshr: 2.5 },
          { q: 0.2, npshr: 3.2 },
          { q: 0.3, npshr: 4.1 },
          { q: 0.4, npshr: 5.0 },
        ],
      },
      fluidName: 'water',
    };

    it('should calculate cavitation risk successfully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: validRequest,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.npshAvailable).toBeDefined();
      expect(result.npshAvailable.value).toBeGreaterThan(0);
      expect(result.npshAvailable.unit).toBe('m');

      expect(result.npshRequired).toBeDefined();
      expect(result.npshRequired.value).toBeGreaterThan(0);
      expect(result.npshRequired.unit).toBe('m');

      expect(result.cavitationMargin).toBeDefined();
      expect(result.cavitationMargin.value).toBeDefined();
      expect(result.cavitationMargin.unit).toBe('m');

      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    it('should handle altitude input', async () => {
      const altitudeRequest = {
        ...validRequest,
        altitude: 1000,
        atmosphericPressure: undefined,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: altitudeRequest,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.npshAvailable.value).toBeGreaterThan(0);
      expect(result.metadata.atmosphericPressure.value).toBeLessThan(101325);
    });

    it('should handle custom temperature', async () => {
      const tempRequest = {
        ...validRequest,
        temperature: { value: 313.15, unit: 'K' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: tempRequest,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.npshAvailable.value).toBeGreaterThan(0);
      expect(result.metadata.temperature.value).toBe(313.15);
    });

    it('should handle custom vapor pressure', async () => {
      const customVaporRequest = {
        ...validRequest,
        vaporPressure: { value: 5000, unit: 'Pa' },
        fluidName: 'custom',
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: customVaporRequest,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.npshAvailable.value).toBeGreaterThan(0);
      expect(result.metadata.vaporPressure.value).toBe(5000);
    });

    it('should generate warnings for low margin', async () => {
      const lowMarginRequest = {
        ...validRequest,
        staticHead: { value: -15, unit: 'm' }, // Very negative static head to ensure low margin
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: lowMarginRequest,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w: string) => w.includes('margin'))).toBe(true);
    });

    it('should return validation error for missing atmospheric pressure and altitude', async () => {
      const invalidRequest = {
        ...validRequest,
        atmosphericPressure: undefined,
        altitude: undefined,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for negative atmospheric pressure', async () => {
      const invalidRequest = {
        ...validRequest,
        atmosphericPressure: { value: -1000, unit: 'Pa' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain('Atmospheric pressure must be positive');
    });

    it('should return validation error for negative losses', async () => {
      const invalidRequest = {
        ...validRequest,
        losses: { value: -1000, unit: 'Pa' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain('Losses must be non-negative');
    });

    it('should return validation error for negative flow rate', async () => {
      const invalidRequest = {
        ...validRequest,
        flowRate: { value: -0.1, unit: 'm³/s' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain('Flow rate must be positive');
    });

    it('should return validation error for empty NPSH curve', async () => {
      const invalidRequest = {
        ...validRequest,
        npshCurve: { points: [] },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for negative curve points', async () => {
      const invalidRequest = {
        ...validRequest,
        npshCurve: {
          points: [
            { q: -0.1, npshr: 2.0 },
            { q: 0.1, npshr: 2.5 },
          ],
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for negative altitude', async () => {
      const invalidRequest = {
        ...validRequest,
        altitude: -100,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for missing fluid properties', async () => {
      const invalidRequest = {
        ...validRequest,
        fluidName: undefined,
        vaporPressure: undefined,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(500);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Internal server error');
    });

    it('should return validation error for invalid payload structure', async () => {
      const invalidRequest = {
        atmosphericPressure: 'invalid',
        staticHead: { value: 5 },
        losses: { value: 5000, unit: 'Pa' },
        flowRate: { value: 0.15, unit: 'm³/s' },
        npshCurve: {
          points: [
            { q: 0, npshr: 2.0 },
          ],
        },
        fluidName: 'water',
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/cavitation-risk',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });
  });

  describe('GET /api/v1/pumps/fluids', () => {
    it('should return supported fluids', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/pumps/fluids',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.fluids).toBeInstanceOf(Array);
      expect(result.fluids).toHaveLength(2);
      expect(result.fluids[0].name).toBe('water');
      expect(result.fluids[1].name).toBe('air');
    });
  });
});
