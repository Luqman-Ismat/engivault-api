// Main client
export { EngiVaultClient, EngiVaultError } from './client/EngiVaultClient';

// Specialized modules
export { FluidMechanics } from './modules/fluid-mechanics';
export { HeatTransfer } from './modules/heat-transfer';

// All types
export * from './types';

// Main unified client class
import { EngiVaultClient } from './client/EngiVaultClient';
import { FluidMechanics } from './modules/fluid-mechanics';
import { HeatTransfer } from './modules/heat-transfer';
import { ClientConfig } from './types';

export class EngiVault extends EngiVaultClient {
  public readonly fluidMechanics: FluidMechanics;
  public readonly heatTransfer: HeatTransfer;

  constructor(config: ClientConfig = {}) {
    super(config);
    
    // Create specialized module instances that share the same configuration
    this.fluidMechanics = new FluidMechanics(config);
    this.heatTransfer = new HeatTransfer(config);
  }

  // Override setApiKey to update all modules
  setApiKey(apiKey: string): void {
    super.setApiKey(apiKey);
    this.fluidMechanics.setApiKey(apiKey);
    this.heatTransfer.setApiKey(apiKey);
  }

  // Override clearApiKey to update all modules
  clearApiKey(): void {
    super.clearApiKey();
    this.fluidMechanics.clearApiKey();
    this.heatTransfer.clearApiKey();
  }
}

// Default export
export default EngiVault;

// Convenience factory function
export function createClient(config: ClientConfig = {}): EngiVault {
  return new EngiVault(config);
}

// Version
export const VERSION = '1.0.0';
