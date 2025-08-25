import { FastifyInstance } from 'fastify';

export async function registerSchemas(fastify: FastifyInstance): Promise<void> {
  // This function can be used to register any global schemas
  // Currently, schemas are defined in individual route files
  // but this provides a central point for schema registration if needed

  fastify.log.info('Schemas registered');
}
