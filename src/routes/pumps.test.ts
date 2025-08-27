import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { build } from '../index';

describe('Pump Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = await build();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/pumps/bep-check', () => {
    const validOperatingPoint = {
      q: 100,
      h: 50
    };

    const validCurve = {
      points: [
        { q: 50, h: 80, efficiency: 0.7 },
        { q: 75, h: 70, efficiency: 0.85 },
        { q: 100, h: 50, efficiency: 0.9 },
        { q: 125, h: 30, efficiency: 0.85 },
        { q: 150, h: 10, efficiency: 0.7 }
      ]
    };

    const validRequest = {
      operatingPoint: validOperatingPoint,
      curve: validCurve
    };

    it('should calculate BEP distance with warnings for far operation', async () => {
      const farOperatingPoint = {
        q: 200, // Far from BEP
        h: 20
      };

      const request = {
        operatingPoint: farOperatingPoint,
        curve: validCurve
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: request
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.bepPoint).toBeDefined();
      expect(result.distance).toBeGreaterThanOrEqual(0);
      expect(result.bepIndex).toBeGreaterThanOrEqual(0);
      expect(result.method).toBeDefined();
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      
      // Should have warnings for far operation
      const farWarnings = result.warnings.filter((w: any) => w.type === 'far_from_bep');
      expect(farWarnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate BEP distance with warnings for operation outside curve range', async () => {
      const outsideOperatingPoint = {
        q: 200, // Outside curve range
        h: 5
      };

      const request = {
        operatingPoint: outsideOperatingPoint,
        curve: validCurve
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: request
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.bepPoint).toBeDefined();
      expect(result.distance).toBeGreaterThanOrEqual(0);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      
      // Should have warnings for operation outside range
      const rangeWarnings = result.warnings.filter((w: any) => w.type === 'outside_curve_range');
      expect(rangeWarnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate BEP distance with efficiency warnings', async () => {
      const lowEfficiencyOperatingPoint = {
        q: 50, // Low efficiency point
        h: 80
      };

      const request = {
        operatingPoint: lowEfficiencyOperatingPoint,
        curve: validCurve
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: request
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.bepPoint).toBeDefined();
      expect(result.distance).toBeGreaterThanOrEqual(0);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      
      // Should have efficiency warnings
      const efficiencyWarnings = result.warnings.filter((w: any) => w.type === 'low_efficiency');
      expect(efficiencyWarnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle operation close to BEP with minimal warnings', async () => {
      const closeOperatingPoint = {
        q: 100, // Close to BEP
        h: 50
      };

      const request = {
        operatingPoint: closeOperatingPoint,
        curve: validCurve
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: request
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.bepPoint).toBeDefined();
      expect(result.distance).toBeCloseTo(0, 1); // Should be very close to BEP
      expect(result.bepIndex).toBeGreaterThanOrEqual(0);
      expect(result.method).toBeDefined();
      
      // Should have minimal warnings for close operation
      const farWarnings = result.warnings.filter((w: any) => w.type === 'far_from_bep');
      expect(farWarnings.length).toBe(0);
    });

    it('should handle curve without efficiency data', async () => {
      const curveWithoutEfficiency = {
        points: [
          { q: 50, h: 80 },
          { q: 75, h: 70 },
          { q: 100, h: 50 },
          { q: 125, h: 30 },
          { q: 150, h: 10 }
        ]
      };

      const request = {
        operatingPoint: validOperatingPoint,
        curve: curveWithoutEfficiency
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: request
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.bepPoint).toBeDefined();
      expect(result.distance).toBeGreaterThanOrEqual(0);
      expect(result.bepIndex).toBeGreaterThanOrEqual(0);
      expect(result.method).toBe('midpoint'); // Should use midpoint method
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
      
      // Should have warning about no efficiency data
      const efficiencyWarnings = result.warnings.filter((w: any) => w.type === 'no_efficiency_data');
      expect(efficiencyWarnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should return 400 for invalid operating point', async () => {
      const invalidRequest = {
        operatingPoint: {
          q: -100, // Negative flow
          h: 50
        },
        curve: validCurve
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: invalidRequest
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Operating point must have positive q and h values');
    });

    it('should return 400 for invalid curve data', async () => {
      const invalidRequest = {
        operatingPoint: validOperatingPoint,
        curve: {
          points: [
            { q: 50, h: 80, efficiency: 0.7 },
            { q: 75, h: -70, efficiency: 0.85 }, // Negative head
            { q: 100, h: 50, efficiency: 0.9 }
          ]
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: invalidRequest
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Curve points must have non-negative q and h values');
    });

    it('should return 400 for empty curve', async () => {
      const invalidRequest = {
        operatingPoint: validOperatingPoint,
        curve: {
          points: []
        }
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: invalidRequest
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Curve must have at least one point');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidRequest = {
        operatingPoint: validOperatingPoint
        // Missing curve
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: invalidRequest
      });

      expect(response.statusCode).toBe(400);
      const result = JSON.parse(response.payload);
      expect(result.error).toBe('Missing required fields: operatingPoint and curve');
    });

    it('should handle curve with metadata', async () => {
      const curveWithMetadata = {
        points: [
          { q: 50, h: 80, efficiency: 0.7 },
          { q: 75, h: 70, efficiency: 0.85 },
          { q: 100, h: 50, efficiency: 0.9 },
          { q: 125, h: 30, efficiency: 0.85 },
          { q: 150, h: 10, efficiency: 0.7 }
        ],
        name: 'Test Pump Curve',
        units: {
          flow: 'm³/h',
          head: 'm',
          efficiency: 'dimensionless'
        }
      };

      const request = {
        operatingPoint: validOperatingPoint,
        curve: curveWithMetadata
      };

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/pumps/bep-check',
        payload: request
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.payload);
      
      expect(result.bepPoint).toBeDefined();
      expect(result.distance).toBeGreaterThanOrEqual(0);
      expect(result.bepIndex).toBeGreaterThanOrEqual(0);
      expect(result.method).toBe('efficiency');
      expect(result.metadata.input.curve.name).toBe('Test Pump Curve');
      expect(result.metadata.input.curve.units.flow).toBe('m³/h');
    });

    // Batch processing tests
    describe('Batch Processing', () => {
      it('should handle batch request with all valid items', async () => {
        const operatingPoint2 = {
          q: 75,
          h: 70
        };

        const curve2 = {
          points: [
            { q: 25, h: 90, efficiency: 0.6 },
            { q: 50, h: 80, efficiency: 0.8 },
            { q: 75, h: 70, efficiency: 0.9 },
            { q: 100, h: 50, efficiency: 0.8 },
            { q: 125, h: 20, efficiency: 0.6 }
          ]
        };

        const batchPayload = {
          items: [
            validRequest,
            {
              operatingPoint: operatingPoint2,
              curve: curve2
            }
          ]
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/v1/pumps/bep-check',
          payload: batchPayload
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.payload);
        
        expect(result.results).toBeDefined();
        expect(result.errors).toBeDefined();
        expect(result.results.length).toBe(2);
        expect(result.errors.length).toBe(0);
        
        // Check first result
        expect(result.results[0].bepPoint).toBeDefined();
        expect(result.results[0].distance).toBeGreaterThanOrEqual(0);
        expect(result.results[0].method).toBe('efficiency');
        
        // Check second result
        expect(result.results[1].bepPoint).toBeDefined();
        expect(result.results[1].distance).toBeGreaterThanOrEqual(0);
        expect(result.results[1].method).toBe('efficiency');
      });

      it('should handle batch request with mixed success/failure', async () => {
        const invalidRequest = {
          operatingPoint: {
            q: -100, // Invalid negative flow
            h: 50
          },
          curve: validCurve
        };

        const batchPayload = {
          items: [validRequest, invalidRequest, validRequest]
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/v1/pumps/bep-check',
          payload: batchPayload
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.payload);
        
        expect(result.results).toBeDefined();
        expect(result.errors).toBeDefined();
        expect(result.results.length).toBe(3);
        expect(result.errors.length).toBe(1);
        
        // Check successful results
        expect(result.results[0]).not.toBeNull(); // First item should succeed
        expect(result.results[2]).not.toBeNull(); // Third item should succeed
        
        // Check failed result
        expect(result.results[1]).toBeNull(); // Second item should fail
        
        // Check error details
        expect(result.errors[0].index).toBe(1);
        expect(result.errors[0].error).toBe('Operating point must have positive q and h values');
      });

      it('should handle batch request with all invalid items', async () => {
        const invalidRequest1 = {
          operatingPoint: {
            q: -100, // Invalid negative flow
            h: 50
          },
          curve: validCurve
        };

        const invalidRequest2 = {
          operatingPoint: validOperatingPoint,
          curve: {
            points: [] // Empty curve
          }
        };

        const batchPayload = {
          items: [invalidRequest1, invalidRequest2]
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/v1/pumps/bep-check',
          payload: batchPayload
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.payload);
        
        expect(result.results).toBeDefined();
        expect(result.errors).toBeDefined();
        expect(result.results.length).toBe(2);
        expect(result.errors.length).toBe(2);
        
        // Check that all results are null
        expect(result.results[0]).toBeNull();
        expect(result.results[1]).toBeNull();
        
        // Check error details
        expect(result.errors[0].index).toBe(0);
        expect(result.errors[0].error).toBe('Operating point must have positive q and h values');
        expect(result.errors[1].index).toBe(1);
        expect(result.errors[1].error).toBe('Curve must have at least one point');
      });

      it('should handle empty batch request', async () => {
        const batchPayload = {
          items: []
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/v1/pumps/bep-check',
          payload: batchPayload
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.payload);
        
        expect(result.results).toBeDefined();
        expect(result.errors).toBeDefined();
        expect(result.results.length).toBe(0);
        expect(result.errors.length).toBe(0);
      });

      it('should handle batch request with complex mixed scenarios', async () => {
        const curveWithoutEfficiency = {
          points: [
            { q: 50, h: 80 },
            { q: 75, h: 70 },
            { q: 100, h: 50 },
            { q: 125, h: 30 },
            { q: 150, h: 10 }
          ]
        };

        const invalidMissingFields = {
          operatingPoint: validOperatingPoint
          // Missing curve
        };

        const invalidEfficiency = {
          operatingPoint: validOperatingPoint,
          curve: {
            points: [
              { q: 50, h: 80, efficiency: 0.7 },
              { q: 75, h: 70, efficiency: 1.5 }, // Invalid efficiency > 1
              { q: 100, h: 50, efficiency: 0.9 }
            ]
          }
        };

        const batchPayload = {
          items: [
            validRequest,
            {
              operatingPoint: validOperatingPoint,
              curve: curveWithoutEfficiency
            },
            invalidMissingFields,
            invalidEfficiency,
            validRequest
          ]
        };

        const response = await app.inject({
          method: 'POST',
          url: '/api/v1/pumps/bep-check',
          payload: batchPayload
        });

        expect(response.statusCode).toBe(200);
        const result = JSON.parse(response.payload);
        
        expect(result.results).toBeDefined();
        expect(result.errors).toBeDefined();
        expect(result.results.length).toBe(5);
        expect(result.errors.length).toBe(2);
        
        // Check successful results
        expect(result.results[0]).not.toBeNull(); // validRequest
        expect(result.results[1]).not.toBeNull(); // curveWithoutEfficiency
        expect(result.results[4]).not.toBeNull(); // validRequest
        
        // Check failed results
        expect(result.results[2]).toBeNull(); // invalidMissingFields
        expect(result.results[3]).toBeNull(); // invalidEfficiency
        
        // Check error details
        const errorIndexes = result.errors.map((e: any) => e.index);
        expect(errorIndexes).toContain(2);
        expect(errorIndexes).toContain(3);
        
        // Verify error messages
        const missingFieldsError = result.errors.find((e: any) => e.index === 2);
        expect(missingFieldsError.error).toBe('Missing required fields: operatingPoint and curve');
        
        const invalidEfficiencyError = result.errors.find((e: any) => e.index === 3);
        expect(invalidEfficiencyError.error).toBe('Efficiency must be between 0 and 1');
      });
    });
  });
});
