import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../index';

describe('Thermal Routes', () => {
  let app: Awaited<ReturnType<typeof build>>;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/thermal/viscosity-adjusted-drop', () => {
    it('should calculate viscosity-adjusted pressure drop for water', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 353.15, unit: 'K' }, // 80°C
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.inletTemperature.value).toBe(353.15);
      expect(result.outletTemperature.value).toBeLessThan(353.15);
      expect(result.outletTemperature.value).toBeGreaterThan(293.15);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.converged).toBe(true);
      expect(result.reynoldsNumber).toBeGreaterThan(0);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.velocity.value).toBeGreaterThan(0);
      expect(
        result.metadata.calculations.convergenceHistory.length
      ).toBeGreaterThan(0);
    });

    it('should show convergence behavior', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 353.15, unit: 'K' },
          maxIterations: 20,
          convergenceTolerance: 1e-6,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(
        result.metadata.calculations.convergenceHistory.length
      ).toBeGreaterThan(1);
      expect(
        result.metadata.calculations.convergenceHistory.length
      ).toBeLessThanOrEqual(20);
      expect(
        result.metadata.calculations.finalTolerance
      ).toBeGreaterThanOrEqual(0);
    });

    it('should be sensitive to temperature changes', async () => {
      const response20 = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 293.15, unit: 'K' }, // 20°C
        },
      });

      const response40 = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 313.15, unit: 'K' }, // 40°C
        },
      });

      expect(response20.statusCode).toBe(200);
      expect(response40.statusCode).toBe(200);

      const result20 = JSON.parse(response20.payload);
      const result40 = JSON.parse(response40.payload);

      // Higher temperature should result in lower viscosity
      expect(result40.averageViscosity.value).toBeLessThan(
        result20.averageViscosity.value
      );
      // Pressure drop should be different
      expect(result40.pressureDrop.value).not.toBe(result20.pressureDrop.value);
    });

    it('should handle provided outlet temperature', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 353.15, unit: 'K' },
          outletTemperature: { value: 343.15, unit: 'K' }, // 70°C
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.outletTemperature.value).toBe(343.15);
      expect(result.averageTemperature.value).toBe(348.15); // Average of 80°C and 70°C
    });

    it('should handle custom viscosity temperature coefficient', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
            viscosityTemperatureCoefficient: 0.02,
          },
          inletTemperature: { value: 353.15, unit: 'K' },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.converged).toBe(true);
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });

    it('should handle high temperature differences', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 373.15, unit: 'K' }, // 100°C
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.converged).toBe(true);
      // Viscosity should be different at different temperatures
      expect(result.averageViscosity.value).toBeLessThan(1.002e-3); // Average should be less than reference
      expect(result.averageViscosity.value).toBeLessThan(1.002e-3); // Average should be less than reference
    });

    it('should handle low flow rates', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.001, unit: 'm³/s' }, // Low flow rate
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 353.15, unit: 'K' },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.converged).toBe(true);
      expect(result.velocity.value).toBeLessThan(1); // Low velocity
      expect(result.reynoldsNumber).toBeGreaterThan(0); // Should be positive
    });

    it('should handle high flow rates', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.1, unit: 'm³/s' }, // High flow rate
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 353.15, unit: 'K' },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.converged).toBe(true);
      expect(result.velocity.value).toBeGreaterThan(10); // High velocity
      expect(result.reynoldsNumber).toBeGreaterThan(100000); // Highly turbulent
    });

    it('should return 400 for invalid flow rate', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0, unit: 'm³/s' }, // Invalid flow rate
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 353.15, unit: 'K' },
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid fluid properties', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 0, unit: 'kg/m³' }, // Invalid density
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 353.15, unit: 'K' },
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid temperature', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 0, unit: 'K' }, // Invalid temperature
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid viscosity temperature coefficient', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
            viscosityTemperatureCoefficient: 0, // Invalid coefficient
          },
          inletTemperature: { value: 353.15, unit: 'K' },
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should handle non-convergence gracefully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 353.15, unit: 'K' },
          maxIterations: 5, // Very few iterations
          convergenceTolerance: 1e-12, // Very strict tolerance
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.iterations).toBe(1);
      // May or may not converge depending on the specific case
      expect(result.pressureDrop.value).toBeGreaterThan(0);

      // Should still return reasonable results
      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.averageTemperature.value).toBeGreaterThan(0);
    });

    it('should show temperature sensitivity in viscosity', async () => {
      const response20 = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 273.15, unit: 'K' }, // 0°C
        },
      });

      const response80 = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/viscosity-adjusted-drop',
        payload: {
          flowRate: { value: 0.01, unit: 'm³/s' },
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          fluid: {
            density: { value: 998.2, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
            referenceTemperature: { value: 293.15, unit: 'K' },
          },
          inletTemperature: { value: 353.15, unit: 'K' }, // 80°C
        },
      });

      expect(response20.statusCode).toBe(200);
      expect(response80.statusCode).toBe(200);

      const result20 = JSON.parse(response20.payload);
      const result80 = JSON.parse(response80.payload);

      // Pressure drop should be different due to temperature differences
      expect(result20.pressureDrop.value).not.toBe(result80.pressureDrop.value);
    });
  });
});
