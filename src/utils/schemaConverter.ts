import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

export function zodToFastifySchema(zodSchema: z.ZodSchema) {
  return zodToJsonSchema(zodSchema, {
    $refStrategy: 'relative',
    target: 'openApi3',
  });
}

export function createFastifySchema(zodSchema: z.ZodSchema) {
  const jsonSchema = zodToFastifySchema(zodSchema);
  return jsonSchema;
}
