import { EngiVaultClient } from '../client/EngiVaultClient';
import {
  HeatExchangerInput,
  HeatExchangerResult,
  LMTDInput,
  LMTDResult,
  EffectivenessNTUInput,
  EffectivenessNTUResult,
  ConvectionInput,
  ConvectionResult,
  FinInput,
  FinResult,
  ThermalResistanceInput,
  ThermalResistanceResult,
  OverallUInput,
  OverallUResult,
} from '../types';

export class HeatTransfer extends EngiVaultClient {
  /**
   * Calculate heat exchanger area using LMTD method
   */
  async heatExchangerArea(input: HeatExchangerInput): Promise<HeatExchangerResult> {
    return this.request('POST', '/api/v1/heat-transfer/heat-exchanger-area', input);
  }

  /**
   * Calculate Log Mean Temperature Difference (LMTD)
   */
  async lmtd(input: LMTDInput): Promise<LMTDResult> {
    return this.request('POST', '/api/v1/heat-transfer/lmtd', input);
  }

  /**
   * Calculate heat exchanger effectiveness using NTU method
   */
  async effectivenessNTU(input: EffectivenessNTUInput): Promise<EffectivenessNTUResult> {
    return this.request('POST', '/api/v1/heat-transfer/effectiveness-ntu', input);
  }

  /**
   * Calculate convective heat transfer coefficient
   */
  async convection(input: ConvectionInput): Promise<ConvectionResult> {
    return this.request('POST', '/api/v1/heat-transfer/convection', input);
  }

  /**
   * Calculate fin efficiency, effectiveness, and heat transfer rate
   */
  async finAnalysis(input: FinInput): Promise<FinResult> {
    return this.request('POST', '/api/v1/heat-transfer/fin-analysis', input);
  }

  /**
   * Calculate thermal resistance network for multi-layer systems
   */
  async thermalResistance(input: ThermalResistanceInput): Promise<ThermalResistanceResult> {
    return this.request('POST', '/api/v1/heat-transfer/thermal-resistance', input);
  }

  /**
   * Calculate overall heat transfer coefficient for cylindrical systems
   */
  async overallU(input: OverallUInput): Promise<OverallUResult> {
    return this.request('POST', '/api/v1/heat-transfer/overall-u', input);
  }
}

// Export for tree-shaking
export {
  HeatExchangerInput,
  HeatExchangerResult,
  LMTDInput,
  LMTDResult,
  EffectivenessNTUInput,
  EffectivenessNTUResult,
  ConvectionInput,
  ConvectionResult,
  FinInput,
  FinResult,
  ThermalResistanceInput,
  ThermalResistanceResult,
  OverallUInput,
  OverallUResult,
} from '../types';
