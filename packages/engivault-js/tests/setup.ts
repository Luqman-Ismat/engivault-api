// Test setup file
import { jest } from '@jest/globals';

// Mock environment variables
process.env.ENGIVAULT_API_KEY = 'test-api-key';
process.env.ENGIVAULT_BASE_URL = 'https://test.engivault.com';

// Global test timeout
jest.setTimeout(10000);
