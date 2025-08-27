import { FastifyRequest, FastifyReply } from 'fastify';
import { transcriptService } from '@/services/runs';

export interface TranscriptCaptureOptions {
  selectedEquations?: string[];
  intermediateValues?: Record<string, any>;
  warnings?: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

/**
 * Decorator function to wrap route handlers with transcript capture
 */
export function withTranscriptCapture<T = any>(
  handler: (request: FastifyRequest, reply: FastifyReply) => Promise<T>,
  options: TranscriptCaptureOptions = {}
) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<T> => {
    const startTime = Date.now();

    try {
      // Execute the original handler
      const result = await handler(request, reply);

      // Calculate processing time
      const processingTime = Date.now() - startTime;

      // Capture transcript if enabled
      const transcript = transcriptService.createFromRequest(
        request,
        result,
        processingTime,
        options.warnings || [],
        options.intermediateValues || {},
        options.selectedEquations || []
      );

      // Add transcript ID to response headers if transcript was created
      if (transcript) {
        reply.header('X-EngiVault-Transcript-ID', transcript.id);
      }

      return result;
    } catch (error) {
      // Calculate processing time even for errors
      const processingTime = Date.now() - startTime;

      // Capture transcript for errors too if enabled
      const transcript = transcriptService.createFromRequest(
        request,
        { error: error instanceof Error ? error.message : String(error) },
        processingTime,
        options.warnings || [],
        options.intermediateValues || {},
        options.selectedEquations || []
      );

      // Add transcript ID to response headers if transcript was created
      if (transcript) {
        reply.header('X-EngiVault-Transcript-ID', transcript.id);
      }

      // Re-throw the error
      throw error;
    }
  };
}

/**
 * Helper function to create transcript capture options for specific calculation types
 */
export function createTranscriptOptions(
  calculationType: string,
  equations: string[] = [],
  intermediates: Record<string, any> = {},
  warnings: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }> = []
): TranscriptCaptureOptions {
  return {
    selectedEquations: equations,
    intermediateValues: {
      calculationType,
      ...intermediates,
    },
    warnings,
  };
}
