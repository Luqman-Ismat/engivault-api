import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { bepDistance, PumpCurve } from '@/logic/pumps';
import { handleError } from '@/utils/errorHandler';
import { processBatchOrSingle } from '@/utils/batchProcessor';
import { transcriptService } from '@/services/runs';

const zPumpCurvePoint = z.object({
  q: z.number().positive(),
  h: z.number().positive(),
  efficiency: z.number().min(0).max(1).optional(),
});

const zPumpCurve = z.object({
  points: z.array(zPumpCurvePoint).min(1),
  name: z.string().optional(),
  units: z
    .object({
      flow: z.string(),
      head: z.string(),
      efficiency: z.string().optional(),
    })
    .optional(),
});

const zOperatingPoint = z.object({
  q: z.number().positive(),
  h: z.number().positive(),
});

const zBEPCheckRequest = z.object({
  operatingPoint: zOperatingPoint,
  curve: zPumpCurve,
});

const zBEPCheckResponse = z.object({
  bepPoint: z.object({
    q: z.number(),
    h: z.number(),
    efficiency: z.number().optional(),
  }),
  distance: z.number(),
  bepIndex: z.number(),
  method: z.enum(['efficiency', 'midpoint']),
  warnings: z.array(
    z.object({
      type: z.string(),
      message: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
    })
  ),
  metadata: z.object({
    input: zBEPCheckRequest,
    calculations: z.object({
      normalizedDistance: z.number(),
      curveRange: z.object({
        minFlow: z.number(),
        maxFlow: z.number(),
      }),
    }),
  }),
});

export default async function pumpsRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/pumps/bep-check', async (request, reply) => {
    const startTime = Date.now();

    try {
      const payload = request.body as any;

      // Validate basic structure
      if (!payload) {
        return reply.status(400).send({
          error: 'Request body is required',
        });
      }

      // Check if this is a batch request
      if (payload && Array.isArray(payload.items)) {
        // Batch request - use batch processor
        const result = await processBatchOrSingle(
          payload,
          (input: any) => {
            // Manual validation for single item
            if (!input || !input.operatingPoint || !input.curve) {
              throw new Error(
                'Missing required fields: operatingPoint and curve'
              );
            }

            const { operatingPoint, curve } = input;

            // Validate operating point
            if (
              typeof operatingPoint.q !== 'number' ||
              operatingPoint.q <= 0 ||
              typeof operatingPoint.h !== 'number' ||
              operatingPoint.h <= 0
            ) {
              throw new Error(
                'Operating point must have positive q and h values'
              );
            }

            // Validate curve
            if (!Array.isArray(curve.points) || curve.points.length === 0) {
              throw new Error('Curve must have at least one point');
            }

            for (const point of curve.points) {
              if (
                typeof point.q !== 'number' ||
                point.q < 0 ||
                typeof point.h !== 'number' ||
                point.h < 0
              ) {
                throw new Error(
                  'Curve points must have non-negative q and h values'
                );
              }
              if (
                point.efficiency !== undefined &&
                (point.efficiency < 0 || point.efficiency > 1)
              ) {
                throw new Error('Efficiency must be between 0 and 1');
              }
            }

            const result = bepDistance(operatingPoint, curve as PumpCurve);

            // Calculate additional metadata
            const minFlow = Math.min(...curve.points.map((p: any) => p.q));
            const maxFlow = Math.max(...curve.points.map((p: any) => p.q));
            const normalizedDistance = result.distance / result.bepPoint.q;

            return {
              ...result,
              metadata: {
                input: { operatingPoint, curve },
                calculations: {
                  normalizedDistance,
                  curveRange: {
                    minFlow,
                    maxFlow,
                  },
                },
              },
            };
          },
          reply
        );

        // Capture transcript if enabled
        const processingTime = Date.now() - startTime;
        const transcript = transcriptService.createFromRequest(
          request,
          result,
          processingTime,
          [],
          {},
          [
            'BEP Distance = |Q_operating - Q_BEP| / Q_BEP',
            'Efficiency-based BEP: max(efficiency)',
            'Midpoint BEP: (Q_min + Q_max) / 2',
          ]
        );

        if (transcript) {
          reply.header('X-EngiVault-Transcript-ID', transcript.id);
        }

        return reply.send(result);
      } else {
        // Single item request - validate and process directly
        const input = payload as any;

        // Manual validation
        if (!input || !input.operatingPoint || !input.curve) {
          return reply.status(400).send({
            error: 'Missing required fields: operatingPoint and curve',
          });
        }

        const { operatingPoint, curve } = input;

        // Validate operating point
        if (
          typeof operatingPoint.q !== 'number' ||
          operatingPoint.q <= 0 ||
          typeof operatingPoint.h !== 'number' ||
          operatingPoint.h <= 0
        ) {
          return reply.status(400).send({
            error: 'Operating point must have positive q and h values',
          });
        }

        // Validate curve
        if (!Array.isArray(curve.points) || curve.points.length === 0) {
          return reply.status(400).send({
            error: 'Curve must have at least one point',
          });
        }

        for (const point of curve.points) {
          if (
            typeof point.q !== 'number' ||
            point.q < 0 ||
            typeof point.h !== 'number' ||
            point.h < 0
          ) {
            return reply.status(400).send({
              error: 'Curve points must have non-negative q and h values',
            });
          }
          if (
            point.efficiency !== undefined &&
            (point.efficiency < 0 || point.efficiency > 1)
          ) {
            return reply.status(400).send({
              error: 'Efficiency must be between 0 and 1',
            });
          }
        }

        const result = bepDistance(operatingPoint, curve as PumpCurve);

        // Calculate additional metadata
        const minFlow = Math.min(...curve.points.map((p: any) => p.q));
        const maxFlow = Math.max(...curve.points.map((p: any) => p.q));
        const normalizedDistance = result.distance / result.bepPoint.q;

        const resultWithMetadata = {
          ...result,
          metadata: {
            input: { operatingPoint, curve },
            calculations: {
              normalizedDistance,
              curveRange: {
                minFlow,
                maxFlow,
              },
            },
          },
        };

        // Capture transcript if enabled
        const processingTime = Date.now() - startTime;
        const transcript = transcriptService.createFromRequest(
          request,
          resultWithMetadata,
          processingTime,
          [],
          {},
          [
            'BEP Distance = |Q_operating - Q_BEP| / Q_BEP',
            'Efficiency-based BEP: max(efficiency)',
            'Midpoint BEP: (Q_min + Q_max) / 2',
          ]
        );

        if (transcript) {
          reply.header('X-EngiVault-Transcript-ID', transcript.id);
        }

        return reply.send(resultWithMetadata);
      }
    } catch (error) {
      // Capture transcript for errors too if enabled
      const processingTime = Date.now() - startTime;
      const transcript = transcriptService.createFromRequest(
        request,
        { error: error instanceof Error ? error.message : String(error) },
        processingTime,
        [],
        {},
        [
          'BEP Distance = |Q_operating - Q_BEP| / Q_BEP',
          'Efficiency-based BEP: max(efficiency)',
          'Midpoint BEP: (Q_min + Q_max) / 2',
        ]
      );

      if (transcript) {
        reply.header('X-EngiVault-Transcript-ID', transcript.id);
      }

      return handleError(error, reply);
    }
  });
}
