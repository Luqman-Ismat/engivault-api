"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFastifyInstance = createFastifyInstance;
exports.build = build;
const fastify_1 = __importDefault(require("fastify"));
const environment_1 = require("@/config/environment");
const metrics_1 = require("@/utils/metrics");
const middleware_1 = require("@/utils/middleware");
// Import plugins
const performance_1 = require("@/utils/plugins/performance");
const swagger_1 = require("@/utils/plugins/swagger");
const authentication_1 = require("@/utils/plugins/authentication");
// Import routes
const routes_1 = require("@/routes");
const metrics_2 = __importDefault(require("@/routes/metrics"));
// Import schemas
const schemas_1 = require("@/schemas");
// Import utilities
const utils_1 = require("@/utils");
async function createFastifyInstance() {
    // Initialize metrics if enabled
    if (environment_1.config.ENABLE_METRICS) {
        (0, metrics_1.initializeMetrics)();
    }
    // Create logger configuration
    const logConfig = {
        level: environment_1.config.LOG_LEVEL,
        prettyPrint: environment_1.config.LOG_PRETTY_PRINT,
        redactPII: environment_1.config.REDACT_PII,
    };
    const fastify = (0, fastify_1.default)({
        logger: {
            level: environment_1.config.LOG_LEVEL,
        },
    });
    // Register middleware
    await (0, middleware_1.registerMiddleware)(fastify);
    // Register plugins
    await (0, performance_1.registerPerformancePlugins)(fastify);
    await (0, swagger_1.registerSwagger)(fastify);
    await (0, authentication_1.registerAuthentication)(fastify);
    // Register schemas
    await (0, schemas_1.registerSchemas)(fastify);
    // Register utilities
    await (0, utils_1.registerUtils)(fastify);
    // Register routes
    await (0, routes_1.registerRoutes)(fastify);
    // Register metrics routes if enabled
    if (environment_1.config.ENABLE_METRICS) {
        await fastify.register(metrics_2.default);
    }
    return fastify;
}
async function startServer() {
    try {
        fastifyInstance = await createFastifyInstance();
        const port = environment_1.config.PORT;
        const host = environment_1.config.HOST;
        await fastifyInstance.listen({ port, host });
        fastifyInstance.log.info(`Server listening on ${host}:${port}`);
        fastifyInstance.log.info(`API Documentation available at http://${host}:${port}/documentation`);
        fastifyInstance.log.info(`Health check available at http://${host}:${port}/health`);
    }
    catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'EADDRINUSE') {
            console.error(`Port ${environment_1.config.PORT} is already in use. Please try a different port or stop the existing server.`);
            console.error('You can set a different port using the PORT environment variable.');
        }
        else {
            console.error('Error starting server:', err);
        }
        process.exit(1);
    }
}
let fastifyInstance = null;
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
async function build() {
    return createFastifyInstance();
}
// Start the server
startServer();
