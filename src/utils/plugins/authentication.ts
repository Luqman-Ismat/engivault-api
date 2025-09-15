import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { prisma } from '@/utils/database';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
    subscriptionTier: string;
    subscriptionStatus: string;
  };
  apiKey?: {
    id: string;
    keyName: string;
    permissions: any;
    rateLimitPerMinute: number;
    rateLimitPerDay: number;
    usageCountToday: number;
  };
}

export async function registerAuthentication(fastify: FastifyInstance): Promise<void> {
  // API Key authentication middleware
  fastify.addHook('preHandler', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    // Skip authentication for public endpoints
    const publicEndpoints = [
      '/health', 
      '/documentation', 
      '/documentation/json', 
      '/auth/register', 
      '/auth/login',
      '/auth/forgot-password',
      '/auth/reset-password'
    ];
    
    if (publicEndpoints.some(endpoint => request.url.startsWith(endpoint))) {
      return;
    }

    const apiKey = request.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'API key is required. Include X-API-Key header.'
      });
    }

    try {
      // Hash the provided API key for lookup
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      // Find the API key in database
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { user: true }
      });

      if (!apiKeyRecord || !apiKeyRecord.isActive) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid or inactive API key'
        });
      }

      // Check if API key is expired
      if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'API key has expired'
        });
      }

      // Check daily usage limit
      if (apiKeyRecord.usageCountToday >= apiKeyRecord.rateLimitPerDay) {
        return reply.status(429).send({
          statusCode: 429,
          error: 'Rate Limit Exceeded',
          message: 'Daily usage limit exceeded'
        });
      }

      // Check user subscription status
      if (apiKeyRecord.user.subscriptionStatus !== 'active') {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Account subscription is not active'
        });
      }

      // Attach user and API key info to request
      request.user = {
        id: apiKeyRecord.user.id,
        email: apiKeyRecord.user.email,
        subscriptionTier: apiKeyRecord.user.subscriptionTier,
        subscriptionStatus: apiKeyRecord.user.subscriptionStatus
      };

      request.apiKey = {
        id: apiKeyRecord.id,
        keyName: apiKeyRecord.keyName,
        permissions: apiKeyRecord.permissions,
        rateLimitPerMinute: apiKeyRecord.rateLimitPerMinute,
        rateLimitPerDay: apiKeyRecord.rateLimitPerDay,
        usageCountToday: apiKeyRecord.usageCountToday
      };

      // Update usage statistics
      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: {
          usageCountToday: { increment: 1 },
          usageCountTotal: { increment: 1 },
          lastUsedAt: new Date()
        }
      });

      // Log API usage
      await prisma.apiUsage.create({
        data: {
          apiKeyId: apiKeyRecord.id,
          userId: apiKeyRecord.user.id,
          endpoint: request.url,
          method: request.method,
          statusCode: 200, // Will be updated in onResponse hook
          ipAddress: request.ip,
          userAgent: request.headers['user-agent']
        }
      });

    } catch (error) {
      fastify.log.error('Authentication error:', error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Authentication service unavailable'
      });
    }
  });

  // Update usage logging after response
  fastify.addHook('onResponse', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    if (request.apiKey) {
      try {
        // Update the API usage record with actual response data
        const responseTime = Date.now() - (request.context?.startTime || Date.now());
        const requestSize = request.headers['content-length'] 
          ? parseInt(request.headers['content-length'] as string) 
          : undefined;
        const responseSize = reply.getHeader('content-length') 
          ? parseInt(reply.getHeader('content-length') as string) 
          : undefined;

        // Find the most recent usage record for this request
        const latestUsage = await prisma.apiUsage.findFirst({
          where: {
            apiKeyId: request.apiKey.id,
            endpoint: request.url,
            method: request.method
          },
          orderBy: { createdAt: 'desc' }
        });

        if (latestUsage) {
          await prisma.apiUsage.update({
            where: { id: latestUsage.id },
            data: {
              statusCode: reply.statusCode,
              responseTimeMs: responseTime,
              requestSizeBytes: requestSize,
              responseSizeBytes: responseSize
            }
          });
        }
      } catch (error) {
        fastify.log.error('Usage logging error:', error);
      }
    }
  });

  // Register per-API-key rate limiting
  fastify.register(require('@fastify/rate-limit'), {
    max: (request: AuthenticatedRequest) => {
      return request.apiKey?.rateLimitPerMinute || 100;
    },
    timeWindow: '1 minute',
    keyGenerator: (request: AuthenticatedRequest) => {
      return request.apiKey?.id || request.ip;
    },
    errorResponseBuilder: function (_request, context) {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.after}`,
        expiresIn: context.ttl,
      };
    },
  });
}

// Helper function to get authenticated user
export function getAuthenticatedUser(request: FastifyRequest): AuthenticatedRequest['user'] | null {
  return (request as AuthenticatedRequest).user || null;
}

// Helper function to get API key info
export function getApiKeyInfo(request: FastifyRequest): AuthenticatedRequest['apiKey'] | null {
  return (request as AuthenticatedRequest).apiKey || null;
}
