import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { fitPumpCurve, CurvePoint, CurveFitResult } from '@/logic/curves';
import { handleError } from '@/utils/errorHandler';

const zCurvePoint = z.object({
  q: z.number().positive(),
  h: z.number().positive()
});

const zCurveFitRequest = z.object({
  points: z.array(zCurvePoint).min(3),
  model: z.enum(['quadratic', 'cubic'])
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
      model: z.enum(['quadratic', 'cubic'])
    }),
    statistics: z.object({
      nPoints: z.number(),
      degreesOfFreedom: z.number(),
      adjustedRSquared: z.number()
    })
  })
});

export default async function curvesRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/curves/fit', async (request, reply) => {
    try {
      const payload = request.body as any;
      
      // Manual validation
      if (!payload || typeof payload !== 'object') {
        return reply.status(400).send({
          error: 'Invalid request body'
        });
      }

      const { points, model } = payload;

      if (!Array.isArray(points)) {
        return reply.status(400).send({
          error: 'Points must be an array'
        });
      }

      if (!model || !['quadratic', 'cubic'].includes(model)) {
        return reply.status(400).send({
          error: 'Model must be either "quadratic" or "cubic"'
        });
      }

      // Validate points structure and values
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (!point || typeof point !== 'object') {
          return reply.status(400).send({
            error: `Invalid point at index ${i}`
          });
        }
        if (typeof point.q !== 'number' || point.q <= 0) {
          return reply.status(400).send({
            error: `Flow rate at index ${i} must be a positive number`
          });
        }
        if (typeof point.h !== 'number' || point.h <= 0) {
          return reply.status(400).send({
            error: `Head at index ${i} must be a positive number`
          });
        }
      }

      // Validate minimum points requirement
      if (model === 'quadratic' && points.length < 3) {
        return reply.status(400).send({
          error: 'At least 3 points are required for quadratic fitting'
        });
      }

      if (model === 'cubic' && points.length < 4) {
        return reply.status(400).send({
          error: 'At least 4 points are required for cubic fitting'
        });
      }

      // Validate that points are sorted by flow rate (q)
      const sortedPoints = [...points].sort((a, b) => a.q - b.q);
      
      // Check for duplicate flow rates
      const uniqueQ = new Set(sortedPoints.map(p => p.q));
      if (uniqueQ.size !== sortedPoints.length) {
        return reply.status(400).send({
          error: 'Duplicate flow rate values are not allowed'
        });
      }

      // Fit the curve
      const result = fitPumpCurve(sortedPoints, model);

      // Calculate additional statistics
      const nPoints = sortedPoints.length;
      const degreesOfFreedom = nPoints - (model === 'quadratic' ? 3 : 4);
      const adjustedRSquared = 1 - ((1 - result.rSquared) * (nPoints - 1) / degreesOfFreedom);

      // Create response with metadata
      const response = {
        ...result,
        metadata: {
          input: {
            points: sortedPoints,
            model
          },
          statistics: {
            nPoints,
            degreesOfFreedom,
            adjustedRSquared
          }
        }
      };

      return reply.send(response);
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
