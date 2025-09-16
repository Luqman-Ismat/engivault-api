import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/database';
import { createSuccessResponse, AppError, handleAsync } from '../utils/errorHandler';
// import logger from '@/utils/logger';

export default async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  // Get usage statistics
  fastify.get('/analytics/usage', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Analytics'],
      summary: 'Get usage statistics',
      description: 'Get API usage statistics for the authenticated user',
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'number', minimum: 1, maximum: 365, default: 30 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalRequests: { type: 'number' },
                requestsToday: { type: 'number' },
                requestsThisMonth: { type: 'number' },
                averageResponseTime: { type: 'number' },
                topEndpoints: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      endpoint: { type: 'string' },
                      count: { type: 'number' },
                    },
                  },
                },
                dailyUsage: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string' },
                      requests: { type: 'number' },
                    },
                  },
                },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).userId;
    const { days = 30 } = request.query as { days?: number };
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get total requests
    const totalRequests = await prisma.apiUsage.count({
      where: { userId },
    });
    
    // Get requests today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestsToday = await prisma.apiUsage.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });
    
    // Get requests this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const requestsThisMonth = await prisma.apiUsage.count({
      where: {
        userId,
        createdAt: { gte: thisMonth },
      },
    });
    
    // Get average response time
    const avgResponseTime = await prisma.apiUsage.aggregate({
      where: { userId },
      _avg: { responseTimeMs: true },
    });
    
    // Get top endpoints
    const topEndpoints = await prisma.apiUsage.groupBy({
      by: ['endpoint'],
      where: { userId },
      _count: { endpoint: true },
      orderBy: { _count: { endpoint: 'desc' } },
      take: 10,
    });
    
    // Get daily usage
    const dailyUsage = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as requests
      FROM api_usage 
      WHERE user_id = ${userId} 
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    ` as Array<{ date: string; requests: number }>;
    
    const response = createSuccessResponse({
      totalRequests,
      requestsToday,
      requestsThisMonth,
      averageResponseTime: avgResponseTime._avg.responseTimeMs || 0,
      topEndpoints: topEndpoints.map(item => ({
        endpoint: item.endpoint,
        count: item._count.endpoint,
      })),
      dailyUsage,
    });
    
    return reply.send(response);
  }));

  // Get API key performance
  fastify.get('/analytics/api-keys', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Analytics'],
      summary: 'Get API key performance',
      description: 'Get performance statistics for all API keys',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  keyName: { type: 'string' },
                  usageCountToday: { type: 'number' },
                  usageCountTotal: { type: 'string' },
                  lastUsedAt: { type: 'string' },
                  averageResponseTime: { type: 'number' },
                  isActive: { type: 'boolean' },
                },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).userId;
    
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        keyName: true,
        usageCountToday: true,
        usageCountTotal: true,
        lastUsedAt: true,
        isActive: true,
      },
    });
    
    // Get average response time for each API key
    const apiKeyPerformance = await Promise.all(
      apiKeys.map(async (apiKey) => {
        const avgResponseTime = await prisma.apiUsage.aggregate({
          where: { apiKeyId: apiKey.id },
          _avg: { responseTimeMs: true },
        });
        
        return {
          ...apiKey,
          averageResponseTime: avgResponseTime._avg.responseTimeMs || 0,
        };
      })
    );
    
    const response = createSuccessResponse(apiKeyPerformance);
    return reply.send(response);
  }));

  // Get subscription limits
  fastify.get('/analytics/limits', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['Analytics'],
      summary: 'Get subscription limits',
      description: 'Get current subscription limits and usage',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                subscriptionTier: { type: 'string' },
                requestsPerMonth: { type: 'number' },
                requestsPerDay: { type: 'number' },
                requestsPerMinute: { type: 'number' },
                requestsUsedThisMonth: { type: 'number' },
                requestsUsedToday: { type: 'number' },
                remainingRequestsThisMonth: { type: 'number' },
                remainingRequestsToday: { type: 'number' },
              },
            },
            timestamp: { type: 'string' },
          },
        },
      },
    },
  }, handleAsync(async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).userId;
    
    // Get user subscription info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Get subscription plan limits
    const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
      where: { tier: user.subscriptionTier },
    });
    
    // Get usage this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const requestsUsedThisMonth = await prisma.apiUsage.count({
      where: {
        userId,
        createdAt: { gte: thisMonth },
      },
    });
    
    // Get usage today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestsUsedToday = await prisma.apiUsage.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });
    
    const response = createSuccessResponse({
      subscriptionTier: user.subscriptionTier,
      requestsPerMonth: subscriptionPlan?.requestsPerMonth || 100,
      requestsPerDay: subscriptionPlan?.requestsPerDay || 10,
      requestsPerMinute: subscriptionPlan?.requestsPerMinute || 5,
      requestsUsedThisMonth,
      requestsUsedToday,
      remainingRequestsThisMonth: Math.max(0, (subscriptionPlan?.requestsPerMonth || 100) - requestsUsedThisMonth),
      remainingRequestsToday: Math.max(0, (subscriptionPlan?.requestsPerDay || 10) - requestsUsedToday),
    });
    
    return reply.send(response);
  }));
}