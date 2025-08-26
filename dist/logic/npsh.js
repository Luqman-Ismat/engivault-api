"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.npshAvailable = npshAvailable;
exports.npshRequired = npshRequired;
exports.cavitationMargin = cavitationMargin;
exports.getAtmosphericPressure = getAtmosphericPressure;
exports.getWaterVaporPressure = getWaterVaporPressure;
exports.calculateCavitationRisk = calculateCavitationRisk;
exports.validateNPSHInputs = validateNPSHInputs;
exports.resolveAtmosphericPressure = resolveAtmosphericPressure;
const props_1 = require("@/props");
const units_1 = require("@/utils/units");
/**
 * Calculate available NPSH using the formula:
 * NPSHa = (P_atm/ρg) + z_static - (P_vap/ρg) - (losses_Pa/ρg)
 * @param P_atm Atmospheric pressure (Pa)
 * @param P_vap Vapor pressure (Pa)
 * @param rho Fluid density (kg/m³)
 * @param z_static Static head (m)
 * @param losses_Pa Friction losses (Pa)
 * @returns Available NPSH (m)
 */
function npshAvailable(P_atm, P_vap, rho, z_static, losses_Pa) {
    const g = 9.81; // m/s²
    // NPSHa = (P_atm/ρg) + z_static - (P_vap/ρg) - (losses_Pa/ρg)
    const atmosphericHead = P_atm / (rho * g);
    const vaporHead = P_vap / (rho * g);
    const lossesHead = losses_Pa / (rho * g);
    return atmosphericHead + z_static - vaporHead - lossesHead;
}
/**
 * Interpolate required NPSH from curve at given flow rate
 * @param q Flow rate (m³/s)
 * @param curve NPSH curve with {q, npshr} points
 * @returns Required NPSH (m)
 */
function npshRequired(q, curve) {
    if (curve.length === 0) {
        throw new Error('NPSH curve must have at least one point');
    }
    if (curve.length === 1) {
        return curve[0].npshr;
    }
    // Sort curve by flow rate
    const sortedCurve = [...curve].sort((a, b) => a.q - b.q);
    // Check if flow is within range
    if (q <= sortedCurve[0].q) {
        return sortedCurve[0].npshr;
    }
    if (q >= sortedCurve[sortedCurve.length - 1].q) {
        return sortedCurve[sortedCurve.length - 1].npshr;
    }
    // Find the two points to interpolate between
    let i = 0;
    for (i = 0; i < sortedCurve.length - 1; i++) {
        if (q >= sortedCurve[i].q && q <= sortedCurve[i + 1].q) {
            break;
        }
    }
    // Linear interpolation
    const q1 = sortedCurve[i].q;
    const q2 = sortedCurve[i + 1].q;
    const npshr1 = sortedCurve[i].npshr;
    const npshr2 = sortedCurve[i + 1].npshr;
    const interpolationFactor = (q - q1) / (q2 - q1);
    return npshr1 + interpolationFactor * (npshr2 - npshr1);
}
/**
 * Calculate cavitation margin: NPSHa - NPSHr
 * @param npshAvailable Available NPSH (m)
 * @param npshRequired Required NPSH (m)
 * @returns Cavitation margin (m)
 */
function cavitationMargin(npshAvailable, npshRequired) {
    return npshAvailable - npshRequired;
}
/**
 * Get atmospheric pressure at given altitude using standard atmosphere model
 * @param altitude Altitude above sea level (m)
 * @returns Atmospheric pressure (Pa)
 */
function getAtmosphericPressure(altitude) {
    // Standard atmosphere model (simplified)
    // P = P0 * exp(-altitude / H)
    // where P0 = 101325 Pa (sea level pressure)
    // and H = 7400 m (scale height)
    const P0 = 101325; // Pa (sea level pressure)
    const H = 7400; // m (scale height)
    return P0 * Math.exp(-altitude / H);
}
/**
 * Get vapor pressure for water at given temperature using Antoine equation
 * @param temperature Temperature (K)
 * @returns Vapor pressure (Pa)
 */
function getWaterVaporPressure(temperature) {
    // Antoine equation for water (valid 273-373 K)
    // log10(P) = A - B/(C + T)
    // where P is in mmHg, T is in °C
    const T_C = temperature - 273.15; // Convert K to °C
    if (T_C < 0 || T_C > 100) {
        throw new Error('Temperature must be between 0°C and 100°C for water vapor pressure calculation');
    }
    const A = 8.07131;
    const B = 1730.63;
    const C = 233.426;
    const P_mmHg = Math.pow(10, A - B / (C + T_C));
    const P_Pa = P_mmHg * 133.322; // Convert mmHg to Pa
    return P_Pa;
}
/**
 * Calculate complete cavitation risk analysis
 * @param input NPSH calculation input parameters
 * @returns Cavitation risk analysis result
 */
function calculateCavitationRisk(input) {
    const warnings = [];
    // Resolve atmospheric pressure from altitude if needed
    const resolvedInput = resolveAtmosphericPressure(input);
    // Extract and convert input values
    const P_atm = (0, units_1.convert)(resolvedInput.atmosphericPressure, 'Pa').value;
    const z_static = (0, units_1.convert)(resolvedInput.staticHead, 'm').value;
    const losses_Pa = (0, units_1.convert)(resolvedInput.losses, 'Pa').value;
    const q = (0, units_1.convert)(resolvedInput.flowRate, 'm³/s').value;
    let P_vap;
    let rho;
    let temperature;
    // Determine temperature
    if (input.temperature) {
        temperature = (0, units_1.convert)(input.temperature, 'K').value;
    }
    else if (input.fluidName) {
        // Use default temperature for fluid
        temperature = 293.15; // 20°C default
    }
    else {
        throw new Error('Either temperature or fluidName must be provided');
    }
    // Determine vapor pressure
    if (input.vaporPressure) {
        P_vap = (0, units_1.convert)(input.vaporPressure, 'Pa').value;
    }
    else if (input.fluidName === 'water') {
        P_vap = getWaterVaporPressure(temperature);
    }
    else {
        throw new Error('Vapor pressure must be provided for non-water fluids');
    }
    // Determine fluid density
    if (input.fluidName && input.fluidName !== 'custom') {
        const fluidProps = (0, props_1.getFluidDefaults)(input.fluidName, temperature);
        rho = (0, units_1.convert)(fluidProps.density, 'kg/m³').value;
    }
    else if (input.fluidName === 'custom') {
        // For custom fluids, we need density to be provided or estimated
        // For now, use water density as default for custom fluids
        const waterProps = (0, props_1.getFluidDefaults)('water', temperature);
        rho = (0, units_1.convert)(waterProps.density, 'kg/m³').value;
    }
    else {
        throw new Error('Fluid density must be determined from fluidName');
    }
    // Calculate NPSH available
    const npsha = npshAvailable(P_atm, P_vap, rho, z_static, losses_Pa);
    // Calculate NPSH required
    const npshr = npshRequired(q, input.npshCurve.points);
    // Calculate cavitation margin
    const margin = cavitationMargin(npsha, npshr);
    // Generate warnings
    if (margin < 1.0) {
        warnings.push(`Low cavitation margin: ${margin.toFixed(2)} m (recommended: >1.0 m)`);
    }
    if (margin < 0.5) {
        warnings.push(`Critical cavitation risk: margin of ${margin.toFixed(2)} m indicates likely cavitation`);
    }
    if (margin < 0) {
        warnings.push(`Cavitation occurring: negative margin of ${margin.toFixed(2)} m`);
    }
    if (npsha < 0) {
        warnings.push('Negative NPSH available - check input parameters');
    }
    if (npshr < 0) {
        warnings.push('Negative NPSH required - check pump curve data');
    }
    // Check for extreme conditions
    if (temperature > 373.15) {
        warnings.push('Temperature above 100°C - vapor pressure calculation may be inaccurate');
    }
    if (input.altitude && input.altitude > 5000) {
        warnings.push('High altitude - atmospheric pressure calculation may need verification');
    }
    return {
        npshAvailable: { value: npsha, unit: 'm' },
        npshRequired: { value: npshr, unit: 'm' },
        cavitationMargin: { value: margin, unit: 'm' },
        warnings,
        metadata: {
            atmosphericPressure: resolvedInput.atmosphericPressure,
            vaporPressure: { value: P_vap, unit: 'Pa' },
            staticHead: resolvedInput.staticHead,
            losses: resolvedInput.losses,
            flowRate: resolvedInput.flowRate,
            altitude: resolvedInput.altitude,
            temperature: { value: temperature, unit: 'K' },
        },
    };
}
/**
 * Validate NPSH calculation inputs
 * @param input NPSH calculation input
 * @returns Validation result
 */
function validateNPSHInputs(input) {
    const errors = [];
    // Check required fields
    if (!input.atmosphericPressure || input.atmosphericPressure.value <= 0) {
        errors.push('Atmospheric pressure must be positive');
    }
    if (!input.staticHead) {
        errors.push('Static head is required');
    }
    if (!input.losses || input.losses.value < 0) {
        errors.push('Losses must be non-negative');
    }
    if (!input.flowRate || input.flowRate.value <= 0) {
        errors.push('Flow rate must be positive');
    }
    if (!input.npshCurve || input.npshCurve.points.length === 0) {
        errors.push('NPSH curve must have at least one point');
    }
    // Check NPSH curve points
    if (input.npshCurve && input.npshCurve.points.length > 0) {
        for (let i = 0; i < input.npshCurve.points.length; i++) {
            const point = input.npshCurve.points[i];
            if (point.q < 0) {
                errors.push(`NPSH curve point ${i + 1}: Flow rate cannot be negative`);
            }
            if (point.npshr < 0) {
                errors.push(`NPSH curve point ${i + 1}: Required NPSH cannot be negative`);
            }
        }
    }
    // Check temperature range for water vapor pressure
    if (input.temperature) {
        const temp_C = (0, units_1.convert)(input.temperature, 'C').value;
        if (input.fluidName === 'water' && (temp_C < 0 || temp_C > 100)) {
            errors.push('Temperature must be between 0°C and 100°C for water vapor pressure calculation');
        }
    }
    // Check altitude
    if (input.altitude !== undefined && input.altitude < 0) {
        errors.push('Altitude cannot be negative');
    }
    return { isValid: errors.length === 0, errors };
}
/**
 * Get atmospheric pressure from altitude if not provided
 * @param input NPSH calculation input
 * @returns Updated input with atmospheric pressure
 */
function resolveAtmosphericPressure(input) {
    if (!input.atmosphericPressure && input.altitude !== undefined) {
        const P_atm = getAtmosphericPressure(input.altitude);
        return {
            ...input,
            atmosphericPressure: { value: P_atm, unit: 'Pa' },
        };
    }
    return input;
}
//# sourceMappingURL=npsh.js.map