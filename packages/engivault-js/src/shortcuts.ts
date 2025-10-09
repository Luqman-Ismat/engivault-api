/**
 * EngiVault SDK Convenience Functions
 * 
 * Provides direct function access without needing to instantiate a client.
 * Uses a global client instance that's automatically configured.
 * 
 * @example
 * ```typescript
 * import * as ev from 'engivault';
 * 
 * ev.init('your-api-key');
 * const result = await ev.pressureDrop({
 *   flowRate: 0.01,
 *   pipeDiameter: 0.1,
 *   pipeLength: 100,
 *   fluidDensity: 1000,
 *   fluidViscosity: 0.001
 * });
 * ```
 */

import { EngiVaultClient } from './client/EngiVaultClient';
import { ClientConfig } from './types';

// Global client instance
let globalClient: EngiVaultClient | null = null;

/**
 * Initialize the global EngiVault client
 * 
 * @param apiKey - API key for authentication. If not provided, reads from ENGIVAULT_API_KEY env var
 * @param config - Additional configuration options
 * @returns The initialized global client instance
 * 
 * @example
 * ```typescript
 * import * as ev from 'engivault';
 * 
 * // Simple initialization
 * ev.init('your-api-key');
 * 
 * // With configuration
 * ev.init('your-api-key', {
 *   baseURL: 'https://custom-api.example.com',
 *   timeout: 60000
 * });
 * ```
 */
export function init(apiKey?: string, config?: Omit<ClientConfig, 'apiKey'>): EngiVaultClient {
  globalClient = new EngiVaultClient({
    apiKey,
    ...config
  });
  return globalClient;
}

/**
 * Get the global client instance
 * 
 * @returns The global client instance
 * @throws {Error} If the client hasn't been initialized
 * 
 * @example
 * ```typescript
 * import * as ev from 'engivault';
 * 
 * ev.init('your-api-key');
 * const client = ev.getClient();
 * ```
 */
export function getClient(): EngiVaultClient {
  if (!globalClient) {
    throw new Error(
      'EngiVault client not initialized. ' +
      'Call init("your-api-key") first or set ENGIVAULT_API_KEY environment variable.'
    );
  }
  return globalClient;
}

// ============================================================================
// Hydraulics Functions
// ============================================================================

/**
 * Calculate pressure drop in a pipe
 * 
 * @param params - Pressure drop calculation parameters
 * @returns Pressure drop results
 * 
 * @example
 * ```typescript
 * const result = await ev.pressureDrop({
 *   flowRate: 0.01,
 *   pipeDiameter: 0.1,
 *   pipeLength: 100,
 *   fluidDensity: 1000,
 *   fluidViscosity: 0.001
 * });
 * console.log(`Pressure drop: ${result.pressureDrop} Pa`);
 * ```
 */
export async function pressureDrop(params: {
  flowRate: number;
  pipeDiameter: number;
  pipeLength: number;
  fluidDensity: number;
  fluidViscosity: number;
  pipeRoughness?: number;
}): Promise<any> {
  const client = getClient();
  return client.request('/api/v1/hydraulics/pressure-drop', {
    method: 'POST',
    data: params
  });
}

/**
 * Calculate flow rate from pressure drop
 * 
 * @param params - Flow rate calculation parameters
 * @returns Flow rate results
 */
export async function flowRate(params: {
  pressureDrop: number;
  pipeDiameter: number;
  pipeLength: number;
  fluidDensity: number;
  fluidViscosity: number;
  pipeRoughness?: number;
}): Promise<any> {
  const client = getClient();
  return client.request('/api/v1/hydraulics/flow-rate', {
    method: 'POST',
    data: params
  });
}

// ============================================================================
// Pump Functions
// ============================================================================

/**
 * Calculate pump power requirements
 * 
 * @param params - Pump performance parameters
 * @returns Pump power results
 * 
 * @example
 * ```typescript
 * const result = await ev.pumpPower({
 *   flowRate: 0.05,
 *   head: 50,
 *   efficiency: 0.8,
 *   fluidDensity: 1000
 * });
 * ```
 */
export async function pumpPower(params: {
  flowRate: number;
  head: number;
  efficiency: number;
  fluidDensity?: number;
}): Promise<any> {
  const client = getClient();
  return client.request('/api/v1/pumps/performance', {
    method: 'POST',
    data: params
  });
}

/**
 * Calculate Net Positive Suction Head Available (NPSHA)
 * 
 * @param params - NPSH calculation parameters
 * @returns NPSH results
 */
export async function npsh(params: {
  suctionPressure: number;
  vaporPressure: number;
  fluidDensity: number;
  elevationHead: number;
  velocityHead?: number;
}): Promise<any> {
  const client = getClient();
  return client.request('/api/v1/pumps/npsh', {
    method: 'POST',
    data: params
  });
}

// ============================================================================
// Heat Transfer Functions
// ============================================================================

/**
 * Calculate Log Mean Temperature Difference
 * 
 * @param params - LMTD parameters
 * @returns LMTD results
 * 
 * @example
 * ```typescript
 * const result = await ev.lmtd({
 *   tHotIn: 373,
 *   tHotOut: 323,
 *   tColdIn: 293,
 *   tColdOut: 333,
 *   flowArrangement: 'counterflow'
 * });
 * ```
 */
export async function lmtd(params: {
  tHotIn: number;
  tHotOut: number;
  tColdIn: number;
  tColdOut: number;
  flowArrangement?: 'counterflow' | 'parallel';
}): Promise<any> {
  const client = getClient();
  return client.request('/api/v1/heat-transfer/lmtd', {
    method: 'POST',
    data: params
  });
}

/**
 * Calculate required heat exchanger area
 * 
 * @param params - Heat exchanger parameters
 * @returns Heat exchanger sizing results
 */
export async function heatExchanger(params: {
  heatDuty: number;
  overallU: number;
  tHotIn: number;
  tHotOut: number;
  tColdIn: number;
  tColdOut: number;
  flowArrangement?: 'counterflow' | 'parallel';
}): Promise<any> {
  const client = getClient();
  return client.request('/api/v1/heat-transfer/heat-exchanger-area', {
    method: 'POST',
    data: params
  });
}

// ============================================================================
// Fluid Mechanics Functions
// ============================================================================

/**
 * Calculate open channel flow properties
 * 
 * @param params - Open channel flow parameters
 * @returns Open channel flow results
 * 
 * @example
 * ```typescript
 * const result = await ev.openChannelFlow({
 *   flowRate: 10.0,
 *   channelWidth: 5.0,
 *   channelSlope: 0.001,
 *   manningSCoeff: 0.03,
 *   channelShape: 'rectangular'
 * });
 * ```
 */
export async function openChannelFlow(params: {
  flowRate: number;
  channelWidth: number;
  channelSlope: number;
  manningSCoeff: number;
  channelShape?: string;
}): Promise<any> {
  const client = getClient();
  return client.request('/api/v1/fluid-mechanics/open-channel-flow', {
    method: 'POST',
    data: params
  });
}

