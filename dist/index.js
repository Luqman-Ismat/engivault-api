"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFastifyInstance = createFastifyInstance;
const fastify_1 = __importDefault(require("fastify"));
const environment_1 = require("./config/environment");
const database_1 = require("./utils/database");
const routes_1 = require("./routes");
const errorHandler_1 = require("./utils/errorHandler");
const logger_1 = __importDefault(require("./utils/logger"));
async function createFastifyInstance() {
    const fastify = (0, fastify_1.default)({
        logger: {
            level: environment_1.config.LOG_LEVEL,
        },
    });
    fastify.setErrorHandler(errorHandler_1.errorHandler);
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/cors'))), {
        origin: true,
        credentials: true,
    });
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/jwt'))), {
        secret: environment_1.config.JWT_SECRET,
    });
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/rate-limit'))), {
        max: environment_1.config.RATE_LIMIT_MAX,
        timeWindow: environment_1.config.RATE_LIMIT_TIME_WINDOW,
    });
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/swagger'))), {
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
    await fastify.register(Promise.resolve().then(() => __importStar(require('@fastify/swagger-ui'))), {
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
    fastify.decorate('authenticate', async function (request, reply) {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            reply.send({ success: false, error: 'Unauthorized', timestamp: new Date().toISOString() });
        }
    });
    await (0, routes_1.registerRoutes)(fastify);
    return fastify;
}
async function startServer() {
    try {
        await (0, database_1.connectDatabase)();
        const fastify = await createFastifyInstance();
        const port = environment_1.config.PORT;
        const host = environment_1.config.HOST;
        await fastify.listen({ port, host });
        logger_1.default.info(`🚀 Server listening on ${host}:${port}`);
        logger_1.default.info(`📚 API Documentation available at http://${host}:${port}/documentation`);
        logger_1.default.info(`❤️  Health check available at http://${host}:${port}/health`);
    }
    catch (err) {
        logger_1.default.error(err, 'Error starting server');
        process.exit(1);
    }
}
process.on('SIGINT', async () => {
    logger_1.default.info('Received SIGINT, shutting down gracefully...');
    await (0, database_1.disconnectDatabase)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger_1.default.info('Received SIGTERM, shutting down gracefully...');
    await (0, database_1.disconnectDatabase)();
    process.exit(0);
});
startServer();
//# sourceMappingURL=index.js.map