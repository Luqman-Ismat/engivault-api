import { FastifyInstance } from 'fastify';
import compress from '@fastify/compress';

export async function registerCompression(fastify: FastifyInstance): Promise<void> {
  await fastify.register(compress, {
    threshold: 1024, // Only compress responses larger than 1KB
    encodings: ['gzip', 'deflate'],
  });
}
