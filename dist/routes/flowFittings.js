"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = flowFittingsRoutes;
const zod_1 = require("zod");
const flowFittings_1 = require("../logic/flowFittings");
// Define the Zod schema for FlowFittings inputs
const flowFittingsInputSchema = zod_1.z.object({
    kFactor: zod_1.z.number().nonnegative(),
    fluidDensity: zod_1.z.number().positive(),
    velocity: zod_1.z.number().nonnegative(),
});
async function flowFittingsRoutes(fastify, options) {
    fastify.post('/calculate/flow-fittings', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    kFactor: { type: 'number' },
                    fluidDensity: { type: 'number' },
                    velocity: { type: 'number' },
                },
                required: [
                    'kFactor',
                    'fluidDensity',
                    'velocity',
                ],
            },
        },
    }, async (request, reply) => {
        try {
            const inputs = request.body;
            const results = (0, flowFittings_1.calculateFittingPressureDrop)(inputs);
            return reply.send(results);
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
