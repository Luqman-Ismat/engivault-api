import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { transcriptService } from '@/services/runs';
import { handleError } from '@/utils/errorHandler';

const zTranscriptResponse = z.object({
  id: z.string(),
  timestamp: z.date(),
  endpoint: z.string(),
  method: z.string(),
  normalizedInputs: z.record(z.string(), z.unknown()),
  selectedEquations: z.array(z.string()),
  intermediateValues: z.record(z.string(), z.unknown()),
  warnings: z.array(z.string()),
  metadata: z.object({
    input: z.record(z.string(), z.unknown()),
    units: z.record(z.string(), z.string()),
    userAgent: z.string().optional(),
    contentType: z.string().optional(),
  }),
  result: z.record(z.string(), z.unknown()),
});

const zTranscriptListResponse = z.object({
  transcripts: z.array(
    z.object({
      id: z.string(),
      timestamp: z.date(),
      endpoint: z.string(),
      method: z.string(),
      calculationMethod: z.string(),
      processingTime: z.number(),
    })
  ),
  count: z.number(),
});

export default async function runsRoutes(fastify: FastifyInstance) {
  // GET /api/v1/runs/:id - Retrieve a specific transcript
  fastify.get('/api/v1/runs/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const transcript = transcriptService.getTranscript(id);

      if (!transcript) {
        return reply.status(404).send({
          error: 'Transcript not found',
          id,
        });
      }

      return reply.send(transcript);
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // GET /api/v1/runs - List all transcripts
  fastify.get('/api/v1/runs', async (request, reply) => {
    try {
      const transcriptIds = transcriptService.listTranscriptIds();
      const transcripts = transcriptIds
        .map(id => {
          const transcript = transcriptService.getTranscript(id);
          if (!transcript) return null;

          return {
            id: transcript.id,
            timestamp: transcript.timestamp,
            endpoint: transcript.endpoint,
            method: transcript.method,
            calculationMethod: transcript.meta.calculationMethod,
            processingTime: transcript.meta.processingTime,
          };
        })
        .filter(Boolean);

      return reply.send({
        transcripts,
        count: transcriptService.getCount(),
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // DELETE /api/v1/runs/:id - Delete a specific transcript
  fastify.delete('/api/v1/runs/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      const deleted = transcriptService.deleteTranscript(id);

      if (!deleted) {
        return reply.status(404).send({
          error: 'Transcript not found',
          id,
        });
      }

      return reply.send({
        message: 'Transcript deleted successfully',
        id,
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // DELETE /api/v1/runs - Clear all transcripts
  fastify.delete('/api/v1/runs', async (request, reply) => {
    try {
      const count = transcriptService.getCount();
      transcriptService.clearAll();

      return reply.send({
        message: 'All transcripts cleared successfully',
        deletedCount: count,
      });
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
