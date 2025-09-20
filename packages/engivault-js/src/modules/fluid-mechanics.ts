import { EngiVaultClient } from '../client/EngiVaultClient';
import {
  OpenChannelFlowInput,
  OpenChannelFlowResult,
  CompressibleFlowInput,
  CompressibleFlowResult,
  BoundaryLayerInput,
  BoundaryLayerResult,
  ExternalFlowInput,
  ExternalFlowResult,
  NormalShockInput,
  NormalShockResult,
  ChokedFlowInput,
  ChokedFlowResult,
} from '../types';

export class FluidMechanics extends EngiVaultClient {
  /**
   * Calculate open channel flow using Manning's equation
   */
  async openChannelFlow(input: OpenChannelFlowInput): Promise<OpenChannelFlowResult> {
    return this.request('POST', '/api/v1/fluid-mechanics/open-channel-flow', input);
  }

  /**
   * Calculate compressible flow properties using isentropic relations
   */
  async compressibleFlow(input: CompressibleFlowInput): Promise<CompressibleFlowResult> {
    return this.request('POST', '/api/v1/fluid-mechanics/compressible-flow', input);
  }

  /**
   * Calculate boundary layer properties for flat plate
   */
  async boundaryLayer(input: BoundaryLayerInput): Promise<BoundaryLayerResult> {
    return this.request('POST', '/api/v1/fluid-mechanics/boundary-layer', input);
  }

  /**
   * Calculate external flow drag and lift coefficients
   */
  async externalFlow(input: ExternalFlowInput): Promise<ExternalFlowResult> {
    return this.request('POST', '/api/v1/fluid-mechanics/external-flow', input);
  }

  /**
   * Calculate normal shock wave properties
   */
  async normalShock(input: NormalShockInput): Promise<NormalShockResult> {
    return this.request('POST', '/api/v1/fluid-mechanics/normal-shock', input);
  }

  /**
   * Calculate choked flow properties
   */
  async chokedFlow(input: ChokedFlowInput): Promise<ChokedFlowResult> {
    return this.request('POST', '/api/v1/fluid-mechanics/choked-flow', input);
  }
}

// Export for tree-shaking
export {
  OpenChannelFlowInput,
  OpenChannelFlowResult,
  CompressibleFlowInput,
  CompressibleFlowResult,
  BoundaryLayerInput,
  BoundaryLayerResult,
  ExternalFlowInput,
  ExternalFlowResult,
  NormalShockInput,
  NormalShockResult,
  ChokedFlowInput,
  ChokedFlowResult,
} from '../types';
