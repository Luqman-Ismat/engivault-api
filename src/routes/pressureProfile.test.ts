import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import pressureProfileRoutes from './pressureProfile';

describe('Pressure Profile API Routes', () => {
  let fastify: any;

  beforeEach(async () => {
    fastify = Fastify();
    await fastify.register(pressureProfileRoutes);
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('POST /api/v1/hydraulics/pressure-profile', () => {
    it('should calculate pressure profile for single segment', async () => {
      const requestBody = {
        segments: [
          {
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: 5, unit: 'm' },
            flow: { value: 0.01, unit: 'm³/s' },
          },
        ],
        fluid: {
          name: 'water',
          temperature: { value: 20, unit: 'C' },
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/pressure-profile',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0].cumulativeLength.value).toBe(0);
      expect(result.nodes[0].elevation.value).toBe(0);
      expect(result.nodes[0].pressure.value).toBe(0);

      expect(result.nodes[1].cumulativeLength.value).toBe(100);
      expect(result.nodes[1].elevation.value).toBe(5);
      expect(result.nodes[1].pressure.value).toBeLessThan(0);

      expect(result.totalLength.value).toBe(100);
      expect(result.totalPressureDrop.value).toBeGreaterThan(0);
      expect(result.warnings).toBeInstanceOf(Array);
    });

    it('should handle multiple segments with mixed diameters', async () => {
      const requestBody = {
        segments: [
          {
            length: { value: 50, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: 2, unit: 'm' },
            flow: { value: 0.01, unit: 'm³/s' },
          },
          {
            length: { value: 75, unit: 'm' },
            diameter: { value: 0.08, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: -1, unit: 'm' },
            flow: { value: 0.01, unit: 'm³/s' },
          },
        ],
        fluid: {
          name: 'water',
          temperature: { value: 20, unit: 'C' },
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/pressure-profile',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.nodes).toHaveLength(3);
      expect(result.nodes[1].cumulativeLength.value).toBe(50);
      expect(result.nodes[1].elevation.value).toBe(2);
      expect(result.nodes[2].cumulativeLength.value).toBe(125);
      expect(result.nodes[2].elevation.value).toBe(1);
      expect(result.totalLength.value).toBe(125);
    });

    it('should include local losses from K-factors', async () => {
      const requestBody = {
        segments: [
          {
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: 0, unit: 'm' },
            kLocal: [0.5, 1.2],
            flow: { value: 0.01, unit: 'm³/s' },
          },
        ],
        fluid: {
          name: 'water',
          temperature: { value: 20, unit: 'C' },
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/pressure-profile',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.nodes[1].pressure.value).toBeLessThan(0);
      expect(result.totalPressureDrop.value).toBeGreaterThan(0);
    });

    it('should handle elevation changes correctly', async () => {
      const requestBody = {
        segments: [
          {
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: 10, unit: 'm' },
            flow: { value: 0.01, unit: 'm³/s' },
          },
          {
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: -15, unit: 'm' },
            flow: { value: 0.01, unit: 'm³/s' },
          },
        ],
        fluid: {
          name: 'water',
          temperature: { value: 20, unit: 'C' },
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/pressure-profile',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.nodes[1].elevation.value).toBe(10);
      expect(result.nodes[2].elevation.value).toBe(-5);
    });

    it('should work with air as fluid', async () => {
      const requestBody = {
        segments: [
          {
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: 5, unit: 'm' },
            flow: { value: 0.1, unit: 'm³/s' },
          },
        ],
        fluid: {
          name: 'air',
          temperature: { value: 25, unit: 'C' },
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/pressure-profile',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.nodes).toHaveLength(2);
      expect(result.totalLength.value).toBe(100);
      expect(result.totalPressureDrop.value).toBeGreaterThan(0);
    });

    it('should work with explicit fluid properties', async () => {
      const requestBody = {
        segments: [
          {
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: 0, unit: 'm' },
            flow: { value: 0.01, unit: 'm³/s' },
          },
        ],
        fluid: {
          temperature: { value: 20, unit: 'C' },
          density: { value: 998, unit: 'kg/m³' },
          viscosity: { value: 0.001, unit: 'Pa·s' },
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/pressure-profile',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.nodes).toHaveLength(2);
      expect(result.totalLength.value).toBe(100);
    });

    it('should return validation error for empty segments', async () => {
      const requestBody = {
        segments: [],
        fluid: {
          name: 'water',
          temperature: { value: 20, unit: 'C' },
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/pressure-profile',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
    });

    it('should return validation error for negative length', async () => {
      const requestBody = {
        segments: [
          {
            length: { value: -100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: 0, unit: 'm' },
          },
        ],
        fluid: {
          name: 'water',
          temperature: { value: 20, unit: 'C' },
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/pressure-profile',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Invalid segments');
    });

    it('should return validation error for missing fluid properties', async () => {
      const requestBody = {
        segments: [
          {
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: 0, unit: 'm' },
            flow: { value: 0.01, unit: 'm³/s' },
          },
        ],
        fluid: {
          temperature: { value: 20, unit: 'C' },
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/pressure-profile',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(500);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Internal server error');
    });

    it('should return validation error for different flow rates', async () => {
      const requestBody = {
        segments: [
          {
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: 0, unit: 'm' },
            flow: { value: 0.01, unit: 'm³/s' },
          },
          {
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
            elevationDelta: { value: 0, unit: 'm' },
            flow: { value: 0.02, unit: 'm³/s' },
          },
        ],
        fluid: {
          name: 'water',
          temperature: { value: 20, unit: 'C' },
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/pressure-profile',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(500);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Internal server error');
    });

    it('should return validation error for invalid request body', async () => {
      const requestBody = {
        segments: 'invalid',
        fluid: {
          name: 'water',
          temperature: { value: 20, unit: 'C' },
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/hydraulics/pressure-profile',
        payload: requestBody,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Bad Request');
    });
  });
});
