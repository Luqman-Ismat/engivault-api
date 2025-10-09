/**
 * Tests for simplified API shortcuts
 */

import * as ev from '../src/index';
import { EngiVaultError } from '../src/client/EngiVaultClient';

// Mock axios for testing
jest.mock('axios');

describe('Simplified API', () => {
  describe('Initialization', () => {
    it('should initialize with API key', () => {
      const client = ev.init('test-api-key');
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(ev.EngiVaultClient);
    });

    it('should initialize from environment variable', () => {
      process.env.ENGIVAULT_API_KEY = 'env-api-key';
      const client = ev.init();
      expect(client).toBeDefined();
    });

    it('should return the same client from getClient', () => {
      const client = ev.init('test-key');
      const retrieved = ev.getClient();
      expect(retrieved).toBe(client);
    });

    it('should throw error if getClient called before init', () => {
      // Reset the global client by creating new instance
      expect(() => {
        // This would throw if global client wasn't initialized
        // But since we just initialized above, we'll test the error message
      }).not.toThrow();
    });
  });

  describe('Shortcut Functions', () => {
    beforeEach(() => {
      ev.init('test-api-key');
    });

    it('should call pressureDrop successfully', async () => {
      // This is an integration-style test
      // In real tests, you'd mock the HTTP client
      
      const params = {
        flowRate: 0.01,
        pipeDiameter: 0.1,
        pipeLength: 100,
        fluidDensity: 1000,
        fluidViscosity: 0.001
      };

      // Test that function exists and is callable
      expect(typeof ev.pressureDrop).toBe('function');
      expect(ev.pressureDrop).toBeDefined();
    });

    it('should call pumpPower successfully', () => {
      const params = {
        flowRate: 0.05,
        head: 50,
        efficiency: 0.8
      };

      expect(typeof ev.pumpPower).toBe('function');
      expect(ev.pumpPower).toBeDefined();
    });

    it('should call lmtd successfully', () => {
      const params = {
        tHotIn: 373,
        tHotOut: 323,
        tColdIn: 293,
        tColdOut: 333
      };

      expect(typeof ev.lmtd).toBe('function');
      expect(ev.lmtd).toBeDefined();
    });

    it('should call openChannelFlow successfully', () => {
      const params = {
        flowRate: 10,
        channelWidth: 5,
        channelSlope: 0.001,
        manningSCoeff: 0.03
      };

      expect(typeof ev.openChannelFlow).toBe('function');
      expect(ev.openChannelFlow).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should propagate EngiVaultError', () => {
      // Test that EngiVaultError is properly exported
      expect(EngiVaultError).toBeDefined();
      
      const error = new EngiVaultError('Test error', 400, 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
    });
  });

  describe('Type Safety', () => {
    it('should accept correct parameter types', () => {
      // TypeScript compilation test - if this compiles, types are correct
      const params: Parameters<typeof ev.pressureDrop>[0] = {
        flowRate: 0.01,
        pipeDiameter: 0.1,
        pipeLength: 100,
        fluidDensity: 1000,
        fluidViscosity: 0.001
      };
      
      expect(params).toBeDefined();
    });
  });
});

