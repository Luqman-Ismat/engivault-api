import Fastify from 'fastify';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import pressureDropRoutes from './routes/pressureDrop';
import npshRoutes from './routes/npsh';
import flowFittingsRoutes from './routes/flowFittings';
import pumpSystemCurveRoutes from './routes/pumpSystemCurve';
import npshRequiredRoutes from './routes/npshRequired';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    prettyPrint: process.env.NODE_ENV !== 'production'
  }
});

// Register compression plugin
await fastify.register(compress, {
  threshold: 1024, // Only compress responses larger than 1KB
  encodings: ['gzip', 'deflate']
});

// Register rate limiting
await fastify.register(rateLimit, {
  max: 100, // Maximum 100 requests
  timeWindow: '1 minute', // Per minute
  errorResponseBuilder: function (request, context) {
    return {
      code: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded, retry in ${context.after}`,
      expiresIn: context.ttl
    };
  }
});

// Register Swagger for API documentation
await fastify.register(swagger, {
  swagger: {
    info: {
      title: 'EngiVault API',
      description: 'Engineering calculations API for fluid dynamics and pump systems',
      version: '1.0.0'
    },
    host: process.env.HOST || 'localhost:3000',
    schemes: ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    tags: [
      { name: 'Pressure Drop', description: 'Pressure drop calculations' },
      { name: 'NPSH', description: 'Net Positive Suction Head calculations' },
      { name: 'Flow Fittings', description: 'Flow fitting pressure drop calculations' },
      { name: 'Pump System Curve', description: 'Pump system curve analysis' }
    ]
  }
});

await fastify.register(swaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  };
});

// Root endpoint
fastify.get('/', async (request, reply) => {
  return {
    status: 'ok',
    message: 'EngiVault API is running',
    documentation: '/documentation',
    health: '/health'
  };
});

// Register API routes with proper tags for documentation
await fastify.register(pressureDropRoutes, { prefix: '/api/v1' });
await fastify.register(npshRoutes, { prefix: '/api/v1' });
await fastify.register(flowFittingsRoutes, { prefix: '/api/v1' });
await fastify.register(pumpSystemCurveRoutes, { prefix: '/api/v1' });
await fastify.register(npshRequiredRoutes, { prefix: '/api/v1' });

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`Server listening on ${host}:${port}`);
    fastify.log.info(`API Documentation available at http://${host}:${port}/documentation`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
