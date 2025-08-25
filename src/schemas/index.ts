import { FastifyInstance } from 'fastify';
import {
  quantityJsonSchema,
  fluidJsonSchema,
  warningJsonSchema,
  calcMetaJsonSchema,
} from './common';

export async function registerSchemas(fastify: FastifyInstance): Promise<void> {
  // Register common schemas with Fastify for Swagger documentation
  fastify.addSchema({
    $id: 'quantity',
    ...quantityJsonSchema,
  });

  fastify.addSchema({
    $id: 'fluid',
    ...fluidJsonSchema,
  });

  fastify.addSchema({
    $id: 'warning',
    ...warningJsonSchema,
  });

  fastify.addSchema({
    $id: 'calcMeta',
    ...calcMetaJsonSchema,
  });

  // Currently, schemas are defined in individual route files
  // but this provides a central point for schema registration if needed

  fastify.log.info('Schemas registered');
}

// Export common schemas for use in routes
export * from './common';
export * from './validation';
