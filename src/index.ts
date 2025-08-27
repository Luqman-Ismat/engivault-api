import Fastify, { FastifyInstance } from 'fastify';
import { config } from '@/config/environment';
import { createLogger, LogConfig } from '@/utils/logger';
import { initializeMetrics } from '@/utils/metrics';
import { registerMiddleware } from '@/utils/middleware';

// Import plugins
import { registerPerformancePlugins } from '@/utils/plugins/performance';
import { registerSwagger } from '@/utils/plugins/swagger';

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
  await registerPerformancePlugins(fastify);
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
    fastifyInstance = await createFastifyInstance();
    
    const port = config.PORT;
    const host = config.HOST;
    
    await fastifyInstance.listen({ port, host });
    
    fastifyInstance.log.info(`Server listening on ${host}:${port}`);
    fastifyInstance.log.info(`API Documentation available at http://${host}:${port}/documentation`);
    fastifyInstance.log.info(`Health check available at http://${host}:${port}/health`);
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${config.PORT} is already in use. Please try a different port or stop the existing server.`);
      console.error('You can set a different port using the PORT environment variable.');
    } else {
      console.error('Error starting server:', err);
    }
    process.exit(1);
  }
}

let fastifyInstance: FastifyInstance | null = null;

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  if (fastifyInstance) {
    await fastifyInstance.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (fastifyInstance) {
    await fastifyInstance.close();
  }
  process.exit(0);
});

// Export build function for testing
export async function build(): Promise<FastifyInstance> {
  return createFastifyInstance();
}

// Start the server
startServer();
