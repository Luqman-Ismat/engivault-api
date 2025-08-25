import Fastify, { FastifyInstance } from 'fastify';
import { config } from '@/config/environment';

// Import plugins
import { registerCompression } from '@/utils/plugins/compression';
import { registerRateLimit } from '@/utils/plugins/rateLimit';
import { registerSwagger } from '@/utils/plugins/swagger';
// import { registerCaching } from '@/utils/plugins/caching';

// Import routes
import { registerRoutes } from '@/routes';

// Import schemas
import { registerSchemas } from '@/schemas';

// Import utilities
import { registerUtils } from '@/utils';

export async function createFastifyInstance(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL,
    },
  });

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

// Start the server
startServer();
