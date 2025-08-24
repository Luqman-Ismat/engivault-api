"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = npshrRoutes;
const zod_1 = require("zod");
const npsh_1 = require("../logic/npsh");
// Define Zod schema for NpshrCurvePoint
const npshrCurvePointSchema = zod_1.z.object({
    flow: zod_1.z.number(),
    npshr: zod_1.z.number(),
});
// Define Zod schema for the request body
const npshrInputSchema = zod_1.z.object({
    flowRate: zod_1.z.number(),
    npshrCurve: zod_1.z.array(npshrCurvePointSchema).min(2, "NPSHr curve must have at least two points."),
});
async function npshrRoutes(fastify, options) {
    fastify.post('/calculate/npsh-required', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    flowRate: { type: 'number' },
                    npshrCurve: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                flow: { type: 'number' },
                                npshr: { type: 'number' },
                            },
                            required: ['flow', 'npshr'],
                        },
                        minItems: 2,
                    },
                },
                required: ['flowRate', 'npshrCurve'],
            },
        },
    }, async (request, reply) => {
        try {
            const { flowRate, npshrCurve } = request.body;
            const results = (0, npsh_1.calculateNpshr)(flowRate, npshrCurve);
            return reply.send(results);
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: error.message || 'Internal Server Error' });
        }
    });
}
