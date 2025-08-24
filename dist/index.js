"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const pressureDrop_1 = __importDefault(require("./routes/pressureDrop"));
const npsh_1 = __importDefault(require("./routes/npsh"));
const flowFittings_1 = __importDefault(require("./routes/flowFittings"));
const pumpSystemCurve_1 = __importDefault(require("./routes/pumpSystemCurve"));
const npshRequired_1 = __importDefault(require("./routes/npshRequired"));
const fastify = (0, fastify_1.default)({
    logger: true
});
fastify.register(pressureDrop_1.default, { prefix: '/api/v1' });
fastify.register(npsh_1.default, { prefix: '/api/v1' });
fastify.register(flowFittings_1.default, { prefix: '/api/v1' });
fastify.register(pumpSystemCurve_1.default, { prefix: '/api/v1' });
fastify.register(npshRequired_1.default, { prefix: '/api/v1' });
fastify.get('/', async (request, reply) => {
    return { status: 'ok' };
});
const start = async () => {
    try {
        await fastify.listen({ port: 3000 });
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
