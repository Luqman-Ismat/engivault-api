import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '@/index';
import { FastifyInstance } from 'fastify';

describe('Hydraulics Routes', () => {
  let fastify: FastifyInstance;

  beforeAll(async () => {
    fastify = await build();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('POST /api/v1/hydraulics/size-pipe', () => {
    const waterAt20C = {
      density: { value: 998, unit: 'kg/m³' },
      viscosity: { value: 0.001002, unit: 'Pa·s' }
    };

    it('should size pipe for target velocity', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'velocity',
          value: { value: 2, unit: 'm/s' },
          fluid: waterAt20C,
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.diameter.value).toBeCloseTo(0.252, 3);
      expect(result.velocity.value).toBeCloseTo(2, 2);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.reynoldsNumber).toBeGreaterThan(4000);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.metadata.calculations.method).toBe('Velocity-based sizing');
    });

    it('should size pipe for target pressure drop', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'dP',
          value: { value: 10000, unit: 'Pa' },
          fluid: waterAt20C,
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.diameter.value).toBeGreaterThan(0);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.velocity.value).toBeGreaterThan(0);
      expect(result.metadata.calculations.method).toBe('Pressure drop-based sizing');
    });

    it('should handle different velocity units', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'velocity',
          value: { value: 6.56, unit: 'ft/s' }, // 2 m/s in ft/s
          fluid: waterAt20C,
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.diameter.value).toBeCloseTo(0.252, 3);
      expect(result.velocity.value).toBeCloseTo(2, 2);
    });

    it('should handle different pressure units', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'dP',
          value: { value: 10, unit: 'kPa' }, // 10000 Pa
          fluid: waterAt20C,
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });

    it('should handle custom roughness', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'velocity',
          value: { value: 2, unit: 'm/s' },
          roughness: { value: 0.000001, unit: 'm' }, // Very smooth pipe
          fluid: waterAt20C,
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.diameter.value).toBeGreaterThan(0);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });

    it('should return 400 for invalid velocity unit', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'velocity',
          value: { value: 2, unit: 'invalid_unit' },
          fluid: waterAt20C,
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toContain('Invalid velocity unit');
    });

    it('should return 400 for invalid pressure unit', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'dP',
          value: { value: 10000, unit: 'invalid_unit' },
          fluid: waterAt20C,
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toContain('Invalid pressure unit');
    });

    it('should return 400 for negative flow', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: -0.1, unit: 'm³/s' },
          target: 'velocity',
          value: { value: 2, unit: 'm/s' },
          fluid: waterAt20C,
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toContain('Flow rate must be positive');
    });

    it('should return 400 for negative target value', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'velocity',
          value: { value: -2, unit: 'm/s' },
          fluid: waterAt20C,
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toContain('Target value must be positive');
    });

    it('should return 400 for negative length', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'velocity',
          value: { value: 2, unit: 'm/s' },
          fluid: waterAt20C,
          length: { value: -100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toContain('Pipe length must be positive');
    });

    it('should return 400 for negative density', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'velocity',
          value: { value: 2, unit: 'm/s' },
          fluid: { density: { value: -998, unit: 'kg/m³' }, viscosity: { value: 0.001002, unit: 'Pa·s' } },
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toContain('Fluid density must be positive');
    });

    it('should return 400 for negative viscosity', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'velocity',
          value: { value: 2, unit: 'm/s' },
          fluid: { density: { value: 998, unit: 'kg/m³' }, viscosity: { value: -0.001002, unit: 'Pa·s' } },
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toContain('Fluid viscosity must be positive');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'velocity',
          // Missing value field
          fluid: waterAt20C,
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid target type', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/size-pipe',
        payload: {
          flow: { value: 0.1, unit: 'm³/s' },
          target: 'invalid_target',
          value: { value: 2, unit: 'm/s' },
          fluid: waterAt20C,
          length: { value: 100, unit: 'm' }
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
