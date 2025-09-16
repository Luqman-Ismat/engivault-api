import { FastifyRequest, FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
    };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: any) => Promise<void>;
  }
}