import { EngiVault, EngiVaultError } from '../src';

describe('EngiVault Client', () => {
  let client: EngiVault;

  beforeEach(() => {
    client = new EngiVault({
      apiKey: 'test-key',
      baseURL: 'https://test.engivault.com'
    });
  });

  describe('Configuration', () => {
    it('should create client with default config', () => {
      const defaultClient = new EngiVault();
      const config = defaultClient.getConfig();
      
      expect(config.baseURL).toBeDefined();
      expect(typeof config.hasApiKey).toBe('boolean');
    });

    it('should create client with custom config', () => {
      const config = client.getConfig();
      
      expect(config.baseURL).toBe('https://test.engivault.com');
      expect(config.hasApiKey).toBe(true);
    });

    it('should set API key dynamically', () => {
      client.clearApiKey();
      expect(client.getConfig().hasApiKey).toBe(false);
      
      client.setApiKey('new-key');
      expect(client.getConfig().hasApiKey).toBe(true);
    });
  });

  describe('Module Initialization', () => {
    it('should initialize fluid mechanics module', () => {
      expect(client.fluidMechanics).toBeDefined();
      expect(typeof client.fluidMechanics.openChannelFlow).toBe('function');
    });

    it('should initialize heat transfer module', () => {
      expect(client.heatTransfer).toBeDefined();
      expect(typeof client.heatTransfer.lmtd).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should create EngiVaultError with correct properties', () => {
      const error = new EngiVaultError('Test error', 400, 'TEST_ERROR');
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('EngiVaultError');
    });
  });
});
