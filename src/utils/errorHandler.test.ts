import { describe, it, expect, vi } from 'vitest';
import {
  ValidationError,
  CalculationError,
  createValidationError,
  createCalculationError,
  handleError,
} from './errorHandler';

describe('Error Classes', () => {
  it('should create ValidationError with message and details', () => {
    const error = new ValidationError('Invalid input', { field: 'test' });
    expect(error.message).toBe('Invalid input');
    expect(error.name).toBe('ValidationError');
    expect(error.details).toEqual({ field: 'test' });
  });

  it('should create CalculationError with message and details', () => {
    const error = new CalculationError('Calculation failed', {
      reason: 'overflow',
    });
    expect(error.message).toBe('Calculation failed');
    expect(error.name).toBe('CalculationError');
    expect(error.details).toEqual({ reason: 'overflow' });
  });
});

describe('Error Factory Functions', () => {
  it('should create ValidationError using factory function', () => {
    const error = createValidationError('Test validation error', {
      field: 'test',
    });
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.message).toBe('Test validation error');
    expect(error.details).toEqual({ field: 'test' });
  });

  it('should create CalculationError using factory function', () => {
    const error = createCalculationError('Test calculation error', {
      reason: 'test',
    });
    expect(error).toBeInstanceOf(CalculationError);
    expect(error.message).toBe('Test calculation error');
    expect(error.details).toEqual({ reason: 'test' });
  });
});

describe('handleError', () => {
  it('should handle ValidationError with 400 status', () => {
    const mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const error = new ValidationError('Invalid input', { field: 'test' });
    handleError(error, mockReply as any);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Invalid input',
      code: 'VALIDATION_ERROR',
      details: { field: 'test' },
    });
  });

  it('should handle CalculationError with 422 status', () => {
    const mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const error = new CalculationError('Calculation failed', {
      reason: 'overflow',
    });
    handleError(error, mockReply as any);

    expect(mockReply.status).toHaveBeenCalledWith(422);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Calculation failed',
      code: 'CALCULATION_ERROR',
      details: { reason: 'overflow' },
    });
  });

  it('should handle generic Error with 500 status', () => {
    const mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const error = new Error('Generic error');
    handleError(error, mockReply as any);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    });
  });

  it('should handle unknown errors with 500 status', () => {
    const mockReply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    const error = 'String error';
    handleError(error, mockReply as any);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      error: 'Unknown error occurred',
      code: 'UNKNOWN_ERROR',
    });
  });
});
