import { describe, it, expect } from 'vitest';
import {
  processBatchOrSingle,
  isBatchRequest,
  isSingleRequest,
} from './batchProcessor';

describe('Batch Processor', () => {
  // Mock calculator function for testing
  const mockCalculator = (input: any) => {
    if (input.value < 0) {
      throw new Error('Value must be positive');
    }
    return { result: input.value * 2, input };
  };

  // Mock reply object
  const mockReply = {} as any;

  describe('processBatchOrSingle', () => {
    it('should process single item request', async () => {
      const singlePayload = { value: 5 };

      const result = await processBatchOrSingle(
        singlePayload,
        mockCalculator,
        mockReply
      );

      expect(result).toEqual({
        result: 10,
        input: { value: 5 },
      });
    });

    it('should process batch request with all valid items', async () => {
      const batchPayload = {
        items: [{ value: 1 }, { value: 2 }, { value: 3 }],
      };

      const result = await processBatchOrSingle(
        batchPayload,
        mockCalculator,
        mockReply
      );

      expect(result.results).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.results[0]).toEqual({ result: 2, input: { value: 1 } });
      expect(result.results[1]).toEqual({ result: 4, input: { value: 2 } });
      expect(result.results[2]).toEqual({ result: 6, input: { value: 3 } });
    });

    it('should process batch request with mixed success/failure', async () => {
      const batchPayload = {
        items: [
          { value: 1 }, // Valid
          { value: -1 }, // Invalid - will throw error
          { value: 3 }, // Valid
        ],
      };

      const result = await processBatchOrSingle(
        batchPayload,
        mockCalculator,
        mockReply
      );

      expect(result.results).toHaveLength(3);
      expect(result.errors).toHaveLength(1);
      expect(result.results[0]).toEqual({ result: 2, input: { value: 1 } });
      expect(result.results[1]).toBeNull(); // Failed item
      expect(result.results[2]).toEqual({ result: 6, input: { value: 3 } });

      expect(result.errors[0]).toEqual({
        index: 1,
        error: 'Value must be positive',
      });
    });

    it('should process batch request with all invalid items', async () => {
      const batchPayload = {
        items: [
          { value: -1 }, // Invalid
          { value: -2 }, // Invalid
        ],
      };

      const result = await processBatchOrSingle(
        batchPayload,
        mockCalculator,
        mockReply
      );

      expect(result.results).toHaveLength(2);
      expect(result.errors).toHaveLength(2);
      expect(result.results[0]).toBeNull();
      expect(result.results[1]).toBeNull();

      expect(result.errors[0]).toEqual({
        index: 0,
        error: 'Value must be positive',
      });
      expect(result.errors[1]).toEqual({
        index: 1,
        error: 'Value must be positive',
      });
    });

    it('should process empty batch request', async () => {
      const batchPayload = {
        items: [],
      };

      const result = await processBatchOrSingle(
        batchPayload,
        mockCalculator,
        mockReply
      );

      expect(result.results).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle calculator throwing non-Error objects', async () => {
      const batchPayload = {
        items: [
          { value: 1 },
          { value: 'invalid' }, // Will cause calculator to throw string
        ],
      };

      const calculatorWithStringError = (input: any) => {
        if (typeof input.value !== 'number') {
          throw 'Invalid input type'; // String error
        }
        return { result: input.value * 2, input };
      };

      const result = await processBatchOrSingle(
        batchPayload,
        calculatorWithStringError,
        mockReply
      );

      expect(result.results).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.results[0]).toEqual({ result: 2, input: { value: 1 } });
      expect(result.results[1]).toBeNull();

      expect(result.errors[0]).toEqual({
        index: 1,
        error: 'Invalid input type',
      });
    });
  });

  describe('isBatchRequest', () => {
    it('should return true for valid batch request', () => {
      const batchPayload = {
        items: [{ value: 1 }, { value: 2 }],
      };

      expect(isBatchRequest(batchPayload)).toBe(true);
    });

    it('should return false for single item request', () => {
      const singlePayload = { value: 1 };

      expect(isBatchRequest(singlePayload)).toBe(false);
    });

    it('should return false for empty items array', () => {
      const emptyBatchPayload = {
        items: [],
      };

      expect(isBatchRequest(emptyBatchPayload)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isBatchRequest(null)).toBe(false);
      expect(isBatchRequest(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isBatchRequest('string')).toBe(false);
      expect(isBatchRequest(123)).toBe(false);
      expect(isBatchRequest(true)).toBe(false);
    });
  });

  describe('isSingleRequest', () => {
    it('should return true for single item request', () => {
      const singlePayload = { value: 1 };

      expect(isSingleRequest(singlePayload)).toBe(true);
    });

    it('should return false for batch request', () => {
      const batchPayload = {
        items: [{ value: 1 }, { value: 2 }],
      };

      expect(isSingleRequest(batchPayload)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isSingleRequest(null)).toBe(false);
      expect(isSingleRequest(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isSingleRequest('string')).toBe(false);
      expect(isSingleRequest(123)).toBe(false);
      expect(isSingleRequest(true)).toBe(false);
    });
  });
});
