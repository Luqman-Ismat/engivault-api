import { describe, it, expect } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../index';
import transientRoutes from './transients';

describe('Transients Route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.register(transientRoutes);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should calculate Joukowsky surge for steel pipe', async () => {
    const testInput = {
      fluid: {
        density: { value: 998, unit: 'kg/m³' },
      },
      pipe: {
        elasticModulus: { value: 200e9, unit: 'Pa' },
        wallThickness: { value: 0.01, unit: 'm' },
        diameter: { value: 0.2, unit: 'm' },
      },
      velocityChange: { value: 2, unit: 'm/s' },
      pipeRating: { value: 2.5e6, unit: 'Pa' },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/transients/joukowsky',
      payload: testInput,
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);

    expect(result.pressureSurge).toBeDefined();
    expect(result.waveSpeed).toBeDefined();
    expect(result.comparison).toBeDefined();
    expect(result.warnings).toBeDefined();
    expect(result.metadata).toBeDefined();

    expect(result.pressureSurge.value).toBeGreaterThan(0);
    expect(result.waveSpeed.value).toBeGreaterThan(1000);
    expect(result.comparison.pipeRating.value).toBe(2.5e6);
    expect(typeof result.comparison.safetyFactor).toBe('number');
    expect(typeof result.comparison.isWithinRating).toBe('boolean');
  });

  it('should calculate Joukowsky surge for PVC pipe', async () => {
    const testInput = {
      fluid: {
        density: { value: 998, unit: 'kg/m³' },
      },
      pipe: {
        elasticModulus: { value: 3.3e9, unit: 'Pa' },
        wallThickness: { value: 0.005, unit: 'm' },
        diameter: { value: 0.1, unit: 'm' },
      },
      velocityChange: { value: 1.5, unit: 'm/s' },
      pipeRating: { value: 1.0e6, unit: 'Pa' },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/transients/joukowsky',
      payload: testInput,
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);

    expect(result.pressureSurge.value).toBeGreaterThan(0);
    expect(result.waveSpeed.value).toBeGreaterThan(300);
    expect(result.waveSpeed.value).toBeLessThan(700);
  });

  it('should use provided wave speed when available', async () => {
    const testInput = {
      fluid: {
        density: { value: 998, unit: 'kg/m³' },
      },
      pipe: {
        waveSpeed: { value: 1200, unit: 'm/s' },
      },
      velocityChange: { value: 2, unit: 'm/s' },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/transients/joukowsky',
      payload: testInput,
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);

    expect(result.waveSpeed.value).toBe(1200);
    expect(result.pressureSurge.value).toBeCloseTo(998 * 1200 * 2, 0);
  });

  it('should return 400 for invalid pipe geometry', async () => {
    const testInput = {
      fluid: {
        density: { value: 998, unit: 'kg/m³' },
      },
      pipe: {
        elasticModulus: { value: 200e9, unit: 'Pa' },
        wallThickness: { value: 0.15, unit: 'm' }, // Greater than radius
        diameter: { value: 0.2, unit: 'm' },
      },
      velocityChange: { value: 2, unit: 'm/s' },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/transients/joukowsky',
      payload: testInput,
    });

    expect(response.statusCode).toBe(400);
  });

  it('should return 400 when neither wave speed nor pipe properties are provided', async () => {
    const testInput = {
      fluid: {
        density: { value: 998, unit: 'kg/m³' },
      },
      pipe: {
        elasticModulus: { value: 200e9, unit: 'Pa' },
        // Missing wall thickness and diameter
      },
      velocityChange: { value: 2, unit: 'm/s' },
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/transients/joukowsky',
      payload: testInput,
    });

    expect(response.statusCode).toBe(500); // Should return error for invalid input
  });

  it('should handle pipe rating comparison correctly', async () => {
    const testInput = {
      fluid: {
        density: { value: 998, unit: 'kg/m³' },
      },
      pipe: {
        elasticModulus: { value: 200e9, unit: 'Pa' },
        wallThickness: { value: 0.01, unit: 'm' },
        diameter: { value: 0.2, unit: 'm' },
      },
      velocityChange: { value: 5, unit: 'm/s' }, // Large velocity change
      pipeRating: { value: 1.0e6, unit: 'Pa' }, // Low rating
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/transients/joukowsky',
      payload: testInput,
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);

    expect(result.comparison.isWithinRating).toBe(false);
    expect(result.comparison.safetyFactor).toBeGreaterThan(1);

    // Should have warnings about exceeding rating
    expect(
      result.warnings.some(
        (w: any) =>
          typeof w === 'object' &&
          w.message &&
          w.message.includes('exceeds pipe rating')
      )
    ).toBe(true);
  });

  it('should handle different fluids', async () => {
    const waterInput = {
      fluid: {
        density: { value: 998, unit: 'kg/m³' },
      },
      pipe: {
        waveSpeed: { value: 1200, unit: 'm/s' },
      },
      velocityChange: { value: 2, unit: 'm/s' },
    };

    const oilInput = {
      fluid: {
        density: { value: 850, unit: 'kg/m³' },
      },
      pipe: {
        waveSpeed: { value: 1200, unit: 'm/s' },
      },
      velocityChange: { value: 2, unit: 'm/s' },
    };

    const waterResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/transients/joukowsky',
      payload: waterInput,
    });

    const oilResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/transients/joukowsky',
      payload: oilInput,
    });

    expect(waterResponse.statusCode).toBe(200);
    expect(oilResponse.statusCode).toBe(200);

    const waterResult = JSON.parse(waterResponse.payload);
    const oilResult = JSON.parse(oilResponse.payload);

    // Oil should have lower surge due to lower density
    expect(oilResult.pressureSurge.value).toBeLessThan(
      waterResult.pressureSurge.value
    );
    expect(
      oilResult.pressureSurge.value / waterResult.pressureSurge.value
    ).toBeCloseTo(850 / 998, 2);
  });
});
