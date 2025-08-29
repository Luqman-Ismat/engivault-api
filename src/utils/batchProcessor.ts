import { FastifyReply } from 'fastify';

export interface BatchRequest<T> {
  items: T[];
}

export interface BatchResponse<T, R> {
  results: R[];
  errors: Array<{
    index: number;
    error: string;
  }>;
}

export interface SingleResponse<R> {
  [key: string]: R | unknown;
}

export type CalculatorFunction<T, R> = (input: T) => R;

/**
 * Process a request payload that could be either a single item or a batch of items
 * @param payload - The request payload
 * @param calculator - The function to process each item
 * @param reply - Fastify reply object
 * @returns Promise that resolves to the processed result
 */
export async function processBatchOrSingle<T, R>(
  payload: unknown,
  calculator: CalculatorFunction<T, R>,
  reply: FastifyReply
): Promise<BatchResponse<T, R> | SingleResponse<R>> {
  // Check if this is a batch request
  if (payload && Array.isArray(payload.items)) {
    const batchRequest = payload as BatchRequest<T>;
    const results: R[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    // Process each item in the batch
    for (let i = 0; i < batchRequest.items.length; i++) {
      try {
        const result = calculator(batchRequest.items[i]);
        results.push(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        errors.push({
          index: i,
          error: errorMessage,
        });
        // Add null to results to maintain index alignment
        results.push(null as R);
      }
    }

    return {
      results,
      errors,
    };
  } else {
    // Single item request - process normally
    try {
      const result = calculator(payload as T);
      return result as SingleResponse<R>;
    } catch (error) {
      // For single items, we want to preserve the original error
      // so it can be handled by the route's error handler
      throw error;
    }
  }
}

/**
 * Validate batch request structure
 * @param payload - The request payload
 * @returns True if it's a valid batch request
 */
export function isBatchRequest(
  payload: unknown
): payload is BatchRequest<unknown> {
  return (
    payload !== null &&
    payload !== undefined &&
    typeof payload === 'object' &&
    Array.isArray(payload.items) &&
    payload.items.length > 0
  );
}

/**
 * Validate single request structure (not a batch)
 * @param payload - The request payload
 * @returns True if it's a single request
 */
export function isSingleRequest(payload: unknown): boolean {
  return (
    payload !== null &&
    payload !== undefined &&
    typeof payload === 'object' &&
    !Array.isArray(payload.items)
  );
}
