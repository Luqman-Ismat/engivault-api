"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFastifyInstance = createFastifyInstance;
const fastify_1 = __importDefault(require("fastify"));
const environment_1 = require("@/config/environment");
// Import plugins
const compression_1 = require("@/utils/plugins/compression");
const rateLimit_1 = require("@/utils/plugins/rateLimit");
const swagger_1 = require("@/utils/plugins/swagger");
// import { registerCaching } from '@/utils/plugins/caching';
// Import routes
const routes_1 = require("@/routes");
// Import schemas
const schemas_1 = require("@/schemas");
// Import utilities
const utils_1 = require("@/utils");
async function createFastifyInstance() {
    const fastify = (0, fastify_1.default)({
        logger: {
            level: environment_1.config.LOG_LEVEL,
        },
    });
    // Register plugins
    await (0, compression_1.registerCompression)(fastify);
    await (0, rateLimit_1.registerRateLimit)(fastify);
    // await registerCaching(fastify);
    await (0, swagger_1.registerSwagger)(fastify);
    // Register schemas
    await (0, schemas_1.registerSchemas)(fastify);
    // Register utilities
    await (0, utils_1.registerUtils)(fastify);
    // Register routes
    await (0, routes_1.registerRoutes)(fastify);
    return fastify;
}
async function startServer() {
    try {
        const fastify = await createFastifyInstance();
        const port = environment_1.config.PORT;
        const host = environment_1.config.HOST;
        await fastify.listen({ port, host });
        fastify.log.info(`Server listening on ${host}:${port}`);
        fastify.log.info(`API Documentation available at http://${host}:${port}/documentation`);
        fastify.log.info(`Health check available at http://${host}:${port}/health`);
    }
    catch (err) {
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
//# sourceMappingURL=index.js.map