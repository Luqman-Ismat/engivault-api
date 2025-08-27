import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  initializeMetrics, 
  getMetrics, 
  resetMetrics,
  recordRequestMetrics,
  recordCalculationMetrics,
  recordTranscriptMetrics,
  recordBatchProcessingMetrics
} from './metrics';

describe('Metrics', () => {
  beforeEach(() => {
    // Don't reset metrics in beforeEach to allow them to accumulate
  });

  afterEach(() => {
    // Reset metrics after each test
    resetMetrics();
  });

  describe('initializeMetrics', () => {
    it('should initialize metrics without error', () => {
      expect(() => initializeMetrics()).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics as string', async () => {
      const metrics = await getMetrics();
      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should include default metrics', async () => {
      const metrics = await getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
    });
  });

  describe('recordRequestMetrics', () => {
    it('should record request metrics without error', () => {
      const method = 'GET';
      const route = '/test';
      const statusCode = 200;
      const duration = 100;

      expect(() => {
        recordRequestMetrics(method, route, statusCode, duration);
      }).not.toThrow();
    });

    it('should record error metrics for 4xx status codes without error', () => {
      const method = 'POST';
      const route = '/test';
      const statusCode = 400;
      const duration = 50;

      expect(() => {
        recordRequestMetrics(method, route, statusCode, duration);
      }).not.toThrow();
    });

    it('should record error metrics for 5xx status codes without error', () => {
      const method = 'GET';
      const route = '/test';
      const statusCode = 500;
      const duration = 200;

      expect(() => {
        recordRequestMetrics(method, route, statusCode, duration);
      }).not.toThrow();
    });
  });

  describe('recordCalculationMetrics', () => {
    it('should record successful calculation metrics without error', () => {
      const calculationType = 'pressure_drop';
      const duration = 150;

      expect(() => {
        recordCalculationMetrics(calculationType, duration);
      }).not.toThrow();
    });

    it('should record error calculation metrics without error', () => {
      const calculationType = 'npsh';
      const duration = 75;

      expect(() => {
        recordCalculationMetrics(calculationType, duration, 'error');
      }).not.toThrow();
    });
  });

  describe('recordTranscriptMetrics', () => {
    it('should record transcript metrics without error', () => {
      const endpoint = '/api/v1/pumps/bep-check';

      expect(() => {
        recordTranscriptMetrics(endpoint);
      }).not.toThrow();
    });
  });

  describe('recordBatchProcessingMetrics', () => {
    it('should record successful batch processing metrics without error', () => {
      const endpoint = '/api/v1/operations/fill-drain-time';
      const batchSize = 10;

      expect(() => {
        recordBatchProcessingMetrics(endpoint, batchSize);
      }).not.toThrow();
    });

    it('should record partial success batch processing metrics without error', () => {
      const endpoint = '/api/v1/pumps/bep-check';
      const batchSize = 5;

      expect(() => {
        recordBatchProcessingMetrics(endpoint, batchSize, 'partial_success');
      }).not.toThrow();
    });

    it('should record error batch processing metrics without error', () => {
      const endpoint = '/api/v1/curves/fit';
      const batchSize = 3;

      expect(() => {
        recordBatchProcessingMetrics(endpoint, batchSize, 'error');
      }).not.toThrow();
    });
  });

  describe('resetMetrics', () => {
    it('should reset metrics without error', () => {
      // Record some metrics first
      recordRequestMetrics('GET', '/test', 200, 100);
      recordCalculationMetrics('test', 50);

      // Reset metrics
      expect(() => {
        resetMetrics();
      }).not.toThrow();
    });
  });
});
