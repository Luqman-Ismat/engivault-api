import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { fitPumpCurve, CurvePoint, CurveFitResult } from '@/logic/curves';
import { handleError } from '@/utils/errorHandler';
import { ErrorHelper } from '@/utils/errorHelper';

const zCurvePoint = z.object({
  q: z.number().positive(),
  h: z.number().positive(),
});

const zCurveFitRequest = z.object({
  points: z.array(zCurvePoint).min(3),
  model: z.enum(['quadratic', 'cubic']),
});

const zCurveFitResponse = z.object({
  coefficients: z.array(z.number()),
  rSquared: z.number(),
  residuals: z.array(z.number()),
  model: z.enum(['quadratic', 'cubic']),
  equation: z.string(),
  predictedValues: z.array(z.number()),
  standardError: z.number(),
  maxResidual: z.number(),
  meanResidual: z.number(),
  metadata: z.object({
    input: z.object({
      points: z.array(zCurvePoint),
      model: z.enum(['quadratic', 'cubic']),
    }),
    statistics: z.object({
      nPoints: z.number(),
      degreesOfFreedom: z.number(),
      adjustedRSquared: z.number(),
    }),
  }),
});

export default async function curvesRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/curves/fit',
    {
      schema: {
        tags: ['Utilities'],
        summary: 'Fit pump curve using polynomial regression',
        description: `Fit pump performance curves using polynomial regression with statistical analysis.

**Method Used:**
- **Polynomial Regression**: h = a₀ + a₁q + a₂q² + a₃q³
- **Normal Equations**: (X^T X)β = X^T y solved using Gaussian elimination
- **R-squared**: R² = 1 - (SS_res / SS_tot)
- **Standard Error**: SE = √(SS_res / (n-p-1))
- **Residuals**: ε_i = h_i - ĥ_i

**Models Available:**
- **Quadratic**: h = a₀ + a₁q + a₂q² (minimum 3 points)
- **Cubic**: h = a₀ + a₁q + a₂q² + a₃q³ (minimum 4 points)

**Validity Ranges:**
- Flow Rate: 0.001 m³/s < q < 100 m³/s
- Head: 0.1 m < h < 1000 m
- Data Points: 3-50 points for stable fitting
- R-squared: 0.8 < R² < 1.0 (good fit)

**Quality Metrics:**
- **R-squared**: Coefficient of determination (0-1)
- **Standard Error**: Average prediction error
- **Residuals**: Individual prediction errors
- **Adjusted R-squared**: Penalized for model complexity

**References:**
- Montgomery, D.C. (2012). "Introduction to Linear Regression Analysis" (5th ed.). Wiley
- Draper, N.R. & Smith, H. (1998). "Applied Regression Analysis" (3rd ed.). Wiley

**Version:** 1.0.0`,
        body: {
          type: 'object',
          properties: {
            points: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  q: { type: 'number', description: 'Flow rate in m³/s' },
                  h: { type: 'number', description: 'Head in m' },
                },
                required: ['q', 'h'],
              },
            },
            model: {
              type: 'string',
              enum: ['quadratic', 'cubic'],
              description: 'Polynomial model type',
            },
          },
          required: ['points', 'model'],
        },
        examples: [
          {
            name: 'Quadratic Fit',
            summary: 'Fit quadratic curve to pump data',
            description: 'Fit a quadratic polynomial to pump performance data',
            value: {
              points: [
                { q: 0, h: 100 },
                { q: 0.05, h: 95 },
                { q: 0.1, h: 85 },
                { q: 0.15, h: 70 },
                { q: 0.2, h: 50 },
              ],
              model: 'quadratic',
            },
          },
          {
            name: 'Cubic Fit',
            summary: 'Fit cubic curve to pump data',
            description: 'Fit a cubic polynomial to pump performance data',
            value: {
              points: [
                { q: 0, h: 120 },
                { q: 0.02, h: 118 },
                { q: 0.04, h: 115 },
                { q: 0.06, h: 110 },
                { q: 0.08, h: 100 },
                { q: 0.1, h: 85 },
              ],
              model: 'cubic',
            },
          },
        ],
        response: {
          200: {
            type: 'object',
            properties: {
              coefficients: {
                type: 'array',
                items: { type: 'number' },
                description: 'Polynomial coefficients [a₀, a₁, a₂, a₃]',
              },
              rSquared: {
                type: 'number',
                description: 'Coefficient of determination (0-1)',
              },
              residuals: {
                type: 'array',
                items: { type: 'number' },
                description: 'Prediction residuals',
              },
              model: {
                type: 'string',
                enum: ['quadratic', 'cubic'],
              },
              equation: {
                type: 'string',
                description: 'Human-readable equation',
              },
              predictedValues: {
                type: 'array',
                items: { type: 'number' },
                description: 'Fitted values',
              },
              standardError: {
                type: 'number',
                description: 'Standard error of regression',
              },
              maxResidual: {
                type: 'number',
                description: 'Maximum absolute residual',
              },
              meanResidual: {
                type: 'number',
                description: 'Mean absolute residual',
              },
              metadata: {
                type: 'object',
                properties: {
                  input: {
                    type: 'object',
                    properties: {
                      points: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            q: { type: 'number' },
                            h: { type: 'number' },
                          },
                          required: ['q', 'h'],
                        },
                      },
                      model: { type: 'string', enum: ['quadratic', 'cubic'] },
                    },
                    required: ['points', 'model'],
                  },
                  statistics: {
                    type: 'object',
                    properties: {
                      nPoints: { type: 'number' },
                      degreesOfFreedom: { type: 'number' },
                      adjustedRSquared: { type: 'number' },
                    },
                    required: [
                      'nPoints',
                      'degreesOfFreedom',
                      'adjustedRSquared',
                    ],
                  },
                },
                required: ['input', 'statistics'],
              },
            },
            required: [
              'coefficients',
              'rSquared',
              'residuals',
              'model',
              'equation',
              'predictedValues',
              'standardError',
              'maxResidual',
              'meanResidual',
              'metadata',
            ],
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const payload = request.body as any;

        // Manual validation
        if (!payload || typeof payload !== 'object') {
          return reply.status(400).send({
            error: 'Invalid request body',
          });
        }

        const { points, model } = payload;

        if (!Array.isArray(points)) {
          return reply.status(400).send({
            error: 'Points must be an array',
          });
        }

        if (!model || !['quadratic', 'cubic'].includes(model)) {
          return reply.status(400).send({
            error: 'Model must be either "quadratic" or "cubic"',
          });
        }

        // Validate points structure and values
        for (let i = 0; i < points.length; i++) {
          const point = points[i];
          if (!point || typeof point !== 'object') {
            return reply.status(400).send({
              error: `Invalid point at index ${i}`,
            });
          }
          if (typeof point.q !== 'number' || point.q <= 0) {
            return reply.status(400).send({
              error: `Flow rate at index ${i} must be a positive number`,
            });
          }
          if (typeof point.h !== 'number' || point.h <= 0) {
            return reply.status(400).send({
              error: `Head at index ${i} must be a positive number`,
            });
          }
        }

        // Validate minimum points requirement
        if (model === 'quadratic' && points.length < 3) {
          const hints = ErrorHelper.addCurveFittingViolationHint(
            points.length,
            model,
            0
          );
          return reply.status(400).send({
            error: 'At least 3 points are required for quadratic fitting',
            code: 'VALIDATION_ERROR',
            hints,
          });
        }

        if (model === 'cubic' && points.length < 4) {
          const hints = ErrorHelper.addCurveFittingViolationHint(
            points.length,
            model,
            0
          );
          return reply.status(400).send({
            error: 'At least 4 points are required for cubic fitting',
            code: 'VALIDATION_ERROR',
            hints,
          });
        }

        // Validate that points are sorted by flow rate (q)
        const sortedPoints = [...points].sort((a, b) => a.q - b.q);

        // Check for duplicate flow rates
        const uniqueQ = new Set(sortedPoints.map(p => p.q));
        if (uniqueQ.size !== sortedPoints.length) {
          return reply.status(400).send({
            error: 'Duplicate flow rate values are not allowed',
          });
        }

        // Fit the curve
        const result = fitPumpCurve(sortedPoints, model);

        // Calculate additional statistics
        const nPoints = sortedPoints.length;
        const degreesOfFreedom = nPoints - (model === 'quadratic' ? 3 : 4);
        const adjustedRSquared =
          degreesOfFreedom > 0
            ? 1 - ((1 - result.rSquared) * (nPoints - 1)) / degreesOfFreedom
            : 0;

        // Add engineering hints based on curve fitting results
        const hints = ErrorHelper.addEngineeringHints('curve_fit', {
          nPoints,
          model,
          rSquared: result.rSquared,
        });

        // Create response with metadata
        const response = {
          coefficients: result.coefficients,
          rSquared: result.rSquared,
          residuals: result.residuals,
          model: result.model,
          equation: result.equation,
          predictedValues: result.predictedValues,
          standardError: result.standardError,
          maxResidual: result.maxResidual,
          meanResidual: result.meanResidual,
          metadata: {
            input: {
              points: sortedPoints,
              model,
            },
            statistics: {
              nPoints,
              degreesOfFreedom,
              adjustedRSquared,
            },
          },
        };

        // Add warnings if there are hints
        if (hints.length > 0) {
          return reply.send({
            ...response,
            warnings: hints,
          });
        }

        return reply.send(response);
      } catch (error) {
        // Add engineering hints to error response
        const hints = ErrorHelper.addEngineeringHints('curve_fit', {
          nPoints: (error as any)?.nPoints,
          model: (error as any)?.model,
          rSquared: (error as any)?.rSquared,
        });

        return handleError(error, reply, hints);
      }
    }
  );
}
