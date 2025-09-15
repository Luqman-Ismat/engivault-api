import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../index';

describe('Heat Exchanger Routes', () => {
  let app: Awaited<ReturnType<typeof build>>;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/thermal/hx-drop', () => {
    const baseGeometry = {
      tubeDiameter: { value: 0.019, unit: 'm' },
      tubeLength: { value: 3.0, unit: 'm' },
      numberOfTubes: 100,
      tubePitch: { value: 0.025, unit: 'm' },
      tubeThickness: { value: 0.002, unit: 'm' },
      shellDiameter: { value: 0.3, unit: 'm' },
      baffleSpacing: { value: 0.25, unit: 'm' },
      baffleCut: 25,
      tubeLayout: 'triangular' as const,
    };

    const baseFluidProperties = {
      density: { value: 998.2, unit: 'kg/m³' },
      viscosity: { value: 1.002e-3, unit: 'Pa·s' },
    };

    it('should calculate tube side pressure drop', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: baseGeometry,
          passes: 2,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.pressureDropPercent).toBeGreaterThan(0);
      expect(result.velocity.value).toBeGreaterThan(0);
      expect(result.reynoldsNumber).toBeGreaterThan(0);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.flowArea.value).toBeGreaterThan(0);
      expect(result.equivalentDiameter.value).toBe(
        baseGeometry.tubeDiameter.value
      );
      expect(result.flowLength.value).toBeGreaterThan(
        baseGeometry.tubeLength.value * 2
      );
      expect(result.numberOfCrossings).toBe(0);
      expect(result.baffleSpacing.value).toBe(0);
      expect(result.metadata.calculations.correlation).toContain(
        'Darcy-Weisbach'
      );
      expect(['laminar', 'turbulent', 'transition']).toContain(
        result.metadata.calculations.flowRegime
      );
    });

    it('should calculate shell side pressure drop', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: baseGeometry,
          passes: 2,
          massFlux: { value: 200, unit: 'kg/(m²·s)' },
          fluidSide: 'shell',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.pressureDrop.value).toBeGreaterThan(0);
      expect(result.pressureDropPercent).toBeGreaterThan(0);
      expect(result.velocity.value).toBeGreaterThan(0);
      expect(result.reynoldsNumber).toBeGreaterThan(0);
      expect(result.frictionFactor).toBeGreaterThan(0);
      expect(result.flowArea.value).toBeGreaterThan(0);
      expect(result.equivalentDiameter.value).toBeGreaterThan(0);
      expect(result.flowLength.value).toBe(baseGeometry.tubeLength.value);
      expect(result.numberOfCrossings).toBeGreaterThan(0);
      expect(result.baffleSpacing.value).toBe(baseGeometry.baffleSpacing.value);
      expect(result.metadata.calculations.correlation).toContain(
        'Bell-Delaware'
      );
      expect(['laminar', 'turbulent', 'transition']).toContain(
        result.metadata.calculations.flowRegime
      );
    });

    it('should handle different tube layouts', async () => {
      const triangularResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: { ...baseGeometry, tubeLayout: 'triangular' },
          passes: 2,
          massFlux: { value: 200, unit: 'kg/(m²·s)' },
          fluidSide: 'shell',
          fluidProperties: baseFluidProperties,
        },
      });

      const squareResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: { ...baseGeometry, tubeLayout: 'square' },
          passes: 2,
          massFlux: { value: 200, unit: 'kg/(m²·s)' },
          fluidSide: 'shell',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(triangularResponse.statusCode).toBe(200);
      expect(squareResponse.statusCode).toBe(200);

      const triangularResult = JSON.parse(triangularResponse.payload);
      const squareResult = JSON.parse(squareResponse.payload);

      expect(triangularResult.equivalentDiameter.value).not.toBe(
        squareResult.equivalentDiameter.value
      );
      expect(triangularResult.pressureDrop.value).not.toBe(
        squareResult.pressureDrop.value
      );
    });

    it('should handle different baffle spacing', async () => {
      const tightBaffleResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: {
            ...baseGeometry,
            baffleSpacing: { value: 0.1, unit: 'm' },
          },
          passes: 2,
          massFlux: { value: 200, unit: 'kg/(m²·s)' },
          fluidSide: 'shell',
          fluidProperties: baseFluidProperties,
        },
      });

      const looseBaffleResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: {
            ...baseGeometry,
            baffleSpacing: { value: 0.5, unit: 'm' },
          },
          passes: 2,
          massFlux: { value: 200, unit: 'kg/(m²·s)' },
          fluidSide: 'shell',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(tightBaffleResponse.statusCode).toBe(200);
      expect(looseBaffleResponse.statusCode).toBe(200);

      const tightResult = JSON.parse(tightBaffleResponse.payload);
      const looseResult = JSON.parse(looseBaffleResponse.payload);

      expect(tightResult.numberOfCrossings).toBeGreaterThan(
        looseResult.numberOfCrossings
      );
      expect(tightResult.pressureDrop.value).toBeGreaterThan(
        looseResult.pressureDrop.value
      );
    });

    it('should handle custom roughness', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: baseGeometry,
          passes: 2,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
          roughness: { value: 0.000045, unit: 'm' },
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.pressureDrop.value).toBeGreaterThan(0);
      // Check if relativeRoughness exists in metadata
      expect(
        result.metadata.calculations.parameters.relativeRoughness
      ).toBeDefined();
      expect(
        result.metadata.calculations.parameters.relativeRoughness
      ).toBeCloseTo(0.000045 / baseGeometry.tubeDiameter.value, 10);
    });

    it('should handle single pass configuration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: baseGeometry,
          passes: 1,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.flowLength.value).toBe(baseGeometry.tubeLength.value);
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });

    it('should handle multiple passes configuration', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: baseGeometry,
          passes: 4,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.flowLength.value).toBeGreaterThan(
        baseGeometry.tubeLength.value * 4
      );
      expect(result.pressureDrop.value).toBeGreaterThan(0);
    });

    it('should return 400 for invalid tube diameter', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: { ...baseGeometry, tubeDiameter: { value: 0, unit: 'm' } },
          passes: 2,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid tube pitch', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: { ...baseGeometry, tubePitch: { value: 0.01, unit: 'm' } }, // Too small
          passes: 2,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid shell diameter', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: {
            ...baseGeometry,
            shellDiameter: { value: 0.01, unit: 'm' },
          }, // Too small
          passes: 2,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid fluid properties', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: baseGeometry,
          passes: 2,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: {
            density: { value: 0, unit: 'kg/m³' },
            viscosity: { value: 1.002e-3, unit: 'Pa·s' },
          },
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid mass flux', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: baseGeometry,
          passes: 2,
          massFlux: { value: 0, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid passes', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: baseGeometry,
          passes: 0,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid roughness', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: baseGeometry,
          passes: 2,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
          roughness: { value: -0.001, unit: 'm' },
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should show geometry scaling effects', async () => {
      const smallGeometry = {
        ...baseGeometry,
        numberOfTubes: 50,
        tubeLength: { value: 1.5, unit: 'm' },
      };

      const largeGeometry = {
        ...baseGeometry,
        numberOfTubes: 200,
        tubeLength: { value: 6.0, unit: 'm' },
      };

      const smallResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: smallGeometry,
          passes: 2,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
        },
      });

      const largeResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/thermal/hx-drop',
        payload: {
          geometry: largeGeometry,
          passes: 2,
          massFlux: { value: 500, unit: 'kg/(m²·s)' },
          fluidSide: 'tube',
          fluidProperties: baseFluidProperties,
        },
      });

      expect(smallResponse.statusCode).toBe(200);
      expect(largeResponse.statusCode).toBe(200);

      const smallResult = JSON.parse(smallResponse.payload);
      const largeResult = JSON.parse(largeResponse.payload);

      // Flow areas should be the same (based on single tube diameter)
      expect(smallResult.flowArea.value).toBe(largeResult.flowArea.value);

      // Different geometries should have different flow lengths
      expect(smallResult.flowLength.value).not.toBe(
        largeResult.flowLength.value
      );
    });
  });
});
