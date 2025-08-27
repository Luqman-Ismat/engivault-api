import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import energyRoutes from './energy';

describe('Energy API', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    fastify = Fastify();
    await fastify.register(energyRoutes);
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('POST /api/v1/pumps/energy', () => {
    const validRequest = {
      fluid: {
        density: { value: 998, unit: 'kg/m³' },
        name: 'water',
      },
      pumpEfficiency: 0.75,
      motorEfficiency: 0.9,
      loadProfile: [
        {
          hours: 4000,
          Qset: { value: 0.1, unit: 'm³/s' },
        },
        {
          hours: 3000,
          Qset: { value: 0.15, unit: 'm³/s' },
        },
        {
          hours: 1760,
          Qset: { value: 0.05, unit: 'm³/s' },
        },
      ],
      tariff: {
        rate: 0.12,
        name: 'Residential',
        description: 'Typical residential rate',
      },
      head: { value: 20, unit: 'm' },
    };

    it('should calculate energy consumption successfully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: validRequest,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.totalEnergy).toBeDefined();
      expect(result.totalEnergy.value).toBeGreaterThan(0);
      expect(result.totalEnergy.unit).toBe('kWh/year');

      expect(result.totalCost).toBeDefined();
      expect(result.totalCost.value).toBeGreaterThan(0);
      expect(result.totalCost.unit).toBe('$/year');

      expect(result.averagePower).toBeDefined();
      expect(result.averagePower.value).toBeGreaterThan(0);
      expect(result.averagePower.unit).toBe('W');

      expect(result.loadProfile).toBeInstanceOf(Array);
      expect(result.loadProfile).toHaveLength(3);

      expect(result.efficiency).toBeDefined();
      expect(result.efficiency.averageTotalEfficiency).toBeGreaterThan(0);
      expect(result.efficiency.averageTotalEfficiency).toBeLessThan(1);

      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.totalHours).toBe(8760);
      expect(result.metadata.operatingPoints).toBe(3);
    });

    it('should handle VFD efficiency', async () => {
      const requestWithVFD = {
        ...validRequest,
        vfdEfficiency: 0.95,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: requestWithVFD,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.efficiency.averageVfdEfficiency).toBe(0.95);
      expect(result.efficiency.averageTotalEfficiency).toBeLessThan(0.675); // Should be lower due to VFD
    });

    it('should handle speed variations', async () => {
      const requestWithSpeed = {
        ...validRequest,
        loadProfile: [
          {
            hours: 4000,
            Qset: { value: 0.1, unit: 'm³/s' },
            speed: 1.0,
          },
          {
            hours: 3000,
            Qset: { value: 0.1, unit: 'm³/s' },
            speed: 0.5,
          },
          {
            hours: 1760,
            Qset: { value: 0.1, unit: 'm³/s' },
            speed: 0.25,
          },
        ],
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: requestWithSpeed,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.loadProfile).toHaveLength(3);

      // Lower speeds should result in lower power consumption
      const powers = result.loadProfile.map((p: any) => p.power.value);
      expect(powers[0]).toBeGreaterThan(powers[1]); // Full speed > half speed
      expect(powers[1]).toBeGreaterThan(powers[2]); // Half speed > quarter speed
    });

    it('should handle different fluids', async () => {
      const airRequest = {
        ...validRequest,
        fluid: {
          density: { value: 1.225, unit: 'kg/m³' },
          name: 'air',
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: airRequest,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.totalEnergy.value).toBeGreaterThan(0);
      expect(result.totalEnergy.value).toBeLessThan(1000); // Air should use much less energy than water
    });

    it('should generate warnings for low efficiency', async () => {
      const lowEfficiencyRequest = {
        ...validRequest,
        pumpEfficiency: 0.3, // Very low efficiency
        motorEfficiency: 0.5, // Very low efficiency
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: lowEfficiencyRequest,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some((w: string) => w.includes('efficiency'))
      ).toBe(true);
    });

    it('should return validation error for negative fluid density', async () => {
      const invalidRequest = {
        ...validRequest,
        fluid: {
          density: { value: -998, unit: 'kg/m³' },
          name: 'water',
        },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain('Fluid density must be positive');
    });

    it('should return validation error for negative head', async () => {
      const invalidRequest = {
        ...validRequest,
        head: { value: -20, unit: 'm' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain('Head must be positive');
    });

    it('should return validation error for empty load profile', async () => {
      const invalidRequest = {
        ...validRequest,
        loadProfile: [],
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for negative tariff rate', async () => {
      const invalidRequest = {
        ...validRequest,
        tariff: { rate: -0.12, name: 'Invalid' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for negative hours in load profile', async () => {
      const invalidRequest = {
        ...validRequest,
        loadProfile: [
          {
            hours: -1000,
            Qset: { value: 0.1, unit: 'm³/s' },
          },
        ],
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for negative flow rate in load profile', async () => {
      const invalidRequest = {
        ...validRequest,
        loadProfile: [
          {
            hours: 1000,
            Qset: { value: -0.1, unit: 'm³/s' },
          },
        ],
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for invalid speed ratio', async () => {
      const invalidRequest = {
        ...validRequest,
        loadProfile: [
          {
            hours: 1000,
            Qset: { value: 0.1, unit: 'm³/s' },
            speed: 1.5, // Invalid speed
          },
        ],
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for excessive total hours', async () => {
      const invalidRequest = {
        ...validRequest,
        loadProfile: [
          {
            hours: 10000, // Exceeds 9636 hours (8760 + 10%)
            Qset: { value: 0.1, unit: 'm³/s' },
          },
        ],
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for invalid pump efficiency', async () => {
      const invalidRequest = {
        ...validRequest,
        pumpEfficiency: 1.1,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
    });

    it('should return validation error for invalid request body structure', async () => {
      const invalidRequest = {
        fluid: 'invalid',
        pumpEfficiency: 0.75,
        motorEfficiency: 0.9,
        loadProfile: [
          {
            hours: 1000,
            Qset: { value: 0.1, unit: 'm³/s' },
          },
        ],
        tariff: { rate: 0.12 },
        head: { value: 20, unit: 'm' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/pumps/energy',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });
  });

  describe('GET /api/v1/pumps/load-profiles', () => {
    it('should return example load profiles', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/pumps/load-profiles',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.profiles).toBeInstanceOf(Array);
      expect(result.profiles).toHaveLength(4);

      // Check profile names
      const profileNames = result.profiles.map((p: any) => p.name);
      expect(profileNames).toContain('Constant Load');
      expect(profileNames).toContain('Two-Speed Operation');
      expect(profileNames).toContain('Seasonal Variation');
      expect(profileNames).toContain('Variable Speed');

      // Check that each profile has points
      result.profiles.forEach((profile: any) => {
        expect(profile.description).toBeDefined();
        expect(profile.points).toBeInstanceOf(Array);
        expect(profile.points.length).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /api/v1/pumps/energy-tariffs', () => {
    it('should return example energy tariffs', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/pumps/energy-tariffs',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.tariffs).toBeInstanceOf(Array);
      expect(result.tariffs).toHaveLength(5);

      // Check tariff names
      const tariffNames = result.tariffs.map((t: any) => t.name);
      expect(tariffNames).toContain('Residential');
      expect(tariffNames).toContain('Commercial');
      expect(tariffNames).toContain('Industrial');
      expect(tariffNames).toContain('High Rate');
      expect(tariffNames).toContain('Low Rate');

      // Check that each tariff has required fields
      result.tariffs.forEach((tariff: any) => {
        expect(tariff.rate).toBeGreaterThan(0);
        expect(tariff.description).toBeDefined();
        expect(tariff.region).toBeDefined();
      });
    });
  });
});
