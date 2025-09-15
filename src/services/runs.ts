import { FastifyRequest, FastifyReply } from 'fastify';

export interface Transcript {
  id: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  normalizedInputs: unknown;
  selectedEquations: string[];
  intermediateValues: Record<string, unknown>;
  warnings: Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  meta: {
    processingTime: number;
    inputValidation: boolean;
    calculationMethod: string;
    units: Record<string, string>;
    [key: string]: unknown;
  };
  result: unknown;
}

class TranscriptService {
  private transcripts = new Map<string, Transcript>();

  /**
   * Create a new transcript
   */
  createTranscript(
    id: string,
    transcript: Omit<Transcript, 'id' | 'timestamp'>
  ): Transcript {
    const fullTranscript: Transcript = {
      ...transcript,
      id,
      timestamp: new Date(),
    };

    this.transcripts.set(id, fullTranscript);
    return fullTranscript;
  }

  /**
   * Retrieve a transcript by ID
   */
  getTranscript(id: string): Transcript | undefined {
    return this.transcripts.get(id);
  }

  /**
   * List all transcript IDs
   */
  listTranscriptIds(): string[] {
    return Array.from(this.transcripts.keys());
  }

  /**
   * Delete a transcript by ID
   */
  deleteTranscript(id: string): boolean {
    return this.transcripts.delete(id);
  }

  /**
   * Clear all transcripts
   */
  clearAll(): void {
    this.transcripts.clear();
  }

  /**
   * Get transcript count
   */
  getCount(): number {
    return this.transcripts.size;
  }

  /**
   * Generate a unique transcript ID
   */
  generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `run_${timestamp}_${random}`;
  }

  /**
   * Check if transcript capture is enabled for a request
   */
  isTranscriptEnabled(request: FastifyRequest): boolean {
    const headerValue = Object.entries(request.headers).find(
      ([key]) => key.toLowerCase() === 'x-engivault-transcript'
    )?.[1];
    return headerValue === 'on';
  }

  /**
   * Create a transcript from request and response data
   */
  createFromRequest(
    request: FastifyRequest,
    response: unknown,
    processingTime: number,
    warnings: Array<{
      type: string;
      message: string;
      severity: 'low' | 'medium' | 'high';
    }> = [],
    intermediateValues: Record<string, unknown> = {},
    selectedEquations: string[] = []
  ): Transcript | null {
    if (!this.isTranscriptEnabled(request)) {
      return null;
    }

    const id = this.generateId();
    const transcript: Omit<Transcript, 'id' | 'timestamp'> = {
      endpoint: request.url,
      method: request.method,
      normalizedInputs: this.normalizeInputs(request.body),
      selectedEquations,
      intermediateValues,
      warnings,
      meta: {
        processingTime,
        inputValidation: true,
        calculationMethod: this.determineCalculationMethod(request.url),
        units: this.extractUnits(request.body),
        userAgent: request.headers['user-agent'],
        contentType: request.headers['content-type'],
      },
      result: response,
    };

    return this.createTranscript(id, transcript);
  }

  /**
   * Normalize input data for consistent storage
   */
  private normalizeInputs(input: unknown): unknown {
    if (!input) return null;

    // Deep clone to avoid reference issues
    const normalized = JSON.parse(JSON.stringify(input));

    // Remove sensitive or unnecessary fields
    if (normalized.items) {
      normalized.items = normalized.items.map((item: unknown) => {
        const clean = { ...item };
        // Remove any sensitive fields if needed
        return clean;
      });
    }

    return normalized;
  }

  /**
   * Determine calculation method based on endpoint
   */
  private determineCalculationMethod(url: string): string {
    if (url.includes('/operations/fill-drain-time')) {
      return 'fill-drain-simulation';
    }
    if (url.includes('/pumps/bep-check')) {
      return 'bep-distance-calculation';
    }
    if (url.includes('/hydraulics/size-pipe')) {
      return 'pipe-sizing-iteration';
    }
    if (url.includes('/networks/hardy-cross')) {
      return 'hardy-cross-method';
    }
    if (url.includes('/transients/joukowsky')) {
      return 'joukowsky-equation';
    }
    if (url.includes('/slurries/settling-velocity')) {
      return 'durand-correlation';
    }
    if (url.includes('/gas/fanno')) {
      return 'fanno-line-calculation';
    }
    if (url.includes('/gas/rayleigh')) {
      return 'rayleigh-line-calculation';
    }
    if (url.includes('/thermal/viscosity-adjusted-drop')) {
      return 'viscosity-iteration';
    }
    if (url.includes('/thermal/hx-drop')) {
      return 'heat-exchanger-correlation';
    }
    return 'unknown';
  }

  /**
   * Extract units from input data
   */
  private extractUnits(input: unknown): Record<string, string> {
    const units: Record<string, string> = {};

    if (!input) return units;

    const isObjectWithUnit = (value: unknown): value is { unit: string } => {
      return typeof value === 'object' && value !== null && 'unit' in value;
    };

    const extractFromObject = (obj: unknown, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          if (isObjectWithUnit(value)) {
            units[`${prefix}${key}`] = value.unit;
          } else {
            extractFromObject(value, `${prefix}${key}.`);
          }
        }
      }
    };

    extractFromObject(input);
    return units;
  }
}

// Export singleton instance
export const transcriptService = new TranscriptService();
