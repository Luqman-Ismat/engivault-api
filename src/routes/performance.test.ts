import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { build } from '@/index';

describe('Performance Integration Tests', () => {
  let app: any;

  beforeEach(async () => {
    app = await build();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Rate Limiting', () => {
    it('should rate limit repeated requests to calculation endpoints', async () => {
      const payload = {
        points: [
          { q: 10, h: 90 },
          { q: 20, h: 80 },
          { q: 30, h: 70 },
          { q: 40, h: 60 },
          { q: 50, h: 50 },
        ],
        model: 'quadratic',
      };

      // Make multiple requests rapidly
      const promises = Array.from({ length: 105 }, () =>
        app.inject({
          method: 'POST',
          url: '/api/v1/curves/fit',
          payload,
        })
      );

      const responses = await Promise.all(promises);

      // First 100 requests should succeed
      for (let i = 0; i < 100; i++) {
        expect(responses[i].statusCode).toBe(200);
      }

      // Requests after 100 should be rate limited
      for (let i = 100; i < 105; i++) {
        expect(responses[i].statusCode).toBe(429);
        expect(JSON.parse(responses[i].payload)).toMatchObject({
          error: 'Too Many Requests',
        });
      }
    });

    it('should not rate limit health and metrics endpoints', async () => {
      // Make many requests to health endpoint
      const healthPromises = Array.from({ length: 200 }, () =>
        app.inject({
          method: 'GET',
          url: '/health',
        })
      );

      const healthResponses = await Promise.all(healthPromises);

      // All health requests should succeed
      healthResponses.forEach(response => {
        expect(response.statusCode).toBe(200);
      });
    });

    it('should include rate limit headers in responses', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: {
          points: [
            { q: 10, h: 90 },
            { q: 20, h: 80 },
            { q: 30, h: 70 },
          ],
          model: 'quadratic',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('Compression', () => {
    it('should compress large responses', async () => {
      // Create a large payload that should trigger compression
      const largePayload = {
        points: Array.from({ length: 100 }, (_, i) => ({
          q: i * 10,
          h: 100 - i * 0.5,
        })),
        model: 'cubic',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: largePayload,
        headers: {
          'accept-encoding': 'gzip, deflate',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-encoding']).toBeDefined();
      expect(['gzip', 'deflate']).toContain(
        response.headers['content-encoding']
      );
    });

    it('should not compress small responses', async () => {
      const smallPayload = {
        points: [
          { q: 10, h: 90 },
          { q: 20, h: 80 },
          { q: 30, h: 70 },
        ],
        model: 'quadratic',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: smallPayload,
        headers: {
          'accept-encoding': 'gzip, deflate',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-encoding']).toBeUndefined();
    });

    it('should respect accept-encoding header', async () => {
      const largePayload = {
        points: Array.from({ length: 50 }, (_, i) => ({
          q: i * 10,
          h: 100 - i * 0.5,
        })),
        model: 'quadratic',
      };

      // Request with gzip only
      const gzipResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: largePayload,
        headers: {
          'accept-encoding': 'gzip',
        },
      });

      expect(gzipResponse.statusCode).toBe(200);
      expect(gzipResponse.headers['content-encoding']).toBe('gzip');

      // Request with deflate only
      const deflateResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: largePayload,
        headers: {
          'accept-encoding': 'deflate',
        },
      });

      expect(deflateResponse.statusCode).toBe(200);
      expect(deflateResponse.headers['content-encoding']).toBe('deflate');
    });
  });

  describe('Caching', () => {
    it('should add cache headers to GET requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toContain('public');
      expect(response.headers['etag']).toBeDefined();
    });

    it('should return 304 for matching ETags', async () => {
      // First request to get ETag
      const firstResponse = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const etag = firstResponse.headers['etag'];

      // Second request with If-None-Match header
      const secondResponse = await app.inject({
        method: 'GET',
        url: '/health',
        headers: {
          'if-none-match': etag,
        },
      });

      expect(secondResponse.statusCode).toBe(304);
    });

    it('should not cache POST requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: {
          points: [
            { q: 10, h: 90 },
            { q: 20, h: 80 },
            { q: 30, h: 70 },
          ],
          model: 'quadratic',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toBeUndefined();
      expect(response.headers['etag']).toBeUndefined();
    });
  });

  describe('Performance Headers', () => {
    it('should include performance-related headers', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: {
          points: [
            { q: 10, h: 90 },
            { q: 20, h: 80 },
            { q: 30, h: 70 },
          ],
          model: 'quadratic',
        },
      });

      expect(response.statusCode).toBe(200);

      // Check for rate limit headers
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();

      // Check for timing headers (if added by middleware)
      expect(response.headers['x-response-time']).toBeDefined();
    });

    it('should handle large payloads efficiently', async () => {
      const startTime = Date.now();

      const largePayload = {
        points: Array.from({ length: 200 }, (_, i) => ({
          q: i * 5,
          h: 100 - i * 0.25,
        })),
        model: 'cubic',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: largePayload,
        headers: {
          'accept-encoding': 'gzip',
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.statusCode).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(response.headers['content-encoding']).toBe('gzip');
    });
  });

  describe('Cache Behavior', () => {
    it('should cache identical requests', async () => {
      const payload = {
        points: [
          { q: 10, h: 90 },
          { q: 20, h: 80 },
          { q: 30, h: 70 },
        ],
        model: 'quadratic',
      };

      // First request
      const firstResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload,
      });

      // Second identical request
      const secondResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload,
      });

      expect(firstResponse.statusCode).toBe(200);
      expect(secondResponse.statusCode).toBe(200);

      // Both responses should be identical
      const firstResult = JSON.parse(firstResponse.payload);
      const secondResult = JSON.parse(secondResponse.payload);

      expect(firstResult.coefficients).toEqual(secondResult.coefficients);
      expect(firstResult.rSquared).toBe(secondResult.rSquared);
    });

    it('should handle different requests differently', async () => {
      const payload1 = {
        points: [
          { q: 10, h: 90 },
          { q: 20, h: 80 },
          { q: 30, h: 70 },
        ],
        model: 'quadratic',
      };

      const payload2 = {
        points: [
          { q: 10, h: 95 },
          { q: 20, h: 85 },
          { q: 30, h: 75 },
        ],
        model: 'quadratic',
      };

      const response1 = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: payload1,
      });

      const response2 = await app.inject({
        method: 'POST',
        url: '/api/v1/curves/fit',
        payload: payload2,
      });

      expect(response1.statusCode).toBe(200);
      expect(response2.statusCode).toBe(200);

      const result1 = JSON.parse(response1.payload);
      const result2 = JSON.parse(response2.payload);

      // Results should be different
      expect(result1.coefficients).not.toEqual(result2.coefficients);
    });
  });
});
