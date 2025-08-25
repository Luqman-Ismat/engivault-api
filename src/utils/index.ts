import { FastifyInstance } from 'fastify';

export async function registerUtils(fastify: FastifyInstance): Promise<void> {
  // This function can be used to register any utility functions
  // Currently, utilities are imported as needed
  // but this provides a central point for utility registration if needed

  fastify.log.info('Utilities registered');
}
