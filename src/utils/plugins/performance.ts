import { FastifyInstance } from 'fastify';
import { config } from '@/config/environment';
import fastifyCompress from '@fastify/compress';

/**
 * Register performance optimization plugins
 * - Compression for payloads > 1KB
 * - ETag caching for responses
 * - Rate limiting per IP
 */
export async function registerPerformancePlugins(fastify: FastifyInstance): Promise<void> {
  // Register compression plugin
  if (config.ENABLE_COMPRESSION) {
    await fastify.register(fastifyCompress, {
      threshold: 1024,
      encodings: ['gzip', 'deflate'],
    });
  }

  // Register rate limiting plugin
  await fastify.register(import('@fastify/rate-limit'), {
    max: config.RATE_LIMIT_MAX, // 100 requests per window
    timeWindow: config.RATE_LIMIT_TIME_WINDOW, // 1 minute window
    allowList: (request) => {
      // Allow health checks and metrics
      return request.url === '/health' || request.url === '/metrics';
    },
    keyGenerator: (request) => {
      // Use IP address for rate limiting
      return request.ip;
    },
    errorResponseBuilder: (request, context) => {
      return {
        code: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${Math.ceil(context.ttl / 1000)} seconds`,
        retryAfter: Math.ceil(context.ttl / 1000)
      };
    },
    // Custom headers
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true
    }
  });

  // Add ETag caching for GET requests
  if (config.ENABLE_CACHING) {
    fastify.addHook('onRequest', async (request, reply) => {
      // Skip caching for non-GET requests
      if (request.method !== 'GET') {
        return;
      }

      // Skip caching for health and metrics endpoints
      if (request.url === '/health' || request.url === '/metrics') {
        return;
      }

      const etag = generateETag(request.url);
      
      // Check if client sent If-None-Match header
      const ifNoneMatch = request.headers['if-none-match'];
      if (ifNoneMatch === etag) {
        reply.status(304).send();
        return;
      }

      // Set cache headers for GET requests
      reply.header('Cache-Control', `public, max-age=${Math.floor(config.CACHE_TTL / 1000)}`);
      reply.header('ETag', etag);
    });
  }

  // Add compression headers logging
  fastify.addHook('onResponse', async (request, reply) => {
    const contentEncoding = reply.getHeader('content-encoding');
    const contentLength = reply.getHeader('content-length');
    
    if (contentEncoding) {
      fastify.log.info({
        url: request.url,
        method: request.method,
        compression: contentEncoding,
        originalSize: contentLength,
        compressed: true
      });
    }
  });
}

/**
 * Generate ETag for caching
 * @param url Request URL
 * @returns ETag string
 */
function generateETag(url: string): string {
  // Simple ETag generation based on URL and timestamp
  // In production, you might want to use a hash of the response content
  const timestamp = Math.floor(Date.now() / (config.CACHE_TTL / 10)); // Change every 10% of cache TTL
  return `"${Buffer.from(`${url}-${timestamp}`).toString('base64').slice(0, 8)}"`;
}

/**
 * Check if response should be compressed
 * @param payload Response payload
 * @returns boolean
 */
export function shouldCompress(payload: string | Buffer): boolean {
  if (typeof payload === 'string') {
    return payload.length > 1024;
  }
  return payload.length > 1024;
}
