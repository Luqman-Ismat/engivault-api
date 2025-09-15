import { FastifyInstance } from 'fastify';
import { prisma } from '@/utils/database';

export default async function analyticsRoutes(fastify: FastifyInstance) {
  // Get usage statistics
  fastify.get('/analytics/usage', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get API usage statistics',
      description: 'Get usage statistics for the authenticated user',
      security: [{ apiKey: [] }],
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'number', minimum: 1, maximum: 365, default: 30 },
          groupBy: { type: 'string', enum: ['day', 'hour', 'endpoint'], default: 'day' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            summary: {
              type: 'object',
              properties: {
                totalRequests: { type: 'number' },
                successfulRequests: { type: 'number' },
                failedRequests: { type: 'number' },
                averageResponseTime: { type: 'number' },
                totalDataTransferred: { type: 'number' }
              }
            },
            usage: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  period: { type: 'string' },
                  requests: { type: 'number' },
                  successfulRequests: { type: 'number' },
                  failedRequests: { type: 'number' },
                  averageResponseTime: { type: 'number' }
                }
              }
            },
            topEndpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  endpoint: { type: 'string' },
                  requests: { type: 'number' },
                  averageResponseTime: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const { days = 30, groupBy = 'day' } = request.query as { days?: number; groupBy?: string };
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all usage data for the user
      const usageData = await prisma.apiUsage.findMany({
        where: {
          userId: request.user.id,
          createdAt: {
            gte: startDate
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Calculate summary statistics
      const totalRequests = usageData.length;
      const successfulRequests = usageData.filter(u => u.statusCode >= 200 && u.statusCode < 300).length;
      const failedRequests = totalRequests - successfulRequests;
      const averageResponseTime = usageData
        .filter(u => u.responseTimeMs !== null)
        .reduce((sum, u) => sum + (u.responseTimeMs || 0), 0) / totalRequests || 0;
      
      const totalDataTransferred = usageData.reduce((sum, u) => 
        sum + (u.requestSizeBytes || 0) + (u.responseSizeBytes || 0), 0
      );

      // Group usage by period
      const groupedUsage = new Map<string, {
        requests: number;
        successfulRequests: number;
        failedRequests: number;
        responseTimes: number[];
      }>();

      usageData.forEach(usage => {
        let key: string;
        
        if (groupBy === 'hour') {
          key = usage.createdAt.toISOString().slice(0, 13) + ':00:00Z';
        } else if (groupBy === 'endpoint') {
          key = usage.endpoint;
        } else {
          key = usage.createdAt.toISOString().slice(0, 10);
        }

        if (!groupedUsage.has(key)) {
          groupedUsage.set(key, {
            requests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: []
          });
        }

        const group = groupedUsage.get(key)!;
        group.requests++;
        
        if (usage.statusCode >= 200 && usage.statusCode < 300) {
          group.successfulRequests++;
        } else {
          group.failedRequests++;
        }
        
        if (usage.responseTimeMs !== null) {
          group.responseTimes.push(usage.responseTimeMs);
        }
      });

      // Format grouped usage
      const formattedUsage = Array.from(groupedUsage.entries()).map(([period, data]) => ({
        period,
        requests: data.requests,
        successfulRequests: data.successfulRequests,
        failedRequests: data.failedRequests,
        averageResponseTime: data.responseTimes.length > 0 
          ? data.responseTimes.reduce((sum, time) => sum + time, 0) / data.responseTimes.length 
          : 0
      })).sort((a, b) => a.period.localeCompare(b.period));

      // Get top endpoints
      const endpointStats = new Map<string, { requests: number; responseTimes: number[] }>();
      
      usageData.forEach(usage => {
        if (!endpointStats.has(usage.endpoint)) {
          endpointStats.set(usage.endpoint, { requests: 0, responseTimes: [] });
        }
        
        const stats = endpointStats.get(usage.endpoint)!;
        stats.requests++;
        
        if (usage.responseTimeMs !== null) {
          stats.responseTimes.push(usage.responseTimeMs);
        }
      });

      const topEndpoints = Array.from(endpointStats.entries())
        .map(([endpoint, data]) => ({
          endpoint,
          requests: data.requests,
          averageResponseTime: data.responseTimes.length > 0
            ? data.responseTimes.reduce((sum, time) => sum + time, 0) / data.responseTimes.length
            : 0
        }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 10);

      return reply.send({
        summary: {
          totalRequests,
          successfulRequests,
          failedRequests,
          averageResponseTime: Math.round(averageResponseTime),
          totalDataTransferred
        },
        usage: formattedUsage,
        topEndpoints
      });

    } catch (error) {
      fastify.log.error('Analytics error:', error as Error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to retrieve usage analytics'
      });
    }
  });

  // Get API key usage statistics
  fastify.get('/analytics/api-keys', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get API key usage statistics',
      description: 'Get usage statistics per API key for the authenticated user',
      security: [{ apiKey: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            apiKeys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  keyName: { type: 'string' },
                  totalRequests: { type: 'number' },
                  requestsToday: { type: 'number' },
                  lastUsedAt: { type: 'string' },
                  averageResponseTime: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        where: { userId: request.user.id },
        include: {
          usage: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            }
          }
        }
      });

      const apiKeyStats = apiKeys.map(key => {
        const totalRequests = key.usage.length;
        const requestsToday = key.usageCountToday;
        const responseTimes = key.usage
          .filter(u => u.responseTimeMs !== null)
          .map(u => u.responseTimeMs!);
        
        const averageResponseTime = responseTimes.length > 0
          ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
          : 0;

        return {
          id: key.id,
          keyName: key.keyName,
          totalRequests,
          requestsToday,
          lastUsedAt: key.lastUsedAt?.toISOString() || null,
          averageResponseTime: Math.round(averageResponseTime)
        };
      });

      return reply.send({ apiKeys: apiKeyStats });

    } catch (error) {
      fastify.log.error('API key analytics error:', error as Error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to retrieve API key analytics'
      });
    }
  });

  // Get subscription limits and usage
  fastify.get('/analytics/limits', {
    schema: {
      tags: ['Analytics'],
      summary: 'Get subscription limits and current usage',
      description: 'Get current usage against subscription limits',
      security: [{ apiKey: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            subscription: {
              type: 'object',
              properties: {
                tier: { type: 'string' },
                status: { type: 'string' }
              }
            },
            limits: {
              type: 'object',
              properties: {
                requestsPerMinute: { type: 'number' },
                requestsPerDay: { type: 'number' },
                requestsPerMonth: { type: 'number' }
              }
            },
            usage: {
              type: 'object',
              properties: {
                requestsToday: { type: 'number' },
                requestsThisMonth: { type: 'number' },
                requestsPerMinuteUsed: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request: any, reply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
        include: {
          apiKeys: {
            where: { isActive: true }
          }
        }
      });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      // Define limits based on subscription tier
      const limits = {
        free: { requestsPerMinute: 100, requestsPerDay: 1000, requestsPerMonth: 10000 },
        basic: { requestsPerMinute: 500, requestsPerDay: 10000, requestsPerMonth: 100000 },
        pro: { requestsPerMinute: 2000, requestsPerDay: 100000, requestsPerMonth: 1000000 },
        enterprise: { requestsPerMinute: 10000, requestsPerDay: 1000000, requestsPerMonth: 10000000 }
      };

      const userLimits = limits[user.subscriptionTier as keyof typeof limits] || limits.free;

      // Calculate current usage
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const [usageToday, usageThisMonth] = await Promise.all([
        prisma.apiUsage.count({
          where: {
            userId: user.id,
            createdAt: { gte: today }
          }
        }),
        prisma.apiUsage.count({
          where: {
            userId: user.id,
            createdAt: { gte: thisMonth }
          }
        })
      ]);

      // Calculate per-minute usage (last minute)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const requestsPerMinuteUsed = await prisma.apiUsage.count({
        where: {
          userId: user.id,
          createdAt: { gte: oneMinuteAgo }
        }
      });

      return reply.send({
        subscription: {
          tier: user.subscriptionTier,
          status: user.subscriptionStatus
        },
        limits: userLimits,
        usage: {
          requestsToday: usageToday,
          requestsThisMonth: usageThisMonth,
          requestsPerMinuteUsed
        }
      });

    } catch (error) {
      fastify.log.error('Limits analytics error:', error as Error);
      return reply.status(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Failed to retrieve limits information'
      });
    }
  });
}
