import { FastifyInstance } from 'fastify';
import { ErrorHelper } from '../utils/errorHelper';

export default async function errorHelperDemoRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/demo/error-helper',
    {
      schema: {
        tags: ['Demo'],
        summary: 'Demonstrate Error Helper functionality',
        description: `Demonstrate the centralized error helper that adds helpful hints when engineering assumptions are violated.

**Examples:**
- Mach number > 0.3 → suggests gas flow endpoint
- Reynolds < 2300 → warns about laminar flow
- NPSHa < NPSHr → warns about cavitation risk
- Poor curve fit → suggests more data points

**Response includes:**
- Calculation results
- Warnings array with helpful hints
- Suggested endpoints or parameter fixes`,
        body: {
          type: 'object',
          properties: {
            calculationType: {
              type: 'string',
              enum: ['pressure_drop', 'gas_flow', 'npsh', 'curve_fit'],
              description: 'Type of calculation to demonstrate'
            },
            parameters: {
              type: 'object',
              description: 'Parameters for the calculation'
            }
          },
          required: ['calculationType', 'parameters']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: 'string' },
              warnings: {
                type: 'array',
                items: { type: 'string' }
              },
              hints: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string' },
                    message: { type: 'string' },
                    suggestedEndpoint: { type: 'string' },
                    suggestedValue: { type: 'number' },
                    validRange: {
                      type: 'object',
                      properties: {
                        min: { type: 'number' },
                        max: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const { calculationType, parameters } = request.body as any;
        
        // Add engineering hints based on calculation type
        const hints = ErrorHelper.addEngineeringHints(calculationType, parameters);
        
        // Create a mock result
        const result = {
          result: `Demo calculation for ${calculationType}`,
          warnings: hints.map(h => h.message),
          hints
        };
        
        return reply.send(result);
      } catch (error) {
        const hints = ErrorHelper.addEngineeringHints('pressure_drop', {});
        return reply.status(500).send({
          error: 'Demo error',
          code: 'DEMO_ERROR',
          hints
        });
      }
    }
  );

  // Example endpoints that demonstrate specific violations
  fastify.get(
    '/api/v1/demo/mach-violation',
    {
      schema: {
        tags: ['Demo'],
        summary: 'Demonstrate Mach number violation hint',
        description: 'Shows how the error helper suggests using gas flow endpoint when Mach > 0.3'
      }
    },
    async (request, reply) => {
      const hints = ErrorHelper.addMachViolationHint(0.5);
      return reply.send({
        message: 'Mach number violation detected',
        machNumber: 0.5,
        hints
      });
    }
  );

  fastify.get(
    '/api/v1/demo/reynolds-violation',
    {
      schema: {
        tags: ['Demo'],
        summary: 'Demonstrate Reynolds number violation hint',
        description: 'Shows how the error helper warns about laminar flow when Re < 2300'
      }
    },
    async (request, reply) => {
      const hints = ErrorHelper.addReynoldsViolationHint(1500);
      return reply.send({
        message: 'Reynolds number violation detected',
        reynoldsNumber: 1500,
        hints
      });
    }
  );

  fastify.get(
    '/api/v1/demo/npsh-violation',
    {
      schema: {
        tags: ['Demo'],
        summary: 'Demonstrate NPSH violation hint',
        description: 'Shows how the error helper warns about cavitation risk when NPSHa < NPSHr'
      }
    },
    async (request, reply) => {
      const hints = ErrorHelper.addNPSHViolationHint(2.0, 3.0);
      return reply.send({
        message: 'NPSH violation detected',
        npsha: 2.0,
        npshr: 3.0,
        hints
      });
    }
  );

  fastify.get(
    '/api/v1/demo/curve-fitting-violation',
    {
      schema: {
        tags: ['Demo'],
        summary: 'Demonstrate curve fitting violation hint',
        description: 'Shows how the error helper suggests more data points for poor curve fits'
      }
    },
    async (request, reply) => {
      const hints = ErrorHelper.addCurveFittingViolationHint(2, 'quadratic', 0.8);
      return reply.send({
        message: 'Curve fitting violation detected',
        nPoints: 2,
        model: 'quadratic',
        rSquared: 0.8,
        hints
      });
    }
  );
}
