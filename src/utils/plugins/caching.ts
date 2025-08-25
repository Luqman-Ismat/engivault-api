import { FastifyInstance } from 'fastify';
import caching from '@fastify/caching';

export async function registerCaching(fastify: FastifyInstance): Promise<void> {
  await fastify.register(caching, {
    privacy: caching.privacy.NOCACHE,
    expiresIn: 300, // 5 minutes
  });
}
