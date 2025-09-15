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
  fastify.post(
    '/api/v1/pumps/bep-check',
    {
      schema: {
        body: z.union([
          zBEPCheckRequest,
          z.object({ items: z.array(zBEPCheckRequest) }),
        ]),
        response: {
          200: z.union([
            zBEPCheckResponse,
            z.object({
              results: z.array(z.union([zBEPCheckResponse, z.null()])),
              errors: z.array(
                z.object({ index: z.number(), error: z.string() })
              ),
            }),
          ]),
        },
      },
    },
    async (request, reply) => {
      const startTime = Date.now();

      try {
        const payload = request.body as
          | z.infer<typeof zBEPCheckRequest>
          | { items: z.infer<typeof zBEPCheckRequest>[] };

        if ('items' in payload && Array.isArray(payload.items)) {
          const result = await processBatchOrSingle(
            payload,
            (input: z.infer<typeof zBEPCheckRequest>) => {
              const result = bepDistance(
                input.operatingPoint,
                input.curve as PumpCurve
              );
              const minFlow = Math.min(...input.curve.points.map(p => p.q));
              const maxFlow = Math.max(...input.curve.points.map(p => p.q));
              const normalizedDistance = result.distance / result.bepPoint.q;

              return {
                ...result,
                metadata: {
                  input,
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
          const input = payload as z.infer<typeof zBEPCheckRequest>;
          const result = bepDistance(
            input.operatingPoint,
            input.curve as PumpCurve
          );

          const minFlow = Math.min(...input.curve.points.map(p => p.q));
          const maxFlow = Math.max(...input.curve.points.map(p => p.q));
          const normalizedDistance = result.distance / result.bepPoint.q;

          const resultWithMetadata = {
            ...result,
            metadata: {
              input,
              calculations: {
                normalizedDistance,
                curveRange: {
                  minFlow,
                  maxFlow,
                },
              },
            },
          };

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
    }
  );
}
