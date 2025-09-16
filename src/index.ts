import Fastify, { FastifyInstance } from 'fastify';
import { config } from './config/environment';
import { connectDatabase, disconnectDatabase } from './utils/database';
import { registerRoutes } from './routes';
import { errorHandler } from './utils/errorHandler';
import logger from './utils/logger';

export async function createFastifyInstance(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
  });

  // Register error handler
  fastify.setErrorHandler(errorHandler);

  // Register CORS
  await fastify.register(import('@fastify/cors'), {
    origin: true,
    credentials: true,
  });

  // Register JWT authentication
  await fastify.register(import('@fastify/jwt'), {
    secret: config.JWT_SECRET,
  });

  // Register rate limiting
  await fastify.register(import('@fastify/rate-limit'), {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_TIME_WINDOW,
  });

  // Register Swagger documentation
  await fastify.register(import('@fastify/swagger'), {
    swagger: {
      info: {
        title: 'EngiVault API',
        description: 'Simplified Engineering Calculations API',
        version: '2.0.0',
      },
      host: 'localhost:3000',
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Authentication', description: 'User authentication and API key management' },
        { name: 'Hydraulics', description: 'Hydraulic calculations' },
        { name: 'Pumps', description: 'Pump performance calculations' },
        { name: 'Analytics', description: 'Usage analytics and statistics' },
      ],
    },
  });

  await fastify.register(import('@fastify/swagger-ui'), {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (_request, _reply, next) {
        next();
      },
      preHandler: function (_request, _reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, _request, _reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  // Register authentication decorator
  fastify.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send({ success: false, error: 'Unauthorized', timestamp: new Date().toISOString() });
    }
  });

  // Register routes
  await registerRoutes(fastify);

  return fastify;
}

async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Create Fastify instance
    const fastify = await createFastifyInstance();

    // Start server
    const port = config.PORT;
    const host = config.HOST;

    await fastify.listen({ port, host });

    logger.info(`🚀 Server listening on ${host}:${port}`);
    logger.info(`📚 API Documentation available at http://${host}:${port}/documentation`);
    logger.info(`❤️  Health check available at http://${host}:${port}/health`);
  } catch (err: unknown) {
    logger.error(err, 'Error starting server');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

// Start the server
startServer();