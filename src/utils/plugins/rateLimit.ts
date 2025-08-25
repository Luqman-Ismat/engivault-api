import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { config } from '@/config/environment';

export async function registerRateLimit(fastify: FastifyInstance): Promise<void> {
  await fastify.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW,
    errorResponseBuilder: function (_request, context) {
      return {
        code: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.after}`,
        expiresIn: context.ttl,
      };
    },
  });
}
