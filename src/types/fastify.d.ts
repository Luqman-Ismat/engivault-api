import { FastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
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
}
