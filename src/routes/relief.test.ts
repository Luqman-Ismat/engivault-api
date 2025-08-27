import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../app';

describe('Relief Valve API Routes', () => {
  let fastify: any;

  beforeAll(async () => {
    fastify = await build();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('POST /api/v1/safety/relief-size', () => {
    it('should size liquid relief valve successfully', async () => {
      const request = {
        fluidType: 'liquid',
        flow: { value: 100, unit: 'gpm' },
        pressureDrop: { value: 50, unit: 'psi' },
        specificGravity: 1.0,
        dischargeCoefficient: 0.65,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/safety/relief-size',
        payload: request,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.requiredArea.unit).toBe('in²');
      expect(result.requiredArea.value).toBeGreaterThan(0);
      expect(result.flowRegime).toBe('liquid');
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.metadata.calculations.assumptions).toContain(
        'Incompressible liquid flow'
      );
    });

    it('should size choked gas relief valve successfully', async () => {
      const request = {
        fluidType: 'gas',
        flow: { value: 1000, unit: 'scfm' },
        pressureDrop: { value: 100, unit: 'psia' },
        molecularWeight: 29,
        temperature: { value: 530, unit: 'R' },
        backPressure: { value: 50, unit: 'psia' },
        dischargeCoefficient: 0.65,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/safety/relief-size',
        payload: request,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.requiredArea.unit).toBe('in²');
      expect(result.requiredArea.value).toBeGreaterThan(0);
      expect(result.flowRegime).toBe('choked-gas');
      expect(result.criticalPressureRatio).toBeCloseTo(0.528, 3);
      expect(result.backPressureCorrection).toBe(1.0);
      expect(result.metadata.calculations.assumptions).toContain(
        'Isentropic gas flow'
      );
    });

    it('should size non-choked gas relief valve successfully', async () => {
      const request = {
        fluidType: 'gas',
        flow: { value: 500, unit: 'scfm' },
        pressureDrop: { value: 100, unit: 'psia' },
        molecularWeight: 29,
        temperature: { value: 530, unit: 'R' },
        backPressure: { value: 80, unit: 'psia' },
        dischargeCoefficient: 0.65,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/safety/relief-size',
        payload: request,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.requiredArea.unit).toBe('in²');
      expect(result.requiredArea.value).toBeGreaterThan(0);
      expect(result.flowRegime).toBe('non-choked-gas');
      expect(result.backPressureCorrection).toBeLessThan(1.0);
    });

    it('should handle different specific gravities for liquid', async () => {
      const specificGravities = [0.8, 1.0, 1.2, 1.5];
      const areas: number[] = [];

      for (const sg of specificGravities) {
        const request = {
          fluidType: 'liquid',
          flow: { value: 50, unit: 'gpm' },
          pressureDrop: { value: 25, unit: 'psi' },
          specificGravity: sg,
          dischargeCoefficient: 0.65,
        };

        const response = await fastify.inject({
          method: 'POST',
          url: '/api/v1/safety/relief-size',
          payload: request,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.payload);
        areas.push(result.requiredArea.value);
      }

      // Higher SG should result in larger areas
      for (let i = 1; i < areas.length; i++) {
        expect(areas[i]).toBeGreaterThan(areas[i - 1]);
      }
    });

    it('should handle different molecular weights for gas', async () => {
      const molecularWeights = [2, 16, 29, 44]; // H2, CH4, Air, C3H8
      const areas: number[] = [];

      for (const mw of molecularWeights) {
        const request = {
          fluidType: 'gas',
          flow: { value: 1000, unit: 'scfm' },
          pressureDrop: { value: 100, unit: 'psia' },
          molecularWeight: mw,
          temperature: { value: 530, unit: 'R' },
          backPressure: { value: 50, unit: 'psia' },
          dischargeCoefficient: 0.65,
        };

        const response = await fastify.inject({
          method: 'POST',
          url: '/api/v1/safety/relief-size',
          payload: request,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.payload);
        areas.push(result.requiredArea.value);
      }

      // Lower molecular weight should result in smaller areas
      for (let i = 1; i < areas.length; i++) {
        expect(areas[i]).toBeGreaterThan(areas[i - 1]);
      }
    });

    it('should generate warnings for extreme conditions', async () => {
      const request = {
        fluidType: 'liquid',
        flow: { value: 1000, unit: 'gpm' },
        pressureDrop: { value: 0.5, unit: 'psi' }, // Low pressure drop
        specificGravity: 2.5, // High SG
        dischargeCoefficient: 0.3, // Low Kd
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/safety/relief-size',
        payload: request,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(
        result.warnings.some((w: string) => w.includes('Low pressure drop'))
      ).toBe(true);
      expect(
        result.warnings.some((w: string) =>
          w.includes('Specific gravity above 2.0')
        )
      ).toBe(true);
      expect(
        result.warnings.some((w: string) =>
          w.includes('Low discharge coefficient')
        )
      ).toBe(true);
    });

    it('should return validation error for missing gas parameters', async () => {
      const request = {
        fluidType: 'gas',
        flow: { value: 1000, unit: 'scfm' },
        pressureDrop: { value: 100, unit: 'psia' },
        // Missing required gas parameters
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/safety/relief-size',
        payload: request,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain(
        'Molecular weight must be provided and positive for gas flow'
      );
    });

    it('should return validation error for invalid pressure relationship', async () => {
      const request = {
        fluidType: 'gas',
        flow: { value: 1000, unit: 'scfm' },
        pressureDrop: { value: 100, unit: 'psia' },
        molecularWeight: 29,
        temperature: { value: 530, unit: 'R' },
        backPressure: { value: 120, unit: 'psia' }, // Higher than upstream
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/safety/relief-size',
        payload: request,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain(
        'Back pressure must be less than upstream pressure'
      );
    });

    it('should return validation error for negative flow rate', async () => {
      const request = {
        fluidType: 'liquid',
        flow: { value: -10, unit: 'gpm' },
        pressureDrop: { value: 50, unit: 'psi' },
        specificGravity: 1.0,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/safety/relief-size',
        payload: request,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain('Flow rate must be positive');
    });

    it('should return validation error for invalid fluid type', async () => {
      const request = {
        fluidType: 'steam',
        flow: { value: 100, unit: 'gpm' },
        pressureDrop: { value: 50, unit: 'psi' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/safety/relief-size',
        payload: request,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Bad Request');
    });

    it('should return validation error for invalid discharge coefficient', async () => {
      const request = {
        fluidType: 'liquid',
        flow: { value: 100, unit: 'gpm' },
        pressureDrop: { value: 50, unit: 'psi' },
        specificGravity: 1.0,
        dischargeCoefficient: 1.5, // Invalid
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/safety/relief-size',
        payload: request,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Bad Request');
    });
  });

  describe('GET /api/v1/safety/relief-examples', () => {
    it('should return relief valve examples', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/safety/relief-examples',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.examples).toBeInstanceOf(Array);
      expect(result.examples.length).toBeGreaterThan(0);
      expect(result.examples[0]).toHaveProperty('name');
      expect(result.examples[0]).toHaveProperty('description');
      expect(result.examples[0]).toHaveProperty('input');
    });
  });

  describe('GET /api/v1/safety/discharge-coefficients', () => {
    it('should return discharge coefficients', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/safety/discharge-coefficients',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.coefficients).toBeInstanceOf(Array);
      expect(result.coefficients.length).toBeGreaterThan(0);
      expect(result.coefficients[0]).toHaveProperty('type');
      expect(result.coefficients[0]).toHaveProperty('value');
      expect(result.coefficients[0]).toHaveProperty('description');
    });
  });

  describe('GET /api/v1/safety/fluid-properties', () => {
    it('should return fluid properties', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/safety/fluid-properties',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.fluids).toBeInstanceOf(Array);
      expect(result.fluids.length).toBeGreaterThan(0);
      expect(result.fluids[0]).toHaveProperty('name');
      expect(result.fluids[0]).toHaveProperty('type');
    });
  });
});
