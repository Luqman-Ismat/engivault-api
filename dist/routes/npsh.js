"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = npshRoutes;
const zod_1 = require("zod");
const npsh_1 = require("../logic/npsh");
// Define the Zod schema for NPSH inputs
const npshInputSchema = zod_1.z.object({
    atmosphericPressure: zod_1.z.number().positive(),
    vaporPressure: zod_1.z.number().positive(),
    fluidDensity: zod_1.z.number().positive(),
    staticHead: zod_1.z.number(),
    frictionLosses: zod_1.z.number().nonnegative(),
    velocityHead: zod_1.z.number().nonnegative().optional(),
    flowRate: zod_1.z.number().nonnegative().optional(),
    pipeDiameter: zod_1.z.number().positive().optional(),
}).refine(data => {
    // Custom validation: if velocityHead is not provided, flowRate and pipeDiameter must be provided
    if (data.velocityHead === undefined) {
        return data.flowRate !== undefined && data.pipeDiameter !== undefined;
    }
    return true;
}, {
    message: "If velocityHead is not provided, flowRate and pipeDiameter must be provided.",
    path: ["velocityHead", "flowRate", "pipeDiameter"],
});
async function npshRoutes(fastify, options) {
    fastify.post('/calculate/npsh', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    atmosphericPressure: { type: 'number' },
                    vaporPressure: { type: 'number' },
                    fluidDensity: { type: 'number' },
                    staticHead: { type: 'number' },
                    frictionLosses: { type: 'number' },
                    velocityHead: { type: 'number' },
                    flowRate: { type: 'number' },
                    pipeDiameter: { type: 'number' },
                },
                required: [
                    'atmosphericPressure',
                    'vaporPressure',
                    'fluidDensity',
                    'staticHead',
                    'frictionLosses',
                ],
            },
        },
    }, async (request, reply) => {
        try {
            // Zod validation is handled by the schema, so request.body is already validated
            const inputs = request.body;
            const results = (0, npsh_1.calculateNpsh)(inputs);
            return reply.send(results);
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
