/**
 * EngiVault Custom Functions for Excel
 * 
 * These functions can be used directly in Excel formulas:
 * =ENGIVAULT.PRESSUREDROP(flowRate, diameter, length, density, viscosity)
 * =ENGIVAULT.PUMPPOWER(flowRate, head, efficiency)
 * =ENGIVAULT.LMTD(hotIn, hotOut, coldIn, coldOut, "counterflow")
 */

/// <reference types="@types/office-js" />
/// <reference types="@types/office-runtime" />

interface EngiVaultConfig {
  apiKey: string;
  baseURL: string;
}

// Configuration stored in CustomPropertyManager
const DEFAULT_BASE_URL = 'https://engivault-api.railway.app';

/**
 * Helper function to get API configuration
 */
async function getConfig(): Promise<EngiVaultConfig> {
  const apiKey = (OfficeRuntime.storage as any).getItem('ENGIVAULT_API_KEY') || '';
  const baseURL = (OfficeRuntime.storage as any).getItem('ENGIVAULT_BASE_URL') || DEFAULT_BASE_URL;
  
  if (!apiKey) {
    throw new Error('API key not set. Please configure in the task pane.');
  }
  
  return { apiKey, baseURL };
}

/**
 * Helper function to make API requests
 */
async function apiRequest(endpoint: string, data: any): Promise<any> {
  const config = await getConfig();
  
  const response = await fetch(`${config.baseURL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  
  const result = await response.json();
  return result.data || result;
}

// ============================================================================
// PRESSURE DROP CALCULATIONS
// ============================================================================

/**
 * Calculate pressure drop in a pipe
 * @customfunction ENGIVAULT.PRESSUREDROP
 * @param flowRate Volumetric flow rate (m³/s)
 * @param diameter Pipe diameter (m)
 * @param length Pipe length (m)
 * @param density Fluid density (kg/m³)
 * @param viscosity Dynamic viscosity (Pa·s)
 * @param roughness Pipe roughness (m) - optional, defaults to commercial steel
 * @returns Pressure drop in Pascals
 */
export async function pressureDrop(
  flowRate: number,
  diameter: number,
  length: number,
  density: number,
  viscosity: number,
  roughness?: number
): Promise<number> {
  try {
    const result = await apiRequest('/api/v1/hydraulics/pressure-drop', {
      flowRate,
      pipeDiameter: diameter,
      pipeLength: length,
      fluidDensity: density,
      fluidViscosity: viscosity,
      pipeRoughness: roughness || 4.6e-5
    });
    return result.pressureDrop;
  } catch (error: any) {
    throw new Error(`PRESSURE_DROP Error: ${error.message}`);
  }
}

/**
 * Calculate flow velocity in a pipe
 * @customfunction ENGIVAULT.VELOCITY
 * @param flowRate Volumetric flow rate (m³/s)
 * @param diameter Pipe diameter (m)
 * @returns Velocity in m/s
 */
export function velocity(flowRate: number, diameter: number): number {
  const area = Math.PI * Math.pow(diameter / 2, 2);
  return flowRate / area;
}

/**
 * Calculate Reynolds number
 * @customfunction ENGIVAULT.REYNOLDS
 * @param flowRate Volumetric flow rate (m³/s)
 * @param diameter Pipe diameter (m)
 * @param density Fluid density (kg/m³)
 * @param viscosity Dynamic viscosity (Pa·s)
 * @returns Reynolds number (dimensionless)
 */
export function reynolds(
  flowRate: number,
  diameter: number,
  density: number,
  viscosity: number
): number {
  const vel = velocity(flowRate, diameter);
  return (density * vel * diameter) / viscosity;
}

// ============================================================================
// PUMP CALCULATIONS
// ============================================================================

/**
 * Calculate pump hydraulic power
 * @customfunction ENGIVAULT.PUMPPOWER
 * @param flowRate Volumetric flow rate (m³/s)
 * @param head Total head (m)
 * @param efficiency Pump efficiency (0-1)
 * @param density Fluid density (kg/m³) - optional, defaults to water (1000)
 * @returns Shaft power in Watts
 */
export async function pumpPower(
  flowRate: number,
  head: number,
  efficiency: number,
  density?: number
): Promise<number> {
  try {
    const result = await apiRequest('/api/v1/pumps/performance', {
      flowRate,
      head,
      efficiency,
      fluidDensity: density || 1000
    });
    return result.shaftPower;
  } catch (error: any) {
    throw new Error(`PUMP_POWER Error: ${error.message}`);
  }
}

/**
 * Calculate Net Positive Suction Head Available
 * @customfunction ENGIVAULT.NPSHA
 * @param suctionPressure Suction pressure (Pa)
 * @param vaporPressure Vapor pressure (Pa)
 * @param density Fluid density (kg/m³)
 * @param elevationHead Elevation from fluid surface to pump (m)
 * @param velocityHead Velocity head in suction line (m) - optional
 * @returns NPSHA in meters
 */
export async function npsha(
  suctionPressure: number,
  vaporPressure: number,
  density: number,
  elevationHead: number,
  velocityHead?: number
): Promise<number> {
  try {
    const result = await apiRequest('/api/v1/pumps/npsh', {
      suctionPressure,
      vaporPressure,
      fluidDensity: density,
      elevationHead,
      velocityHead: velocityHead || 0
    });
    return result.npsha;
  } catch (error: any) {
    throw new Error(`NPSHA Error: ${error.message}`);
  }
}

// ============================================================================
// HEAT TRANSFER CALCULATIONS
// ============================================================================

/**
 * Calculate Log Mean Temperature Difference
 * @customfunction ENGIVAULT.LMTD
 * @param hotIn Hot fluid inlet temperature (K or °C)
 * @param hotOut Hot fluid outlet temperature (K or °C)
 * @param coldIn Cold fluid inlet temperature (K or °C)
 * @param coldOut Cold fluid outlet temperature (K or °C)
 * @param arrangement Flow arrangement: "counterflow" or "parallel"
 * @returns LMTD in Kelvin
 */
export async function lmtd(
  hotIn: number,
  hotOut: number,
  coldIn: number,
  coldOut: number,
  arrangement?: string
): Promise<number> {
  try {
    const result = await apiRequest('/api/v1/heat-transfer/lmtd', {
      tHotIn: hotIn,
      tHotOut: hotOut,
      tColdIn: coldIn,
      tColdOut: coldOut,
      flowArrangement: arrangement || 'counterflow'
    });
    return result.lmtd;
  } catch (error: any) {
    throw new Error(`LMTD Error: ${error.message}`);
  }
}

/**
 * Calculate required heat exchanger area
 * @customfunction ENGIVAULT.HXAREA
 * @param heatDuty Heat transfer rate (W)
 * @param overallU Overall heat transfer coefficient (W/m²·K)
 * @param hotIn Hot fluid inlet temperature (K)
 * @param hotOut Hot fluid outlet temperature (K)
 * @param coldIn Cold fluid inlet temperature (K)
 * @param coldOut Cold fluid outlet temperature (K)
 * @returns Required area in m²
 */
export async function hxArea(
  heatDuty: number,
  overallU: number,
  hotIn: number,
  hotOut: number,
  coldIn: number,
  coldOut: number
): Promise<number> {
  try {
    const result = await apiRequest('/api/v1/heat-transfer/heat-exchanger-area', {
      heatDuty,
      overallU,
      tHotIn: hotIn,
      tHotOut: hotOut,
      tColdIn: coldIn,
      tColdOut: coldOut,
      flowArrangement: 'counterflow'
    });
    return result.area;
  } catch (error: any) {
    throw new Error(`HX_AREA Error: ${error.message}`);
  }
}

// ============================================================================
// FLUID PROPERTIES
// ============================================================================

/**
 * Get water density at temperature
 * @customfunction ENGIVAULT.WATERDENSITY
 * @param temperature Temperature in Celsius
 * @returns Density in kg/m³
 */
export function waterDensity(temperature: number): number {
  // Simplified correlation for water density
  return 1000 - 0.1 * (temperature - 20) - 0.003 * Math.pow(temperature - 20, 2);
}

/**
 * Get water viscosity at temperature
 * @customfunction ENGIVAULT.WATERVISCOSITY
 * @param temperature Temperature in Celsius
 * @returns Dynamic viscosity in Pa·s
 */
export function waterViscosity(temperature: number): number {
  // Simplified Vogel equation for water viscosity
  const A = 0.02414;
  const B = 247.8;
  const C = 140;
  const T = temperature + 273.15; // Convert to Kelvin
  return A * Math.pow(10, B / (T - C)) / 1000;
}

// ============================================================================
// UNIT CONVERSIONS
// ============================================================================

/**
 * Convert flow rate between units
 * @customfunction ENGIVAULT.CONVERTFLOW
 * @param value Flow rate value
 * @param fromUnit From unit: "m3/s", "m3/h", "L/s", "L/min", "gpm", "gph"
 * @param toUnit To unit: "m3/s", "m3/h", "L/s", "L/min", "gpm", "gph"
 * @returns Converted flow rate
 */
export function convertFlow(value: number, fromUnit: string, toUnit: string): number {
  // Convert to m3/s first
  const toM3s: { [key: string]: number } = {
    'm3/s': 1,
    'm3/h': 1/3600,
    'L/s': 0.001,
    'L/min': 0.001/60,
    'gpm': 6.30902e-5,
    'gph': 1.05150e-6
  };
  
  const m3s = value * (toM3s[fromUnit] || 1);
  return m3s / (toM3s[toUnit] || 1);
}

/**
 * Convert pressure between units
 * @customfunction ENGIVAULT.CONVERTPRESSURE
 * @param value Pressure value
 * @param fromUnit From unit: "Pa", "kPa", "MPa", "bar", "psi", "atm"
 * @param toUnit To unit: "Pa", "kPa", "MPa", "bar", "psi", "atm"
 * @returns Converted pressure
 */
export function convertPressure(value: number, fromUnit: string, toUnit: string): number {
  // Convert to Pa first
  const toPa: { [key: string]: number } = {
    'Pa': 1,
    'kPa': 1000,
    'MPa': 1000000,
    'bar': 100000,
    'psi': 6894.76,
    'atm': 101325
  };
  
  const pa = value * (toPa[fromUnit] || 1);
  return pa / (toPa[toUnit] || 1);
}

// Register all custom functions
CustomFunctions.associate("PRESSUREDROP", pressureDrop);
CustomFunctions.associate("VELOCITY", velocity);
CustomFunctions.associate("REYNOLDS", reynolds);
CustomFunctions.associate("PUMPPOWER", pumpPower);
CustomFunctions.associate("NPSHA", npsha);
CustomFunctions.associate("LMTD", lmtd);
CustomFunctions.associate("HXAREA", hxArea);
CustomFunctions.associate("WATERDENSITY", waterDensity);
CustomFunctions.associate("WATERVISCOSITY", waterViscosity);
CustomFunctions.associate("CONVERTFLOW", convertFlow);
CustomFunctions.associate("CONVERTPRESSURE", convertPressure);

