import Fastify, { FastifyInstance } from 'fastify';
import { config } from '@/config/environment';
import { createLogger, LogConfig } from '@/utils/logger';
import { initializeMetrics } from '@/utils/metrics';
import { registerMiddleware } from '@/utils/middleware';

// Import plugins
import { registerCompression } from '@/utils/plugins/compression';
import { registerRateLimit } from '@/utils/plugins/rateLimit';
import { registerSwagger } from '@/utils/plugins/swagger';
// import { registerCaching } from '@/utils/plugins/caching';

// Import routes
import { registerRoutes } from '@/routes';
import metricsRoutes from '@/routes/metrics';

// Import schemas
import { registerSchemas } from '@/schemas';

// Import utilities
import { registerUtils } from '@/utils';

export async function createFastifyInstance(): Promise<FastifyInstance> {
  // Initialize metrics if enabled
  if (config.ENABLE_METRICS) {
    initializeMetrics();
  }

  // Create logger configuration
  const logConfig: LogConfig = {
    level: config.LOG_LEVEL,
    prettyPrint: config.LOG_PRETTY_PRINT,
    redactPII: config.REDACT_PII,
  };

  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
  });

  // Register middleware
  await registerMiddleware(fastify);

  // Register plugins
  await registerCompression(fastify);
  await registerRateLimit(fastify);
  // await registerCaching(fastify);
  await registerSwagger(fastify);

  // Register schemas
  await registerSchemas(fastify);

  // Register utilities
  await registerUtils(fastify);

  // Register routes
  await registerRoutes(fastify);
  
  // Register metrics routes if enabled
  if (config.ENABLE_METRICS) {
    await fastify.register(metricsRoutes);
  }

  return fastify;
}

async function startServer(): Promise<void> {
  try {
    const fastify = await createFastifyInstance();
    
    const port = config.PORT;
    const host = config.HOST;
    
    await fastify.listen({ port, host });
    
    fastify.log.info(`Server listening on ${host}:${port}`);
    fastify.log.info(`API Documentation available at http://${host}:${port}/documentation`);
    fastify.log.info(`Health check available at http://${host}:${port}/health`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Export build function for testing
export async function build(): Promise<FastifyInstance> {
  return createFastifyInstance();
}

// Start the server
startServer();
