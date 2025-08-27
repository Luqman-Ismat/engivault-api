import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Fastify from 'fastify';
import valveRoutes from './valves';

describe('Valve API', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    fastify = Fastify();
    await fastify.register(valveRoutes);
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('POST /api/v1/valves/size', () => {
    const validRequest = {
      flow: { value: 50, unit: 'gpm' },
      pressureDrop: { value: 10, unit: 'psi' },
      specificGravity: 1.0,
      trimCharacteristic: {
        type: 'equal-percentage',
        description: 'Equal percentage for temperature control',
      },
    };

    it('should size valve successfully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: validRequest,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.cv).toBeDefined();
      expect(result.cv.value).toBeCloseTo(15.81, 2);
      expect(result.cv.unit).toBe('gpm/psi^0.5');

      expect(result.kv).toBeDefined();
      expect(result.kv.value).toBeCloseTo(13.68, 2);
      expect(result.kv.unit).toBe('m³/h/bar^0.5');

      expect(result.valveAuthority).toBe(0.5); // Default assumption
      expect(result.chokedFlow).toBeDefined();
      expect(result.chokedFlow.isChoked).toBe(false);
      expect(result.chokedFlow.likelihood).toBe('none');
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.metadata).toBeDefined();
    });

    it('should handle choked flow analysis', async () => {
      const requestWithChokedAnalysis = {
        ...validRequest,
        upstreamPressure: { value: 101325, unit: 'Pa' },
        fluidName: 'water',
        temperature: { value: 293.15, unit: 'K' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: requestWithChokedAnalysis,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.chokedFlow.criticalPressureDrop.value).toBeGreaterThan(0);
      expect(result.chokedFlow.actualPressureDrop).toEqual(
        validRequest.pressureDrop
      );
    });

    it('should calculate valve authority when pressures provided', async () => {
      const requestWithPressures = {
        ...validRequest,
        pressureDrop: { value: 1, unit: 'psi' }, // Reduced pressure drop to be within actual pressure drop
        upstreamPressure: { value: 101325, unit: 'Pa' },
        downstreamPressure: { value: 90000, unit: 'Pa' }, // Different pressures
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: requestWithPressures,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.valveAuthority).toBeGreaterThan(0);
      expect(result.valveAuthority).toBeLessThan(1);
    });

    it('should handle different trim characteristics', async () => {
      const trimTypes = [
        'linear',
        'equal-percentage',
        'quick-opening',
        'modified-parabolic',
      ];

      for (const trimType of trimTypes) {
        const requestWithTrim = {
          ...validRequest,
          trimCharacteristic: { type: trimType },
        };

        const response = await fastify.inject({
          method: 'POST',
          url: '/api/v1/valves/size',
          payload: requestWithTrim,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.payload);

        expect(result.cv.value).toBeCloseTo(15.81, 2); // Cv should be same for same flow/pressure
        expect(result.kv.value).toBeCloseTo(13.68, 2);
      }
    });

    it('should handle different specific gravities', async () => {
      const specificGravities = [0.8, 1.0, 1.2, 1.5];

      for (const sg of specificGravities) {
        const requestWithSG = {
          ...validRequest,
          specificGravity: sg,
        };

        const response = await fastify.inject({
          method: 'POST',
          url: '/api/v1/valves/size',
          payload: requestWithSG,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.payload);

        // Higher SG should result in higher Cv
        const expectedCv = 50 * Math.sqrt(sg / 10);
        expect(result.cv.value).toBeCloseTo(expectedCv, 2);
      }
    });

    it('should handle different pressure drops', async () => {
      const pressureDrops = [5, 10, 25, 50];

      for (const deltaP of pressureDrops) {
        const requestWithDeltaP = {
          ...validRequest,
          pressureDrop: { value: deltaP, unit: 'psi' },
        };

        const response = await fastify.inject({
          method: 'POST',
          url: '/api/v1/valves/size',
          payload: requestWithDeltaP,
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.payload);

        // Higher pressure drop should result in lower Cv
        const expectedCv = 50 * Math.sqrt(1.0 / deltaP);
        expect(result.cv.value).toBeCloseTo(expectedCv, 2);
      }
    });

    it('should generate warnings for low valve authority', async () => {
      const requestWithLowAuthority = {
        ...validRequest,
        upstreamPressure: { value: 101325, unit: 'Pa' },
        downstreamPressure: { value: 90000, unit: 'Pa' }, // Different pressures
        pressureDrop: { value: 0.1, unit: 'psi' }, // Very low pressure drop
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: requestWithLowAuthority,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w: string) => w.includes('authority'))).toBe(
        true
      );
    });

    it('should generate warnings for high pressure drop', async () => {
      const requestWithHighPressureDrop = {
        ...validRequest,
        pressureDrop: { value: 150, unit: 'psi' }, // Very high pressure drop
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: requestWithHighPressureDrop,
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some((w: string) => w.includes('pressure drop'))
      ).toBe(true);
    });

    it('should return validation error for negative flow rate', async () => {
      const invalidRequest = {
        ...validRequest,
        flow: { value: -50, unit: 'gpm' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain('Flow rate must be positive');
    });

    it('should return validation error for negative pressure drop', async () => {
      const invalidRequest = {
        ...validRequest,
        pressureDrop: { value: -10, unit: 'psi' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain('Pressure drop must be positive');
    });

    it('should return validation error for negative specific gravity', async () => {
      const invalidRequest = {
        ...validRequest,
        specificGravity: -1.0,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for invalid trim characteristic', async () => {
      const invalidRequest = {
        ...validRequest,
        trimCharacteristic: { type: 'invalid' },
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
    });

    it('should return validation error for invalid pressure recovery factor', async () => {
      const invalidRequest = {
        ...validRequest,
        pressureRecoveryFactor: 1.5,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Bad Request');
      if (result.details) {
        expect(result.details).toBeInstanceOf(Array);
      }
    });

    it('should return validation error for invalid pressure relationship', async () => {
      const invalidRequest = {
        ...validRequest,
        upstreamPressure: { value: 100000, unit: 'Pa' },
        downstreamPressure: { value: 110000, unit: 'Pa' }, // Downstream > upstream
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain(
        'Upstream pressure must be greater than downstream pressure'
      );
    });

    it('should return validation error for out-of-range temperature', async () => {
      const invalidRequest = {
        ...validRequest,
        temperature: { value: 100, unit: 'K' }, // Too cold
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/valves/size',
        payload: invalidRequest,
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);

      expect(result.error).toBe('Invalid input parameters');
      expect(result.details).toContain(
        'Temperature should be between 200K and 600K'
      );
    });
  });

  describe('GET /api/v1/valves/trim-characteristics', () => {
    it('should return valve trim characteristics', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/valves/trim-characteristics',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.characteristics).toBeInstanceOf(Array);
      expect(result.characteristics).toHaveLength(4);

      // Check characteristic types
      const types = result.characteristics.map((c: any) => c.type);
      expect(types).toContain('linear');
      expect(types).toContain('equal-percentage');
      expect(types).toContain('quick-opening');
      expect(types).toContain('modified-parabolic');

      // Check that each characteristic has required fields
      result.characteristics.forEach((characteristic: any) => {
        expect(characteristic.name).toBeDefined();
        expect(characteristic.description).toBeDefined();
        expect(characteristic.typicalFL).toBeGreaterThan(0);
        expect(characteristic.typicalFL).toBeLessThan(1);
        expect(characteristic.applications).toBeInstanceOf(Array);
        expect(characteristic.applications.length).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /api/v1/valves/sizing-examples', () => {
    it('should return valve sizing examples', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/valves/sizing-examples',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);

      expect(result.examples).toBeInstanceOf(Array);
      expect(result.examples).toHaveLength(4);

      // Check example names
      const names = result.examples.map((e: any) => e.name);
      expect(names).toContain('Water Flow Control');
      expect(names).toContain('Chemical Process Control');
      expect(names).toContain('Low Flow Control');
      expect(names).toContain('High Pressure Steam');

      // Check that each example has required fields
      result.examples.forEach((example: any) => {
        expect(example.description).toBeDefined();
        expect(example.scenario).toBeDefined();
        expect(example.scenario.flow).toBeDefined();
        expect(example.scenario.pressureDrop).toBeDefined();
        expect(example.scenario.specificGravity).toBeDefined();
        expect(example.scenario.trimCharacteristic).toBeDefined();
      });
    });
  });
});
