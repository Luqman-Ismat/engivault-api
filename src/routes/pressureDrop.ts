import { FastifyInstance } from 'fastify';
import { calculatePressureDrop } from '../logic/pressureDrop';
import { pressureDropSchema, PressureDropInput } from '../schemas/validation';
import { handleError } from '../utils/errorHandler';
import { createFastifySchema } from '../utils/schemaConverter';
import { ErrorHelper } from '../utils/errorHelper';

export default async function pressureDropRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: PressureDropInput }>(
    '/calculate/pressure-drop',
    {
      schema: {
        tags: ['Hydraulics'],
        summary: 'Calculate pressure drop using Darcy-Weisbach equation',
        description: `Calculate pressure drop in circular pipes using the Darcy-Weisbach equation with Churchill friction factor correlation.

**Correlations Used:**
- **Darcy-Weisbach Equation**: ΔP = f × (L/D) × (ρv²/2)
- **Churchill Friction Factor**: f = 8 × [(8/Re)^12 + (2.457×ln((7/Re)^0.9 + 0.27ε/D))^-16]^(1/12)
- **Reynolds Number**: Re = ρvD/μ

**Validity Ranges:**
- Reynolds Number: 4,000 < Re < 10^8 (turbulent flow)
- Relative Roughness: 0 < ε/D < 0.05
- Pipe Diameter: 0.01 m < D < 2.0 m
- Flow Velocity: 0.1 m/s < v < 50 m/s

**References:**
- Churchill, S.W. (1977). "Friction factor equation spans all fluid-flow regimes." Chemical Engineering, 84(24), 91-92.
- White, F.M. (2011). "Fluid Mechanics" (7th ed.). McGraw-Hill.

**Version:** 1.0.0`,
        body: createFastifySchema(pressureDropSchema),
        examples: [
          {
            name: 'Water Flow in Steel Pipe',
            summary: 'Water flow in 100mm steel pipe',
            description:
              'Calculate pressure drop for water flowing in a 100mm diameter steel pipe',
            value: {
              flowRate: 0.05, // m³/s
              pipeDiameter: 0.1, // m
              pipeLength: 100, // m
              roughness: 0.000045, // m (steel pipe)
              fluidDensity: 998, // kg/m³ (water at 20°C)
              fluidViscosity: 0.001002, // Pa·s (water at 20°C)
            },
          },
          {
            name: 'Oil Flow in Cast Iron Pipe',
            summary: 'Oil flow in 200mm cast iron pipe',
            description:
              'Calculate pressure drop for oil flowing in a 200mm diameter cast iron pipe',
            value: {
              flowRate: 0.1, // m³/s
              pipeDiameter: 0.2, // m
              pipeLength: 500, // m
              roughness: 0.00026, // m (cast iron)
              fluidDensity: 850, // kg/m³ (typical oil)
              fluidViscosity: 0.01, // Pa·s (typical oil)
            },
          },
        ],
        response: {
          200: {
            type: 'object',
            properties: {
              pressureDrop: {
                type: 'number',
                description: 'Pressure drop in Pa',
              },
              reynoldsNumber: {
                type: 'number',
                description: 'Reynolds number (dimensionless)',
              },
              frictionFactor: {
                type: 'number',
                description: 'Darcy friction factor (dimensionless)',
              },
              flowVelocity: {
                type: 'number',
                description: 'Flow velocity in m/s',
              },
              relativeRoughness: {
                type: 'number',
                description: 'Relative roughness ε/D (dimensionless)',
              },
            },
            required: [
              'pressureDrop',
              'reynoldsNumber',
              'frictionFactor',
              'flowVelocity',
              'relativeRoughness',
            ],
            examples: [
              {
                name: 'Water Flow Response',
                summary: 'Typical response for water flow',
                value: {
                  pressureDrop: 24567.8, // Pa
                  reynoldsNumber: 63420.5,
                  frictionFactor: 0.0198,
                  flowVelocity: 6.37, // m/s
                  relativeRoughness: 0.00045,
                },
              },
            ],
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
              details: { type: 'object' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const inputs: PressureDropInput = request.body;
        const results = calculatePressureDrop(inputs);

        // Add engineering hints based on calculation results
        const hints = ErrorHelper.addEngineeringHints('pressure_drop', {
          reynolds: results.reynoldsNumber,
          relativeRoughness: results.relativeRoughness,
          diameter: inputs.pipeDiameter,
          velocity: results.flowVelocity,
        });

        // If there are hints, add them to the response
        if (hints.length > 0) {
          return reply.send({
            ...results,
            warnings: hints,
          });
        }

        return reply.send(results);
      } catch (error) {
        // Add engineering hints to error response
        const hints = ErrorHelper.addEngineeringHints('pressure_drop', {
          reynolds: (error as any)?.reynoldsNumber,
          relativeRoughness: (error as any)?.relativeRoughness,
          diameter: (error as any)?.pipeDiameter,
          velocity: (error as any)?.flowVelocity,
        });

        handleError(error, reply, hints);
      }
    }
  );
}
