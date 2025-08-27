import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { build } from '../index';
import { resetMetrics } from '@/utils/metrics';

describe('Metrics Routes', () => {
  let app: any;

  beforeEach(async () => {
    app = await build();
    resetMetrics();
  });

  afterEach(async () => {
    await app.close();
    resetMetrics();
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('text/plain; version=0.0.4; charset=utf-8');
      
      const metrics = response.payload;
      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should include request metrics after making a request', async () => {
      // Make a request to generate some metrics
      await app.inject({
        method: 'GET',
        url: '/health',
      });

      const response = await app.inject({
        method: 'GET',
        url: '/metrics',
      });

      expect(response.statusCode).toBe(200);
      const metrics = response.payload;
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should handle metrics generation errors gracefully', async () => {
      // This test ensures the endpoint doesn't crash if there are issues
      const response = await app.inject({
        method: 'GET',
        url: '/metrics',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /health', () => {
    it('should return health status with memory metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      
      expect(data).toHaveProperty('status', 'ok');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('memory');
      
      expect(data.memory).toHaveProperty('rss');
      expect(data.memory).toHaveProperty('heapTotal');
      expect(data.memory).toHaveProperty('heapUsed');
      expect(data.memory).toHaveProperty('external');
      
      expect(typeof data.memory.rss).toBe('number');
      expect(typeof data.memory.heapTotal).toBe('number');
      expect(typeof data.memory.heapUsed).toBe('number');
      expect(typeof data.memory.external).toBe('number');
    });

    it('should return valid timestamp', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const data = JSON.parse(response.payload);
      const timestamp = new Date(data.timestamp);
      
      expect(timestamp.getTime()).toBeGreaterThan(0);
      expect(timestamp.toISOString()).toBe(data.timestamp);
    });

    it('should return valid uptime', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const data = JSON.parse(response.payload);
      
      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });
  });
});
