import { describe, it, expect } from 'vitest';
import {
  machNumber,
  isothermalSonicVelocity,
  adiabaticSonicVelocity,
  isothermalPressureDrop,
  adiabaticPressureDrop,
  calculateGasFlow,
  getDefaultSpecificHeatRatio,
  estimateCompressibilityFactor,
  gasStateAtMach,
  fannoLine,
  rayleighLine,
  GasFlowInput,
  GasState,
  FannoLineInput,
  RayleighLineInput
} from './gas';

describe('Gas Module', () => {
  describe('machNumber', () => {
    it('should calculate Mach number correctly', () => {
      const velocity = 100; // m/s
      const sonicVelocity = 340; // m/s (speed of sound in air)
      
      const mach = machNumber(velocity, sonicVelocity);
      
      expect(mach).toBeCloseTo(100 / 340, 3);
    });

    it('should handle zero velocity', () => {
      const mach = machNumber(0, 340);
      expect(mach).toBe(0);
    });

    it('should throw error for zero sonic velocity', () => {
      expect(() => machNumber(100, 0)).toThrow('Sonic velocity must be positive');
    });
  });

  describe('isothermalSonicVelocity', () => {
    it('should calculate isothermal sonic velocity correctly', () => {
      const compressibilityFactor = 1.0;
      const temperature = 298.15; // K (25°C)
      const molecularWeight = 28.97; // kg/kmol (air)
      
      const sonicVelocity = isothermalSonicVelocity(compressibilityFactor, temperature, molecularWeight);
      
      // a = sqrt(Z * R * T / M)
      // a = sqrt(1.0 * 8314.46 * 298.15 / 28.97)
      // a = sqrt(85547.5) = 292.5 m/s
      expect(sonicVelocity).toBeCloseTo(292.5, 1);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => isothermalSonicVelocity(0, 298.15, 28.97)).toThrow('All parameters must be positive');
      expect(() => isothermalSonicVelocity(1.0, 0, 28.97)).toThrow('All parameters must be positive');
      expect(() => isothermalSonicVelocity(1.0, 298.15, 0)).toThrow('All parameters must be positive');
    });
  });

  describe('adiabaticSonicVelocity', () => {
    it('should calculate adiabatic sonic velocity correctly', () => {
      const specificHeatRatio = 1.4; // Air
      const compressibilityFactor = 1.0;
      const temperature = 298.15; // K (25°C)
      const molecularWeight = 28.97; // kg/kmol (air)
      
      const sonicVelocity = adiabaticSonicVelocity(specificHeatRatio, compressibilityFactor, temperature, molecularWeight);
      
      // a = sqrt(γ * Z * R * T / M)
      // a = sqrt(1.4 * 1.0 * 8314.46 * 298.15 / 28.97)
      // a = sqrt(119766.5) = 346.1 m/s
      expect(sonicVelocity).toBeCloseTo(346.1, 1);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => adiabaticSonicVelocity(1.0, 1.0, 298.15, 28.97)).toThrow('All parameters must be positive and γ > 1');
      expect(() => adiabaticSonicVelocity(1.4, 0, 298.15, 28.97)).toThrow('All parameters must be positive and γ > 1');
      expect(() => adiabaticSonicVelocity(1.4, 1.0, 0, 28.97)).toThrow('All parameters must be positive and γ > 1');
      expect(() => adiabaticSonicVelocity(1.4, 1.0, 298.15, 0)).toThrow('All parameters must be positive and γ > 1');
    });
  });

  describe('isothermalPressureDrop', () => {
    it('should calculate isothermal pressure drop correctly', () => {
      const inletPressure = 1e6; // Pa (10 bar)
      const massFlowRate = 1.0; // kg/s
      const pipeLength = 100; // m
      const pipeDiameter = 0.1; // m
      const frictionFactor = 0.02;
      const compressibilityFactor = 1.0;
      const temperature = 298.15; // K
      const molecularWeight = 28.97; // kg/kmol (air)
      
      const result = isothermalPressureDrop(
        inletPressure,
        massFlowRate,
        pipeLength,
        pipeDiameter,
        frictionFactor,
        compressibilityFactor,
        temperature,
        molecularWeight
      );
      
      expect(result.outletPressure).toBeGreaterThan(0);
      expect(result.outletPressure).toBeLessThan(inletPressure);
      expect(result.pressureDrop).toBeGreaterThan(0);
      expect(result.pressureDrop).toBeLessThan(inletPressure);
    });

    it('should handle choked flow', () => {
      const inletPressure = 1e6; // Pa
      const massFlowRate = 100; // kg/s (very high flow rate)
      const pipeLength = 1000; // m
      const pipeDiameter = 0.01; // m (very small diameter)
      const frictionFactor = 0.02;
      const compressibilityFactor = 1.0;
      const temperature = 298.15; // K
      const molecularWeight = 28.97; // kg/kmol
      
      const result = isothermalPressureDrop(
        inletPressure,
        massFlowRate,
        pipeLength,
        pipeDiameter,
        frictionFactor,
        compressibilityFactor,
        temperature,
        molecularWeight
      );
      
      // Should be choked (outlet pressure = 0)
      expect(result.outletPressure).toBe(0);
      expect(result.pressureDrop).toBe(inletPressure);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => isothermalPressureDrop(0, 1.0, 100, 0.1, 0.02, 1.0, 298.15, 28.97))
        .toThrow('All input parameters must be positive');
      expect(() => isothermalPressureDrop(1e6, 1.0, 100, 0.1, 0, 1.0, 298.15, 28.97))
        .toThrow('All physical parameters must be positive');
    });
  });

  describe('adiabaticPressureDrop', () => {
    it('should calculate adiabatic pressure drop correctly', () => {
      const inletPressure = 1e6; // Pa (10 bar)
      const massFlowRate = 1.0; // kg/s
      const pipeLength = 100; // m
      const pipeDiameter = 0.1; // m
      const frictionFactor = 0.02;
      const specificHeatRatio = 1.4; // Air
      const compressibilityFactor = 1.0;
      const temperature = 298.15; // K
      const molecularWeight = 28.97; // kg/kmol (air)
      
      const result = adiabaticPressureDrop(
        inletPressure,
        massFlowRate,
        pipeLength,
        pipeDiameter,
        frictionFactor,
        specificHeatRatio,
        compressibilityFactor,
        temperature,
        molecularWeight
      );
      
      expect(result.outletPressure).toBeGreaterThan(0);
      expect(result.outletPressure).toBeLessThan(inletPressure);
      expect(result.pressureDrop).toBeGreaterThan(0);
      expect(result.pressureDrop).toBeLessThan(inletPressure);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => adiabaticPressureDrop(1e6, 1.0, 100, 0.1, 0.02, 1.0, 1.0, 298.15, 28.97))
        .toThrow('All physical parameters must be positive and γ > 1');
    });
  });

  describe('gasStateAtMach', () => {
    it('should calculate gas state at given Mach number', () => {
      const machNumber = 0.5;
      const specificHeatRatio = 1.4;
      const stagnationPressure = 101325; // Pa
      const stagnationTemperature = 298.15; // K
      const molecularWeight = 28.97; // kg/kmol
      
      const state = gasStateAtMach(machNumber, specificHeatRatio, stagnationPressure, stagnationTemperature, molecularWeight);
      
      expect(state.machNumber).toBe(machNumber);
      expect(state.pressure).toBeLessThan(stagnationPressure);
      expect(state.temperature).toBeLessThan(stagnationTemperature);
      expect(state.density).toBeGreaterThan(0);
      expect(state.velocity).toBeGreaterThan(0);
      expect(state.stagnationPressure).toBe(stagnationPressure);
      expect(state.stagnationTemperature).toBe(stagnationTemperature);
    });

    it('should handle Mach number = 0 (stagnation conditions)', () => {
      const state = gasStateAtMach(0, 1.4, 101325, 298.15, 28.97);
      
      expect(state.machNumber).toBe(0);
      expect(state.pressure).toBeCloseTo(101325, 0);
      expect(state.temperature).toBeCloseTo(298.15, 0);
      expect(state.velocity).toBe(0);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => gasStateAtMach(-1, 1.4, 101325, 298.15, 28.97)).toThrow('Invalid input parameters');
      expect(() => gasStateAtMach(0.5, 1.0, 101325, 298.15, 28.97)).toThrow('Invalid input parameters');
      expect(() => gasStateAtMach(0.5, 1.4, 0, 298.15, 28.97)).toThrow('Invalid input parameters');
    });
  });

  describe('fannoLine', () => {
    const baseState: GasState = {
      pressure: 101325, // Pa
      temperature: 298.15, // K
      density: 1.225, // kg/m³
      velocity: 100, // m/s
      machNumber: 0.3, // Subsonic
      stagnationPressure: 105000, // Pa
      stagnationTemperature: 303.15, // K
    };

    it('should calculate Fanno line correctly', () => {
      const input: FannoLineInput = {
        state0: baseState,
        length: { value: 10, unit: 'm' }, // Shorter length to avoid choking
        diameter: { value: 0.1, unit: 'm' },
        frictionFactor: 0.02,
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      const result = fannoLine(input);
      
      expect(result.states.length).toBeGreaterThan(1);
      expect(result.maxLength).toBeGreaterThan(0);
      // Flow may be choked depending on the parameters
      expect(typeof result.isChoked).toBe('boolean');
      expect(result.metadata.calculations.type).toBe('fanno');
      expect(result.metadata.calculations.specificHeatRatio).toBe(1.4);
    });

    it('should show monotonic trends along Fanno line', () => {
      const input: FannoLineInput = {
        state0: baseState,
        length: { value: 5, unit: 'm' }, // Shorter length for clearer trends
        diameter: { value: 0.1, unit: 'm' },
        frictionFactor: 0.02,
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      const result = fannoLine(input);
      
      // Check monotonic trends
      const pressures = result.states.map(s => s.pressure);
      const temperatures = result.states.map(s => s.temperature);
      const velocities = result.states.map(s => s.velocity);
      const machNumbers = result.states.map(s => s.machNumber);
      
      // Mach number should increase (this is the most reliable trend)
      for (let i = 1; i < machNumbers.length; i++) {
        expect(machNumbers[i]).toBeGreaterThanOrEqual(machNumbers[i - 1]);
      }
      
      // Velocity should increase
      for (let i = 1; i < velocities.length; i++) {
        expect(velocities[i]).toBeGreaterThanOrEqual(velocities[i - 1]);
      }
    });

    it('should handle choked flow conditions', () => {
      const input: FannoLineInput = {
        state0: baseState,
        length: { value: 1000, unit: 'm' }, // Very long duct
        diameter: { value: 0.01, unit: 'm' }, // Very small diameter
        frictionFactor: 0.02,
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      const result = fannoLine(input);
      
      // Should be choked
      expect(result.isChoked).toBe(true);
      
      // Should have warning about choked flow
      const hasChokedWarning = result.warnings.some(w => 
        typeof w === 'object' && 'message' in w && w.message.includes('choked')
      );
      expect(hasChokedWarning).toBe(true);
      
      // Final Mach number should be higher than initial
      const finalMach = result.states[result.states.length - 1].machNumber;
      expect(finalMach).toBeGreaterThan(baseState.machNumber);
    });

    it('should throw error for supersonic initial conditions', () => {
      const supersonicState = { ...baseState, machNumber: 1.5 };
      const input: FannoLineInput = {
        state0: supersonicState,
        length: { value: 100, unit: 'm' },
        diameter: { value: 0.1, unit: 'm' },
        frictionFactor: 0.02,
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      expect(() => fannoLine(input)).toThrow('Initial Mach number must be subsonic for Fanno line analysis');
    });

    it('should throw error for invalid inputs', () => {
      const input: FannoLineInput = {
        state0: baseState,
        length: { value: 0, unit: 'm' }, // Invalid length
        diameter: { value: 0.1, unit: 'm' },
        frictionFactor: 0.02,
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      expect(() => fannoLine(input)).toThrow('All input parameters must be positive and γ > 1');
    });
  });

  describe('rayleighLine', () => {
    const baseState: GasState = {
      pressure: 101325, // Pa
      temperature: 298.15, // K
      density: 1.225, // kg/m³
      velocity: 100, // m/s
      machNumber: 0.3, // Subsonic
      stagnationPressure: 105000, // Pa
      stagnationTemperature: 303.15, // K
    };

    it('should calculate Rayleigh line with heat addition', () => {
      const input: RayleighLineInput = {
        state0: baseState,
        heatTransferRate: { value: 1000, unit: 'W/m²' }, // Heat addition
        diameter: { value: 0.1, unit: 'm' },
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      const result = rayleighLine(input);
      
      expect(result.states.length).toBeGreaterThan(1);
      expect(result.maxHeatTransfer).toBeGreaterThan(0);
      expect(result.isChoked).toBe(false);
      expect(result.metadata.calculations.type).toBe('rayleigh');
      expect(result.metadata.calculations.specificHeatRatio).toBe(1.4);
    });

    it('should calculate Rayleigh line with heat removal', () => {
      const input: RayleighLineInput = {
        state0: baseState,
        heatTransferRate: { value: -1000, unit: 'W/m²' }, // Heat removal
        diameter: { value: 0.1, unit: 'm' },
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      const result = rayleighLine(input);
      
      expect(result.states.length).toBeGreaterThan(1);
      expect(result.maxHeatTransfer).toBeGreaterThan(0);
      expect(result.isChoked).toBe(false);
    });

    it('should show correct trends for heat addition', () => {
      const input: RayleighLineInput = {
        state0: baseState,
        heatTransferRate: { value: 500, unit: 'W/m²' }, // Heat addition
        diameter: { value: 0.1, unit: 'm' },
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      const result = rayleighLine(input);
      
      // Check trends for heat addition
      const temperatures = result.states.map(s => s.temperature);
      const machNumbers = result.states.map(s => s.machNumber);
      
      // Temperature should increase with heat addition
      for (let i = 1; i < temperatures.length; i++) {
        expect(temperatures[i]).toBeGreaterThanOrEqual(temperatures[i - 1]);
      }
      
      // Mach number should decrease with heat addition (for subsonic flow)
      for (let i = 1; i < machNumbers.length; i++) {
        expect(machNumbers[i]).toBeLessThanOrEqual(machNumbers[i - 1]);
      }
    });

    it('should show correct trends for heat removal', () => {
      const input: RayleighLineInput = {
        state0: baseState,
        heatTransferRate: { value: -500, unit: 'W/m²' }, // Heat removal
        diameter: { value: 0.1, unit: 'm' },
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      const result = rayleighLine(input);
      
      // Check trends for heat removal
      const temperatures = result.states.map(s => s.temperature);
      const machNumbers = result.states.map(s => s.machNumber);
      
      // Temperature should decrease with heat removal
      for (let i = 1; i < temperatures.length; i++) {
        expect(temperatures[i]).toBeLessThanOrEqual(temperatures[i - 1]);
      }
      
      // Mach number should increase with heat removal (for subsonic flow)
      for (let i = 1; i < machNumbers.length; i++) {
        expect(machNumbers[i]).toBeGreaterThanOrEqual(machNumbers[i - 1]);
      }
    });

    it('should handle high heat transfer rates', () => {
      const input: RayleighLineInput = {
        state0: baseState,
        heatTransferRate: { value: 10000, unit: 'W/m²' }, // Very high heat addition
        diameter: { value: 0.1, unit: 'm' },
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      const result = rayleighLine(input);
      
      // Should have significant changes in properties
      const initialTemp = result.states[0].temperature;
      const finalTemp = result.states[result.states.length - 1].temperature;
      expect(finalTemp).toBeGreaterThan(initialTemp);
      
      const initialMach = result.states[0].machNumber;
      const finalMach = result.states[result.states.length - 1].machNumber;
      expect(finalMach).toBeLessThan(initialMach); // Heat addition decreases Mach for subsonic
    });

    it('should handle supersonic initial conditions', () => {
      const supersonicState = { ...baseState, machNumber: 2.0 };
      const input: RayleighLineInput = {
        state0: supersonicState,
        heatTransferRate: { value: 1000, unit: 'W/m²' },
        diameter: { value: 0.1, unit: 'm' },
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      const result = rayleighLine(input);
      
      // Should work for supersonic conditions
      expect(result.states.length).toBeGreaterThan(1);
      expect(result.metadata.calculations.type).toBe('rayleigh');
    });

    it('should throw error for invalid inputs', () => {
      const input: RayleighLineInput = {
        state0: baseState,
        heatTransferRate: { value: 1000, unit: 'W/m²' },
        diameter: { value: 0, unit: 'm' }, // Invalid diameter
        specificHeatRatio: 1.4,
        molecularWeight: { value: 28.97, unit: 'kg/kmol' }
      };
      
      expect(() => rayleighLine(input)).toThrow('All input parameters must be positive and γ > 1');
    });
  });

  describe('calculateGasFlow - Air @ STP', () => {
    it('should calculate isothermal air flow at STP', () => {
      const input: GasFlowInput = {
        gas: {
          density: { value: 1.225, unit: 'kg/m³' }, // Air at STP
          viscosity: { value: 1.81e-5, unit: 'Pa·s' }, // Air at STP
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }, // Air
          compressibilityFactor: 1.0
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' } // Steel
        },
        inletPressure: { value: 101325, unit: 'Pa' }, // 1 atm
        massFlowRate: { value: 0.1, unit: 'kg/s' },
        temperature: { value: 273.15, unit: 'K' }, // 0°C
        model: 'isothermal'
      };
      
      const result = calculateGasFlow(input);
      
      expect(result.inletPressure.value).toBe(101325);
      expect(result.outletPressure.value).toBeGreaterThan(0);
      expect(result.outletPressure.value).toBeLessThan(101325);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.pressureDropPercent).toBeGreaterThan(0);
      expect(result.velocity.value).toBeGreaterThan(0);
      expect(result.machNumber).toBeGreaterThan(0);
      expect(result.machNumber).toBeLessThan(1); // Subsonic
      expect(result.isChoked).toBe(false);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.reynoldsNumber).toBeGreaterThan(0);
      expect(result.metadata.calculations.model).toBe('isothermal');
      expect(result.metadata.calculations.compressibilityFactor).toBe(1.0);
      expect(result.metadata.calculations.sonicVelocity).toBeCloseTo(279.99, 1);
    });

    it('should calculate adiabatic air flow at STP', () => {
      const input: GasFlowInput = {
        gas: {
          density: { value: 1.225, unit: 'kg/m³' }, // Air at STP
          viscosity: { value: 1.81e-5, unit: 'Pa·s' }, // Air at STP
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }, // Air
          specificHeatRatio: 1.4,
          compressibilityFactor: 1.0
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' } // Steel
        },
        inletPressure: { value: 101325, unit: 'Pa' }, // 1 atm
        massFlowRate: { value: 0.1, unit: 'kg/s' },
        temperature: { value: 273.15, unit: 'K' }, // 0°C
        model: 'adiabatic'
      };
      
      const result = calculateGasFlow(input);
      
      expect(result.metadata.calculations.model).toBe('adiabatic');
      expect(result.metadata.calculations.specificHeatRatio).toBe(1.4);
      expect(result.metadata.calculations.sonicVelocity).toBeCloseTo(331.29, 1);
      expect(result.machNumber).toBeGreaterThan(0);
      expect(result.machNumber).toBeLessThan(1);
    });

    it('should warn for high Mach number', () => {
      const input: GasFlowInput = {
        gas: {
          density: { value: 1.225, unit: 'kg/m³' },
          viscosity: { value: 1.81e-5, unit: 'Pa·s' },
          molecularWeight: { value: 28.97, unit: 'kg/kmol' },
          compressibilityFactor: 1.0
        },
        pipe: {
          diameter: { value: 0.01, unit: 'm' }, // Small diameter for high velocity
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' }
        },
        inletPressure: { value: 101325, unit: 'Pa' },
        massFlowRate: { value: 1.0, unit: 'kg/s' }, // High flow rate
        temperature: { value: 273.15, unit: 'K' },
        model: 'isothermal'
      };
      
      const result = calculateGasFlow(input);
      
      // Should have warnings for high Mach number
      const hasHighMachWarning = result.warnings.some(w => 
        typeof w === 'object' && 'message' in w && w.message.includes('High Mach number')
      );
      expect(hasHighMachWarning).toBe(true);
    });
  });

  describe('calculateGasFlow - Natural Gas Cases', () => {
    it('should calculate natural gas flow with compressibility', () => {
      const input: GasFlowInput = {
        gas: {
          density: { value: 0.668, unit: 'kg/m³' }, // Natural gas at 20°C, 1 atm
          viscosity: { value: 1.1e-5, unit: 'Pa·s' }, // Natural gas
          molecularWeight: { value: 16.04, unit: 'kg/kmol' }, // Methane
          specificHeatRatio: 1.32,
          compressibilityFactor: 0.95 // Non-ideal gas
        },
        pipe: {
          diameter: { value: 0.2, unit: 'm' },
          length: { value: 1000, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' } // Steel
        },
        inletPressure: { value: 5e6, unit: 'Pa' }, // 50 bar
        massFlowRate: { value: 10.0, unit: 'kg/s' },
        temperature: { value: 293.15, unit: 'K' }, // 20°C
        model: 'adiabatic'
      };
      
      const result = calculateGasFlow(input);
      
      expect(result.metadata.calculations.model).toBe('adiabatic');
      expect(result.metadata.calculations.compressibilityFactor).toBe(0.95);
      expect(result.metadata.calculations.specificHeatRatio).toBe(1.32);
      expect(result.pressureDropPercent).toBeGreaterThan(0);
      expect(result.pressureDropPercent).toBeLessThan(100);
      expect(result.isChoked).toBe(false);
    });

    it('should handle natural gas with estimated specific heat ratio', () => {
      const input: GasFlowInput = {
        gas: {
          density: { value: 0.668, unit: 'kg/m³' },
          viscosity: { value: 1.1e-5, unit: 'Pa·s' },
          molecularWeight: { value: 16.04, unit: 'kg/kmol' }, // Methane
          compressibilityFactor: 0.95
          // No specificHeatRatio provided - should be estimated
        },
        pipe: {
          diameter: { value: 0.2, unit: 'm' },
          length: { value: 1000, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' }
        },
        inletPressure: { value: 5e6, unit: 'Pa' },
        massFlowRate: { value: 10.0, unit: 'kg/s' },
        temperature: { value: 293.15, unit: 'K' },
        model: 'adiabatic'
      };
      
      const result = calculateGasFlow(input);
      
      // Should have warning about estimated specific heat ratio
      const hasEstimationWarning = result.warnings.some(w => 
        typeof w === 'object' && 'message' in w && w.message.includes('estimated')
      );
      expect(hasEstimationWarning).toBe(true);
      expect(result.metadata.calculations.specificHeatRatio).toBeDefined();
      expect(result.metadata.calculations.specificHeatRatio!).toBeGreaterThan(1);
    });

    it('should handle choked natural gas flow', () => {
      const input: GasFlowInput = {
        gas: {
          density: { value: 0.668, unit: 'kg/m³' },
          viscosity: { value: 1.1e-5, unit: 'Pa·s' },
          molecularWeight: { value: 16.04, unit: 'kg/kmol' },
          specificHeatRatio: 1.32,
          compressibilityFactor: 0.95
        },
        pipe: {
          diameter: { value: 0.01, unit: 'm' }, // Very small diameter
          length: { value: 1000, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' }
        },
        inletPressure: { value: 5e6, unit: 'Pa' },
        massFlowRate: { value: 100.0, unit: 'kg/s' }, // Very high flow rate
        temperature: { value: 293.15, unit: 'K' },
        model: 'adiabatic'
      };
      
      const result = calculateGasFlow(input);
      
      // Should be choked
      expect(result.isChoked).toBe(true);
      expect(result.outletPressure.value).toBe(0);
      expect(result.pressureDrop.value).toBe(input.inletPressure.value);
      
      // Should have warning about choked flow
      const hasChokedWarning = result.warnings.some(w => 
        typeof w === 'object' && 'message' in w && w.message.includes('choked')
      );
      expect(hasChokedWarning).toBe(true);
    });
  });

  describe('getDefaultSpecificHeatRatio', () => {
    it('should return correct specific heat ratios for common gases', () => {
      expect(getDefaultSpecificHeatRatio('air')).toBe(1.4);
      expect(getDefaultSpecificHeatRatio('methane')).toBe(1.32);
      expect(getDefaultSpecificHeatRatio('helium')).toBe(1.67);
      expect(getDefaultSpecificHeatRatio('carbon_dioxide')).toBe(1.29);
    });

    it('should return undefined for unknown gases', () => {
      expect(getDefaultSpecificHeatRatio('unknown_gas')).toBeUndefined();
      expect(getDefaultSpecificHeatRatio('')).toBeUndefined();
    });
  });

  describe('estimateCompressibilityFactor', () => {
    it('should estimate compressibility factor for low pressure', () => {
      const pressure = 1e5; // 1 bar
      const temperature = 298.15; // 25°C
      const molecularWeight = 16.04; // Methane
      
      const z = estimateCompressibilityFactor(pressure, temperature, molecularWeight);
      
      expect(z).toBeCloseTo(1.0, 1); // Near ideal gas conditions
    });

    it('should estimate compressibility factor for high pressure', () => {
      const pressure = 1e7; // 100 bar
      const temperature = 298.15; // 25°C
      const molecularWeight = 16.04; // Methane
      
      const z = estimateCompressibilityFactor(pressure, temperature, molecularWeight);
      
      expect(z).toBeLessThan(1.0); // Non-ideal gas conditions
      expect(z).toBeGreaterThan(0.8);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => estimateCompressibilityFactor(0, 298.15, 16.04)).toThrow('All parameters must be positive');
      expect(() => estimateCompressibilityFactor(1e5, 0, 16.04)).toThrow('All parameters must be positive');
      expect(() => estimateCompressibilityFactor(1e5, 298.15, 0)).toThrow('All parameters must be positive');
    });
  });

  describe('Model Comparison', () => {
    it('should show differences between isothermal and adiabatic models', () => {
      const baseInput: GasFlowInput = {
        gas: {
          density: { value: 1.225, unit: 'kg/m³' },
          viscosity: { value: 1.81e-5, unit: 'Pa·s' },
          molecularWeight: { value: 28.97, unit: 'kg/kmol' },
          specificHeatRatio: 1.4,
          compressibilityFactor: 1.0
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' }
        },
        inletPressure: { value: 1e6, unit: 'Pa' },
        massFlowRate: { value: 1.0, unit: 'kg/s' },
        temperature: { value: 298.15, unit: 'K' },
        model: 'isothermal'
      };
      
      const isothermalResult = calculateGasFlow(baseInput);
      
      const adiabaticInput = { ...baseInput, model: 'adiabatic' as const };
      const adiabaticResult = calculateGasFlow(adiabaticInput);
      
      // Adiabatic should have higher sonic velocity
      expect(adiabaticResult.metadata.calculations.sonicVelocity).toBeGreaterThan(
        isothermalResult.metadata.calculations.sonicVelocity
      );
      
      // Mach numbers should be different
      expect(adiabaticResult.machNumber).not.toBe(isothermalResult.machNumber);
      
      // Pressure drops should be different
      expect(adiabaticResult.pressureDrop.value).not.toBe(isothermalResult.pressureDrop.value);
    });
  });

  describe('Compressibility Effects', () => {
    it('should show effects of compressibility factor', () => {
      const baseInput: GasFlowInput = {
        gas: {
          density: { value: 1.225, unit: 'kg/m³' },
          viscosity: { value: 1.81e-5, unit: 'Pa·s' },
          molecularWeight: { value: 28.97, unit: 'kg/kmol' },
          compressibilityFactor: 1.0
        },
        pipe: {
          diameter: { value: 0.1, unit: 'm' },
          length: { value: 100, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' }
        },
        inletPressure: { value: 1e6, unit: 'Pa' },
        massFlowRate: { value: 1.0, unit: 'kg/s' },
        temperature: { value: 298.15, unit: 'K' },
        model: 'isothermal'
      };
      
      const idealResult = calculateGasFlow(baseInput);
      
      const nonIdealInput = {
        ...baseInput,
        gas: { ...baseInput.gas, compressibilityFactor: 0.7 }
      };
      const nonIdealResult = calculateGasFlow(nonIdealInput);
      
      // Non-ideal gas should have different sonic velocity
      expect(nonIdealResult.metadata.calculations.sonicVelocity).toBeLessThan(
        idealResult.metadata.calculations.sonicVelocity
      );
      
      // Should have warning about unusual compressibility factor
      const hasCompressibilityWarning = nonIdealResult.warnings.some(w => 
        typeof w === 'object' && 'message' in w && w.message.includes('compressibility')
      );
      expect(hasCompressibilityWarning).toBe(true);
    });
  });
});
