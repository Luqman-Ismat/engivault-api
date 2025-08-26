import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../index';

describe('Gas Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/gas/pressure-drop', () => {
    it('should calculate isothermal air flow at STP', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/pressure-drop',
        payload: {
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
          inletPressure: { value: 101325, unit: 'Pa' },
          massFlowRate: { value: 0.1, unit: 'kg/s' },
          temperature: { value: 273.15, unit: 'K' },
          model: 'isothermal'
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
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
    });

    it('should calculate adiabatic natural gas flow', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/pressure-drop',
        payload: {
          gas: {
            density: { value: 0.668, unit: 'kg/m³' },
            viscosity: { value: 1.1e-5, unit: 'Pa·s' },
            molecularWeight: { value: 16.04, unit: 'kg/kmol' },
            specificHeatRatio: 1.32,
            compressibilityFactor: 0.95
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
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.metadata.calculations.model).toBe('adiabatic');
      expect(result.metadata.calculations.compressibilityFactor).toBe(0.95);
      expect(result.metadata.calculations.specificHeatRatio).toBe(1.32);
      expect(result.pressureDropPercent).toBeGreaterThan(0);
      expect(result.pressureDropPercent).toBeLessThan(100);
      expect(result.isChoked).toBe(false);
    });

    it('should warn for high Mach number', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/pressure-drop',
        payload: {
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
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      // Should have warnings for high Mach number
      const hasHighMachWarning = result.warnings.some((w: any) => 
        typeof w === 'object' && 'message' in w && w.message.includes('High Mach number')
      );
      expect(hasHighMachWarning).toBe(true);
    });

    it('should return 400 for invalid gas properties', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/pressure-drop',
        payload: {
          gas: {
            density: { value: 0, unit: 'kg/m³' }, // Invalid density
            viscosity: { value: 1.81e-5, unit: 'Pa·s' },
            molecularWeight: { value: 28.97, unit: 'kg/kmol' },
            compressibilityFactor: 1.0
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          inletPressure: { value: 101325, unit: 'Pa' },
          massFlowRate: { value: 0.1, unit: 'kg/s' },
          temperature: { value: 273.15, unit: 'K' },
          model: 'isothermal'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid pipe geometry', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/pressure-drop',
        payload: {
          gas: {
            density: { value: 1.225, unit: 'kg/m³' },
            viscosity: { value: 1.81e-5, unit: 'Pa·s' },
            molecularWeight: { value: 28.97, unit: 'kg/kmol' },
            compressibilityFactor: 1.0
          },
          pipe: {
            diameter: { value: 0, unit: 'm' }, // Invalid diameter
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          inletPressure: { value: 101325, unit: 'Pa' },
          massFlowRate: { value: 0.1, unit: 'kg/s' },
          temperature: { value: 273.15, unit: 'K' },
          model: 'isothermal'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid flow conditions', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/pressure-drop',
        payload: {
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
          inletPressure: { value: 0, unit: 'Pa' }, // Invalid pressure
          massFlowRate: { value: 0.1, unit: 'kg/s' },
          temperature: { value: 273.15, unit: 'K' },
          model: 'isothermal'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid adiabatic model parameters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/pressure-drop',
        payload: {
          gas: {
            density: { value: 1.225, unit: 'kg/m³' },
            viscosity: { value: 1.81e-5, unit: 'Pa·s' },
            molecularWeight: { value: 28.97, unit: 'kg/kmol' },
            specificHeatRatio: 1.0, // Invalid (must be > 1)
            compressibilityFactor: 1.0
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          inletPressure: { value: 101325, unit: 'Pa' },
          massFlowRate: { value: 0.1, unit: 'kg/s' },
          temperature: { value: 273.15, unit: 'K' },
          model: 'adiabatic'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid compressibility factor', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/pressure-drop',
        payload: {
          gas: {
            density: { value: 1.225, unit: 'kg/m³' },
            viscosity: { value: 1.81e-5, unit: 'Pa·s' },
            molecularWeight: { value: 28.97, unit: 'kg/kmol' },
            compressibilityFactor: 0 // Invalid (must be > 0)
          },
          pipe: {
            diameter: { value: 0.1, unit: 'm' },
            length: { value: 100, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }
          },
          inletPressure: { value: 101325, unit: 'Pa' },
          massFlowRate: { value: 0.1, unit: 'kg/s' },
          temperature: { value: 273.15, unit: 'K' },
          model: 'isothermal'
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle choked flow conditions', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/pressure-drop',
        payload: {
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
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      // Should be choked
      expect(result.isChoked).toBe(true);
      expect(result.outletPressure.value).toBe(0);
      expect(result.pressureDrop.value).toBe(5e6);
      
      // Should have warning about choked flow
      const hasChokedWarning = result.warnings.some((w: any) => 
        typeof w === 'object' && 'message' in w && w.message.includes('choked')
      );
      expect(hasChokedWarning).toBe(true);
    });

    it('should handle model selection correctly', async () => {
      const isothermalResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/pressure-drop',
        payload: {
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
        }
      });

      const adiabaticResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/pressure-drop',
        payload: {
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
          model: 'adiabatic'
        }
      });

      expect(isothermalResponse.statusCode).toBe(200);
      expect(adiabaticResponse.statusCode).toBe(200);
      
      const isothermalResult = JSON.parse(isothermalResponse.payload);
      const adiabaticResult = JSON.parse(adiabaticResponse.payload);
      
      expect(isothermalResult.metadata.calculations.model).toBe('isothermal');
      expect(adiabaticResult.metadata.calculations.model).toBe('adiabatic');
      
      // Should have different sonic velocities
      expect(isothermalResult.metadata.calculations.sonicVelocity).not.toBe(
        adiabaticResult.metadata.calculations.sonicVelocity
      );
    });
  });

  describe('POST /api/v1/gas/fanno', () => {
    it('should calculate Fanno line correctly', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/fanno',
        payload: {
          state0: {
            pressure: 101325,
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 0.3,
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          length: { value: 10, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          frictionFactor: 0.02,
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.states.length).toBeGreaterThan(1);
      expect(result.maxLength).toBeGreaterThan(0);
      expect(typeof result.isChoked).toBe('boolean');
      expect(result.metadata.calculations.type).toBe('fanno');
      expect(result.metadata.calculations.specificHeatRatio).toBe(1.4);
    });

    it('should show monotonic trends along Fanno line', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/fanno',
        payload: {
          state0: {
            pressure: 101325,
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 0.3,
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          length: { value: 5, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          frictionFactor: 0.02,
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      // Check monotonic trends
      const machNumbers = result.states.map((s: any) => s.machNumber);
      const velocities = result.states.map((s: any) => s.velocity);
      
      // Mach number should increase
      for (let i = 1; i < machNumbers.length; i++) {
        expect(machNumbers[i]).toBeGreaterThanOrEqual(machNumbers[i - 1]);
      }
      
      // Velocity should increase
      for (let i = 1; i < velocities.length; i++) {
        expect(velocities[i]).toBeGreaterThanOrEqual(velocities[i - 1]);
      }
    });

    it('should handle choked flow conditions', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/fanno',
        payload: {
          state0: {
            pressure: 101325,
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 0.3,
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          length: { value: 1000, unit: 'm' }, // Very long duct
          diameter: { value: 0.01, unit: 'm' }, // Very small diameter
          frictionFactor: 0.02,
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      // Should be choked
      expect(result.isChoked).toBe(true);
      
      // Should have warning about choked flow
      const hasChokedWarning = result.warnings.some((w: any) => 
        typeof w === 'object' && 'message' in w && w.message.includes('choked')
      );
      expect(hasChokedWarning).toBe(true);
    });

    it('should return 400 for supersonic initial conditions', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/fanno',
        payload: {
          state0: {
            pressure: 101325,
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 1.5, // Supersonic - should fail
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          frictionFactor: 0.02,
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid inputs', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/fanno',
        payload: {
          state0: {
            pressure: 0, // Invalid pressure
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 0.3,
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          frictionFactor: 0.02,
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/v1/gas/rayleigh', () => {
    it('should calculate Rayleigh line with heat addition', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/rayleigh',
        payload: {
          state0: {
            pressure: 101325,
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 0.3,
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          heatTransferRate: { value: 1000, unit: 'W/m²' }, // Heat addition
          diameter: { value: 0.1, unit: 'm' },
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.states.length).toBeGreaterThan(1);
      expect(result.maxHeatTransfer).toBeGreaterThan(0);
      expect(typeof result.isChoked).toBe('boolean');
      expect(result.metadata.calculations.type).toBe('rayleigh');
      expect(result.metadata.calculations.specificHeatRatio).toBe(1.4);
    });

    it('should calculate Rayleigh line with heat removal', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/rayleigh',
        payload: {
          state0: {
            pressure: 101325,
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 0.3,
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          heatTransferRate: { value: -1000, unit: 'W/m²' }, // Heat removal
          diameter: { value: 0.1, unit: 'm' },
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.states.length).toBeGreaterThan(1);
      expect(result.maxHeatTransfer).toBeGreaterThan(0);
      expect(typeof result.isChoked).toBe('boolean');
    });

    it('should show correct trends for heat addition', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/rayleigh',
        payload: {
          state0: {
            pressure: 101325,
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 0.3,
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          heatTransferRate: { value: 500, unit: 'W/m²' }, // Heat addition
          diameter: { value: 0.1, unit: 'm' },
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      // Check trends for heat addition
      const temperatures = result.states.map((s: any) => s.temperature);
      const machNumbers = result.states.map((s: any) => s.machNumber);
      
      // Temperature should increase with heat addition
      for (let i = 1; i < temperatures.length; i++) {
        expect(temperatures[i]).toBeGreaterThanOrEqual(temperatures[i - 1]);
      }
      
      // Mach number should decrease with heat addition (for subsonic flow)
      for (let i = 1; i < machNumbers.length; i++) {
        expect(machNumbers[i]).toBeLessThanOrEqual(machNumbers[i - 1]);
      }
    });

    it('should show correct trends for heat removal', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/rayleigh',
        payload: {
          state0: {
            pressure: 101325,
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 0.3,
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          heatTransferRate: { value: -500, unit: 'W/m²' }, // Heat removal
          diameter: { value: 0.1, unit: 'm' },
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      // Check trends for heat removal
      const temperatures = result.states.map((s: any) => s.temperature);
      const machNumbers = result.states.map((s: any) => s.machNumber);
      
      // Temperature should decrease with heat removal
      for (let i = 1; i < temperatures.length; i++) {
        expect(temperatures[i]).toBeLessThanOrEqual(temperatures[i - 1]);
      }
      
      // Mach number should increase with heat removal (for subsonic flow)
      for (let i = 1; i < machNumbers.length; i++) {
        expect(machNumbers[i]).toBeGreaterThanOrEqual(machNumbers[i - 1]);
      }
    });

    it('should handle high heat transfer rates', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/rayleigh',
        payload: {
          state0: {
            pressure: 101325,
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 0.3,
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          heatTransferRate: { value: 10000, unit: 'W/m²' }, // Very high heat addition
          diameter: { value: 0.1, unit: 'm' },
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      // Should have significant changes in properties
      const initialTemp = result.states[0].temperature;
      const finalTemp = result.states[result.states.length - 1].temperature;
      expect(finalTemp).toBeGreaterThan(initialTemp);
      
      const initialMach = result.states[0].machNumber;
      const finalMach = result.states[result.states.length - 1].machNumber;
      expect(finalMach).toBeLessThan(initialMach); // Heat addition decreases Mach for subsonic
    });

    it('should handle supersonic initial conditions', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/rayleigh',
        payload: {
          state0: {
            pressure: 101325,
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 2.0, // Supersonic
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          heatTransferRate: { value: 1000, unit: 'W/m²' },
          diameter: { value: 0.1, unit: 'm' },
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      // Should work for supersonic conditions
      expect(result.states.length).toBeGreaterThan(1);
      expect(result.metadata.calculations.type).toBe('rayleigh');
    });

    it('should return 400 for invalid inputs', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/gas/rayleigh',
        payload: {
          state0: {
            pressure: 101325,
            temperature: 298.15,
            density: 1.225,
            velocity: 100,
            machNumber: 0.3,
            stagnationPressure: 105000,
            stagnationTemperature: 303.15
          },
          heatTransferRate: { value: 1000, unit: 'W/m²' },
          diameter: { value: 0, unit: 'm' }, // Invalid diameter
          specificHeatRatio: 1.4,
          molecularWeight: { value: 28.97, unit: 'kg/kmol' }
        }
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
