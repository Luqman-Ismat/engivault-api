import { FastifyInstance } from 'fastify';
import { calculateCavitationRisk } from '../logic/npsh';
import { npshSchema, NpshInput } from '../schemas/validation';
import { handleError } from '../utils/errorHandler';
import { createFastifySchema } from '../utils/schemaConverter';

export default async function npshRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: NpshInput }>(
    '/calculate/npsh',
    {
      schema: {
        tags: ['Pumps'],
        summary: 'Calculate Net Positive Suction Head Available (NPSHa)',
        description: `Calculate the Net Positive Suction Head Available (NPSHa) for pump suction conditions.

**Equation Used:**
- **NPSHa = P_atm/ρg + P_gage/ρg + Z - h_f - P_v/ρg**
  - P_atm: Atmospheric pressure (Pa)
  - P_gage: Gage pressure at suction (Pa)
  - Z: Elevation head (m)
  - h_f: Friction head loss (m)
  - P_v: Vapor pressure (Pa)

**Validity Ranges:**
- Temperature: 0°C < T < 100°C (for water)
- Pressure: 0.8 bar < P < 2.0 bar (atmospheric)
- Elevation: -100 m < Z < 1000 m
- Flow Rate: 0.001 m³/s < Q < 10 m³/s

**Safety Margins:**
- Recommended NPSHa > 1.5 × NPSHr (pump required)
- Minimum NPSHa > 0.5 m for most applications

**References:**
- ANSI/HI 9.6.1-2017: "Rotodynamic Pumps - Guideline for NPSH Margin"
- Karassik, I.J. et al. (2008). "Pump Handbook" (4th ed.). McGraw-Hill.

**Version:** 1.0.0`,
        body: createFastifySchema(npshSchema),
        response: {
          200: {
            type: 'object',
            properties: {
              npsha: { type: 'number' },
            },
            required: ['npsha'],
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
        const inputs: NpshInput = request.body;
        const results = calculateCavitationRisk(inputs);
        return reply.send(results);
      } catch (error) {
        handleError(error, reply);
      }
    }
  );
}
