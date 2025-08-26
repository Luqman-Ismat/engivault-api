import { Quantity } from '@/schemas/common';

// Unit conversion factors and offsets (for affine conversions like temperature)
interface UnitConversion {
  factor: number;
  offset: number; // For affine conversions (e.g., temperature)
}

// Unit conversion map
const UNIT_CONVERSIONS: Record<string, UnitConversion> = {
  // Length
  m: { factor: 1, offset: 0 },
  ft: { factor: 0.3048, offset: 0 },

  // Diameter
  in: { factor: 0.0254, offset: 0 },

  // Area
  'm²': { factor: 1, offset: 0 },
  'ft²': { factor: 0.092903, offset: 0 },
  'in²': { factor: 0.00064516, offset: 0 },

  // Pressure
  Pa: { factor: 1, offset: 0 },
  kPa: { factor: 1000, offset: 0 },
  psi: { factor: 6894.76, offset: 0 },
  psia: { factor: 6894.76, offset: 0 }, // Pounds per square inch absolute
  bar: { factor: 100000, offset: 0 },

  // Density
  'kg/m³': { factor: 1, offset: 0 },
  'lb/ft³': { factor: 16.0185, offset: 0 },

  // Viscosity
  'Pa·s': { factor: 1, offset: 0 },
  cP: { factor: 0.001, offset: 0 },

  // Volume
  'm³': { factor: 1, offset: 0 },
  'L': { factor: 0.001, offset: 0 },
  gal: { factor: 0.00378541, offset: 0 },
  'ft³': { factor: 0.0283168, offset: 0 },

  // Flow
  'm³/s': { factor: 1, offset: 0 },
  'L/s': { factor: 0.001, offset: 0 },
  gpm: { factor: 0.0000630902, offset: 0 },
  'gal/min': { factor: 0.0000630902, offset: 0 },
  'L/min': { factor: 0.0000166667, offset: 0 },

  // Mass Flow
  'kg/s': { factor: 1, offset: 0 },
  scfm: { factor: 0.000471947, offset: 0 }, // Standard cubic feet per minute to m³/s

  // Mass Flux
  'kg/(m²·s)': { factor: 1, offset: 0 },

  // Velocity
  'm/s': { factor: 1, offset: 0 },
  'ft/s': { factor: 0.3048, offset: 0 },
  'km/h': { factor: 0.277778, offset: 0 },

  // Temperature (affine conversions)
  K: { factor: 1, offset: 0 },
  C: { factor: 1, offset: 273.15 },
  R: { factor: 5 / 9, offset: 0 }, // Rankine to Kelvin
  F: { factor: 5 / 9, offset: (32 * 5) / 9 + 273.15 },

  // Power
  W: { factor: 1, offset: 0 },
  kW: { factor: 1000, offset: 0 },
  hp: { factor: 745.7, offset: 0 },

  // Heat Flux
  'W/m²': { factor: 1, offset: 0 },

  // Time
  s: { factor: 1, offset: 0 },
  min: { factor: 60, offset: 0 },
  h: { factor: 3600, offset: 0 },

  // Dimensionless
  dimensionless: { factor: 1, offset: 0 },

  // Molecular Weight
  'kg/kmol': { factor: 1, offset: 0 },
};

// SI base units for each category
const SI_BASE_UNITS: Record<string, string> = {
  length: 'm',
  area: 'm²',
  volume: 'm³',
  pressure: 'Pa',
  head: 'm',
  density: 'kg/m³',
  viscosity: 'Pa·s',
  flow: 'm³/s',
  velocity: 'm/s',
  temperature: 'K',
  power: 'W',
  time: 's',
  dimensionless: 'dimensionless',
  'kg/kmol': 'kg/kmol',
};

// Unit category mapping
const UNIT_CATEGORIES: Record<string, string> = {
  // Length
  m: 'length',
  ft: 'length',

  // Diameter (compatible with length since both use meters)
  in: 'length',

  // Area
  'm²': 'area',
  'ft²': 'area',
  'in²': 'area',

  // Volume
  'm³': 'volume',
  'L': 'volume',
  gal: 'volume',
  'ft³': 'volume',

  // Pressure
  Pa: 'pressure',
  kPa: 'pressure',
  psi: 'pressure',
  bar: 'pressure',

  // Head (same as length, but separate category)
  // Note: 'm' is already mapped to 'length', so head uses the same unit

  // Density
  'kg/m³': 'density',
  'lb/ft³': 'density',

  // Viscosity
  'Pa·s': 'viscosity',
  cP: 'viscosity',

  // Flow
  'm³/s': 'flow',
  'L/s': 'flow',
  gpm: 'flow',
  'gal/min': 'flow',
  'L/min': 'flow',

  // Mass Flow
  'kg/s': 'flow',

  // Mass Flux
  'kg/(m²·s)': 'flow',

  // Velocity
  'm/s': 'velocity',
  'ft/s': 'velocity',

  // Time
  s: 'time',
  min: 'time',
  h: 'time',

  // Dimensionless
  dimensionless: 'dimensionless',

  // Molecular Weight
  'kg/kmol': 'kg/kmol',

  // Temperature
  K: 'temperature',
  C: 'temperature',
  R: 'temperature', // Rankine
  F: 'temperature',

  // Power
  W: 'power',
  kW: 'power',
  hp: 'power',

  // Heat Flux
  'W/m²': 'power',
};

/**
 * Convert a quantity from one unit to another
 * @param quantity - The quantity to convert
 * @param toUnit - The target unit
 * @returns The converted quantity
 */
export function convert(quantity: Quantity, toUnit: string): Quantity {
  const { value, unit } = quantity;

  // Validate input
  if (!UNIT_CONVERSIONS[unit]) {
    throw new Error(`Unsupported source unit: ${unit}`);
  }
  if (!UNIT_CONVERSIONS[toUnit]) {
    throw new Error(`Unsupported target unit: ${toUnit}`);
  }

  // Check if units are compatible (same category)
  const sourceCategory = UNIT_CATEGORIES[unit];
  const targetCategory = UNIT_CATEGORIES[toUnit];

  if (sourceCategory !== targetCategory) {
    throw new Error(
      `Cannot convert from ${unit} (${sourceCategory}) to ${toUnit} (${targetCategory})`
    );
  }

  // Convert to SI first, then to target unit
  const sourceConv = UNIT_CONVERSIONS[unit];
  const targetConv = UNIT_CONVERSIONS[toUnit];

  // Special handling for temperature conversions (affine transformations)
  if (sourceCategory === 'temperature' && targetCategory === 'temperature') {
    let convertedValue: number;

    if (unit === 'F' && toUnit === 'C') {
      // F to C: (F - 32) * 5/9
      convertedValue = ((value - 32) * 5) / 9;
    } else if (unit === 'C' && toUnit === 'F') {
      // C to F: C * 9/5 + 32
      convertedValue = (value * 9) / 5 + 32;
    } else if (unit === 'F' && toUnit === 'K') {
      // F to K: (F - 32) * 5/9 + 273.15
      convertedValue = ((value - 32) * 5) / 9 + 273.15;
    } else if (unit === 'C' && toUnit === 'K') {
      // C to K: C + 273.15
      convertedValue = value + 273.15;
    } else if (unit === 'K' && toUnit === 'C') {
      // K to C: K - 273.15
      convertedValue = value - 273.15;
    } else if (unit === 'K' && toUnit === 'F') {
      // K to F: (K - 273.15) * 9/5 + 32
      convertedValue = ((value - 273.15) * 9) / 5 + 32;
    } else {
      // Fallback to the general approach
      const kelvinValue = value * sourceConv.factor + sourceConv.offset;
      convertedValue = (kelvinValue - targetConv.offset) / targetConv.factor;
    }

    return {
      value: sig(convertedValue, 10), // Round to 10 significant digits
      unit: toUnit,
    };
  }

  // For non-temperature conversions, use the standard approach
  // Convert to SI: (value * factor) + offset
  const siValue = value * sourceConv.factor + sourceConv.offset;

  // Convert from SI to target: (siValue - offset) / factor
  const convertedValue = (siValue - targetConv.offset) / targetConv.factor;

  return {
    value: sig(convertedValue, 10), // Round to 10 significant digits
    unit: toUnit,
  };
}

/**
 * Convert a quantity to its SI base unit
 * @param quantity - The quantity to convert
 * @returns The quantity in SI units
 */
export function toSI(quantity: Quantity): Quantity {
  const category = UNIT_CATEGORIES[quantity.unit];
  if (!category) {
    throw new Error(`Unknown unit category for: ${quantity.unit}`);
  }

  const siUnit = SI_BASE_UNITS[category];
  if (!siUnit) {
    throw new Error(`No SI unit defined for category: ${category}`);
  }

  return convert(quantity, siUnit);
}

/**
 * Deterministic rounding to specified significant digits
 * @param value - The value to round
 * @param digits - Number of significant digits
 * @returns Rounded value
 */
export function sig(value: number, digits: number): number {
  if (value === 0) return 0;

  const magnitude = Math.floor(Math.log10(Math.abs(value))) + 1;
  const scale = Math.pow(10, digits - magnitude);

  return Math.round(value * scale) / scale;
}

/**
 * Deep map object to convert EngineeringQuantity fields to SI units
 * @param obj - The object to normalize
 * @param unitMap - Map of field paths to unit categories
 * @returns Object with SI-normalized quantities
 */
export function normalize<T extends Record<string, unknown>>(
  obj: T,
  unitMap: Record<string, string>
): T {
  const result = { ...obj };

  for (const [path, category] of Object.entries(unitMap)) {
    const keys = path.split('.');
    let current: Record<string, unknown> = result as Record<string, unknown>;

    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key && current[key] === undefined) {
        current[key] = {};
      }
      if (key) {
        current = current[key] as Record<string, unknown>;
      }
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey) {
      const quantity = current[lastKey];

      if (
        quantity &&
        typeof quantity === 'object' &&
        'value' in quantity &&
        'unit' in quantity
      ) {
        try {
          const siUnit = SI_BASE_UNITS[category];
          if (siUnit) {
            current[lastKey] = convert(quantity as Quantity, siUnit);
          }
        } catch (error) {
          // Skip conversion if unit is not supported
          console.warn(`Skipping conversion for ${path}: ${error}`);
        }
      }
    }
  }

  return result;
}

/**
 * Validate if a unit is supported
 * @param unit - The unit to validate
 * @returns True if supported
 */
export function isSupportedUnit(unit: string): boolean {
  return unit in UNIT_CONVERSIONS;
}

/**
 * Get the category of a unit
 * @param unit - The unit
 * @returns The unit category or undefined if not found
 */
export function getUnitCategory(unit: string): string | undefined {
  return UNIT_CATEGORIES[unit];
}

/**
 * Get all supported units for a category
 * @param category - The unit category
 * @returns Array of supported units
 */
export function getUnitsForCategory(category: string): string[] {
  return Object.entries(UNIT_CATEGORIES)
    .filter(([, cat]) => cat === category)
    .map(([unit]) => unit);
}

/**
 * Get all supported categories
 * @returns Array of supported categories
 */
export function getSupportedCategories(): string[] {
  return Object.keys(SI_BASE_UNITS);
}

// Export constants for testing and external use
export { UNIT_CONVERSIONS, SI_BASE_UNITS, UNIT_CATEGORIES };
