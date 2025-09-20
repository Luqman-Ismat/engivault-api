// Base types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
  };
  timestamp: string;
}

export interface ClientConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
}

// Fluid Mechanics Types
export interface OpenChannelFlowInput {
  flowRate: number;
  channelWidth: number;
  channelSlope: number;
  manningSCoeff: number;
  channelShape?: 'rectangular' | 'trapezoidal' | 'circular';
  sideSlope?: number;
}

export interface OpenChannelFlowResult {
  normalDepth: number;
  criticalDepth: number;
  velocity: number;
  froudeNumber: number;
  flowRegime: string;
  hydraulicRadius: number;
  wettedPerimeter: number;
  topWidth: number;
}

export interface CompressibleFlowInput {
  machNumber?: number;
  velocity?: number;
  temperature: number;
  pressure: number;
  gasProperties: {
    gamma: number;
    gasConstant: number;
    molecularWeight: number;
  };
  flowType?: 'isentropic' | 'fanno' | 'rayleigh';
}

export interface CompressibleFlowResult {
  machNumber: number;
  velocity: number;
  speedOfSound: number;
  stagnationTemperature: number;
  stagnationPressure: number;
  density: number;
  flowRegime: string;
  pressureRatio: number;
  temperatureRatio: number;
  densityRatio: number;
}

export interface BoundaryLayerInput {
  velocity: number;
  distance: number;
  fluidProperties: {
    density: number;
    viscosity: number;
    kinematicViscosity: number;
  };
  surfaceRoughness?: number;
  plateLength?: number;
}

export interface BoundaryLayerResult {
  reynoldsNumber: number;
  boundaryLayerThickness: number;
  displacementThickness: number;
  momentumThickness: number;
  skinFrictionCoefficient: number;
  wallShearStress: number;
  flowRegime: string;
}

export interface ExternalFlowInput {
  velocity: number;
  characteristicLength: number;
  fluidProperties: {
    density: number;
    viscosity: number;
  };
  geometry: 'sphere' | 'cylinder' | 'flat_plate' | 'airfoil';
  angleOfAttack?: number;
}

export interface ExternalFlowResult {
  reynoldsNumber: number;
  dragCoefficient: number;
  liftCoefficient?: number;
  dragForce: number;
  liftForce?: number;
  pressureCoefficient: number;
}

export interface NormalShockInput {
  machNumber1: number;
  gamma?: number;
}

export interface NormalShockResult {
  machNumber2: number;
  pressureRatio: number;
  densityRatio: number;
  temperatureRatio: number;
  stagnationPressureRatio: number;
}

export interface ChokedFlowInput {
  stagnationTemperature: number;
  stagnationPressure: number;
  gamma?: number;
  gasConstant?: number;
}

export interface ChokedFlowResult {
  criticalTemperature: number;
  criticalPressure: number;
  criticalDensity: number;
  criticalVelocity: number;
  massFlowRate: number;
}

// Heat Transfer Types
export interface HeatExchangerInput {
  heatDuty: number;
  overallU: number;
  tHotIn: number;
  tHotOut: number;
  tColdIn: number;
  tColdOut: number;
  flowArrangement?: 'counterflow' | 'parallel' | 'crossflow';
}

export interface HeatExchangerResult {
  area: number;
  lmtd: number;
  effectiveness: number;
  ntu: number;
  capacityRatio: number;
}

export interface LMTDInput {
  tHotIn: number;
  tHotOut: number;
  tColdIn: number;
  tColdOut: number;
  flowArrangement?: 'counterflow' | 'parallel';
}

export interface LMTDResult {
  lmtd: number;
}

export interface EffectivenessNTUInput {
  ntu: number;
  capacityRatio: number;
  flowArrangement: 'counterflow' | 'parallel' | 'crossflow_unmixed';
}

export interface EffectivenessNTUResult {
  effectiveness: number;
  maxHeatTransfer: number;
}

export interface ConvectionInput {
  fluidVelocity: number;
  characteristicLength: number;
  fluidProperties: {
    density: number;
    viscosity: number;
    thermalConductivity: number;
    specificHeat: number;
  };
  surfaceTemperature: number;
  fluidTemperature: number;
  geometry: 'flat_plate' | 'cylinder' | 'sphere' | 'tube_internal' | 'tube_external';
}

export interface ConvectionResult {
  reynoldsNumber: number;
  prandtlNumber: number;
  nusseltNumber: number;
  heatTransferCoefficient: number;
}

export interface FinInput {
  finLength: number;
  finThickness: number;
  finWidth: number;
  thermalConductivity: number;
  heatTransferCoefficient: number;
  baseTemperature: number;
  ambientTemperature: number;
}

export interface FinResult {
  finEfficiency: number;
  finEffectiveness: number;
  heatTransferRate: number;
  tipTemperature: number;
}

export interface ThermalResistanceInput {
  layers: Array<{
    thickness: number;
    thermalConductivity: number;
    area: number;
  }>;
  convectionResistances?: Array<{
    heatTransferCoefficient: number;
    area: number;
  }>;
}

export interface ThermalResistanceResult {
  totalResistance: number;
  conductionResistances: number[];
  convectionResistances: number[];
  heatTransferRate: number;
}

export interface OverallUInput {
  innerRadius: number;
  outerRadius: number;
  wallThermalConductivity: number;
  innerHTC: number;
  outerHTC: number;
  foulingFactorInner?: number;
  foulingFactorOuter?: number;
}

export interface OverallUResult {
  overallU: number;
}
