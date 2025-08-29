import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { zQuantity } from '@/schemas/common';
import { 
  calculateCavitationRisk, 
  NPSHCalculationInput,
  validateNPSHInputs,
  resolveAtmosphericPressure
} from '@/logic/npsh';
import { ErrorHelper } from '@/utils/errorHelper';
import { handleError } from '@/utils/errorHandler';

const zNPSHCurvePoint = z.object({
  q: z.number().min(0),
  npshr: z.number().min(0),
});

const zNPSHCurve = z.object({
  points: z.array(zNPSHCurvePoint).min(1),
  name: z.string().optional(),
});

const zCavitationRiskRequest = z.object({
  atmosphericPressure: zQuantity.optional(),
  vaporPressure: zQuantity.optional(),
  staticHead: zQuantity,
  losses: zQuantity,
  flowRate: zQuantity,
  npshCurve: zNPSHCurve,
  altitude: z.number().min(0).optional(),
  temperature: zQuantity.optional(),
  fluidName: z.string().optional(),
});

export default async function cavitationRiskRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/cavitation-risk',
    {
      schema: {
        tags: ['Safety'],
        summary: 'Calculate cavitation risk for pump systems',
        description:
          'Analyzes NPSH available vs required to determine cavitation risk',
        body: zCavitationRiskRequest,
        response: {
          200: z.object({
            npshAvailable: zQuantity,
            npshRequired: zQuantity,
            cavitationMargin: zQuantity,
            warnings: z.array(z.string()),
            metadata: z.object({
              atmosphericPressure: zQuantity,
              vaporPressure: zQuantity,
              staticHead: zQuantity,
              losses: zQuantity,
              flowRate: zQuantity,
              altitude: z.number().optional(),
              temperature: zQuantity.optional(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const body = zCavitationRiskRequest.parse(request.body);

        // Resolve atmospheric pressure from altitude if not provided
        const resolvedInput = resolveAtmosphericPressure(body);

        // Validate inputs
        const validation = validateNPSHInputs(resolvedInput);

        if (!validation.isValid) {
          return reply.status(400).send({
            error: 'Invalid input parameters',
            code: 'VALIDATION_ERROR',
            details: validation.errors,
          });
        }

        // Calculate cavitation risk
        const result = calculateCavitationRisk(resolvedInput);

        // Convert warnings to strings for API response
        const stringWarnings = result.warnings.map(warning =>
          typeof warning === 'string' ? warning : warning.message
        );

        const response = {
          ...result,
          warnings: stringWarnings,
        };

        return reply.send(response);
      } catch (error) {
        handleError(error, reply);
      }
    }
  );

  // GET endpoint to list supported fluids and their properties
  fastify.get(
    '/api/v1/pumps/fluids',
    {
      schema: {
        description: 'Get supported fluids for NPSH calculations',
        tags: ['Pumps'],
        response: {
          200: {
            type: 'object',
            properties: {
              fluids: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    vaporPressureMethod: { type: 'string' },
                    temperatureRange: { type: 'string' },
                  },
                  required: [
                    'name',
                    'description',
                    'vaporPressureMethod',
                    'temperatureRange',
                  ],
                },
              },
            },
            required: ['fluids'],
          },
        },
      },
    },
    async (request, reply) => {
      return reply.send({
        fluids: [
          {
            name: 'water',
            description: 'Water with automatic vapor pressure calculation',
            vaporPressureMethod: 'Antoine equation (0-100°C)',
            temperatureRange: '273-373 K (0-100°C)',
          },
          {
            name: 'air',
            description: 'Air (requires manual vapor pressure input)',
            vaporPressureMethod: 'Manual input required',
            temperatureRange: 'N/A',
          },
        ],
      });
    }
  );
}
