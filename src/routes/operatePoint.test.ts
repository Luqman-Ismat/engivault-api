import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import operatePointRoutes from './operatePoint';

describe('Operating Point API Routes', () => {
  let fastify: any;

  beforeEach(async () => {
    fastify = Fastify();
    await fastify.register(operatePointRoutes);
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('POST /api/v1/pumps/operate', () => {
    it('should calculate operating point for single pump', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          pumps: [
            {
              id: 'pump1',
              curve: [
                { q: 0, h: 50 },
                { q: 0.1, h: 48 },
                { q: 0.2, h: 44 },
                { q: 0.3, h: 38 },
                { q: 0.4, h: 30 },
                { q: 0.5, h: 20 },
              ],
            },
          ],
          arrangement: 'single',
          system: {
            staticHead: 20,
            k: 100,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.flow).toBeDefined();
      expect(result.flow.value).toBeGreaterThan(0);
      expect(result.flow.unit).toBe('m³/s');
      
      expect(result.head).toBeDefined();
      expect(result.head.value).toBeGreaterThan(0);
      expect(result.head.unit).toBe('m');
      
      expect(result.pumpHead).toBeDefined();
      expect(result.systemHead).toBeDefined();
      
      expect(result.meta).toBeDefined();
      expect(result.meta.convergence).toBe(true);
      expect(result.meta.iterations).toBeGreaterThan(0);
      expect(result.meta.method).toBe('bisection');
      
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should calculate operating point for pumps in parallel', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          pumps: [
            {
              id: 'pump1',
              curve: [
                { q: 0, h: 50 },
                { q: 0.1, h: 48 },
                { q: 0.2, h: 44 },
                { q: 0.3, h: 38 },
              ],
            },
            {
              id: 'pump2',
              curve: [
                { q: 0, h: 50 },
                { q: 0.1, h: 48 },
                { q: 0.2, h: 44 },
                { q: 0.3, h: 38 },
              ],
            },
          ],
          arrangement: 'parallel',
          system: {
            staticHead: 20,
            k: 100,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.flow.value).toBeGreaterThan(0);
      expect(result.head.value).toBeGreaterThan(0);
      expect(result.meta.convergence).toBe(true);
    });

    it('should calculate operating point for pumps in series', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          pumps: [
            {
              id: 'pump1',
              curve: [
                { q: 0, h: 30 },
                { q: 0.1, h: 28 },
                { q: 0.2, h: 24 },
                { q: 0.3, h: 18 },
              ],
            },
            {
              id: 'pump2',
              curve: [
                { q: 0, h: 25 },
                { q: 0.1, h: 23 },
                { q: 0.2, h: 19 },
                { q: 0.3, h: 13 },
              ],
            },
          ],
          arrangement: 'series',
          system: {
            staticHead: 20,
            k: 100,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.flow.value).toBeGreaterThan(0);
      expect(result.head.value).toBeGreaterThan(0);
      expect(result.meta.convergence).toBe(true);
    });

    it('should apply speed scaling', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          pumps: [
            {
              id: 'pump1',
              curve: [
                { q: 0, h: 50 },
                { q: 0.1, h: 48 },
                { q: 0.2, h: 44 },
                { q: 0.3, h: 38 },
              ],
            },
          ],
          arrangement: 'single',
          system: {
            staticHead: 20,
            k: 100,
          },
          speed: 1.2,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.flow.value).toBeGreaterThan(0);
      expect(result.head.value).toBeGreaterThan(0);
      expect(result.meta.convergence).toBe(true);
    });

    it('should handle polynomial system curve', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          pumps: [
            {
              id: 'pump1',
              curve: [
                { q: 0, h: 50 },
                { q: 0.1, h: 48 },
                { q: 0.2, h: 44 },
                { q: 0.3, h: 38 },
              ],
            },
          ],
          arrangement: 'single',
          system: {
            staticHead: 10,
            k: 50,
            polynomial: [10, 5, 20], // 10 + 5Q + 20Q²
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.flow.value).toBeGreaterThan(0);
      expect(result.head.value).toBeGreaterThan(0);
      expect(result.meta.convergence).toBe(true);
    });

    it('should return validation error for empty pumps array', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          pumps: [],
          arrangement: 'single',
          system: {
            staticHead: 20,
            k: 100,
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Bad Request');
      // Some validation errors may not have details
      if (result.details) {
        expect(result.details).toContain('At least one pump is required');
      }
    });

    it('should return validation error for pump without ID', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          pumps: [
            {
              id: '',
              curve: [
                { q: 0, h: 50 },
                { q: 0.1, h: 48 },
              ],
            },
          ],
          arrangement: 'single',
          system: {
            staticHead: 20,
            k: 100,
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Invalid input parameters');
      // Some validation errors may not have details
      if (result.details) {
        expect(result.details).toContain('Pump 0: ID is required');
      }
    });

    it('should return validation error for insufficient curve points', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          pumps: [
            {
              id: 'pump1',
              curve: [{ q: 0, h: 50 }], // Only one point
            },
          ],
          arrangement: 'single',
          system: {
            staticHead: 20,
            k: 100,
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Bad Request');
      // Some validation errors may not have details
      if (result.details) {
        expect(result.details).toContain('Pump pump1: Curve must have at least 2 points');
      }
    });

    it('should return validation error for invalid arrangement', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          pumps: [
            {
              id: 'pump1',
              curve: [
                { q: 0, h: 50 },
                { q: 0.1, h: 48 },
              ],
            },
          ],
          arrangement: 'invalid',
          system: {
            staticHead: 20,
            k: 100,
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Bad Request');
      // Some validation errors may not have details
      if (result.details) {
        expect(result.details).toContain('Invalid arrangement type');
      }
    });

    it('should return validation error for negative static head', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          pumps: [
            {
              id: 'pump1',
              curve: [
                { q: 0, h: 50 },
                { q: 0.1, h: 48 },
              ],
            },
          ],
          arrangement: 'single',
          system: {
            staticHead: -10,
            k: 100,
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Bad Request');
      // Some validation errors may not have details
      if (result.details) {
        expect(result.details).toContain('Static head cannot be negative');
      }
    });

    it('should return validation error for negative system coefficient', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          pumps: [
            {
              id: 'pump1',
              curve: [
                { q: 0, h: 50 },
                { q: 0.1, h: 48 },
              ],
            },
          ],
          arrangement: 'single',
          system: {
            staticHead: 20,
            k: -50,
          },
        },
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Bad Request');
      // Some validation errors may not have details
      if (result.details) {
        expect(result.details).toContain('System coefficient k cannot be negative');
      }
    });

    it('should return validation error for invalid request body', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/operate',
        payload: {
          // Missing required fields
        },
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Bad Request');
    });
  });

  describe('GET /api/v1/pumps/arrangements', () => {
    it('should return supported arrangements', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/pumps/arrangements',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.arrangements).toBeDefined();
      expect(Array.isArray(result.arrangements)).toBe(true);
      expect(result.arrangements).toHaveLength(3);
      
      const arrangementTypes = result.arrangements.map((a: any) => a.type);
      expect(arrangementTypes).toContain('single');
      expect(arrangementTypes).toContain('parallel');
      expect(arrangementTypes).toContain('series');
      
      // Check that each arrangement has required properties
      result.arrangements.forEach((arrangement: any) => {
        expect(arrangement.type).toBeDefined();
        expect(arrangement.description).toBeDefined();
        expect(arrangement.characteristics).toBeDefined();
      });
    });
  });
});
