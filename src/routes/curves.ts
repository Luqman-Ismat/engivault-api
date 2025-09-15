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

// Custom error type for curve fitting
class CurveFitError extends Error {
  nPoints?: number;
  model?: string;
  rSquared?: number;

  constructor(
    message: string,
    options?: { nPoints?: number; model?: string; rSquared?: number }
  ) {
    super(message);
    this.name = 'CurveFitError';
    this.nPoints = options?.nPoints;
    this.model = options?.model;
    this.rSquared = options?.rSquared;
  }
}

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
        body: zCurveFitRequest,
        response: {
          200: zCurveFitResponse,
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
        const { points, model } = request.body as z.infer<
          typeof zCurveFitRequest
        >;

        // Validate minimum points requirement
        if (model === 'quadratic' && points.length < 3) {
          throw new CurveFitError(
            'At least 3 points are required for quadratic fitting',
            { nPoints: points.length, model }
          );
        }

        if (model === 'cubic' && points.length < 4) {
          throw new CurveFitError(
            'At least 4 points are required for cubic fitting',
            { nPoints: points.length, model }
          );
        }

        // Validate that points are sorted by flow rate (q)
        const sortedPoints = [...points].sort((a, b) => a.q - b.q);

        // Check for duplicate flow rates
        const uniqueQ = new Set(sortedPoints.map(p => p.q));
        if (uniqueQ.size !== sortedPoints.length) {
          throw new Error('Duplicate flow rate values are not allowed');
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
        const response: z.infer<typeof zCurveFitResponse> = {
          ...result,
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
        const curveError = error as CurveFitError;
        // Add engineering hints to error response
        const hints = ErrorHelper.addEngineeringHints('curve_fit', {
          nPoints: curveError.nPoints,
          model: curveError.model,
          rSquared: curveError.rSquared,
        });

        return handleError(error, reply, hints);
      }
    }
  );
}
