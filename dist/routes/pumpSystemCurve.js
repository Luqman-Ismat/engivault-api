"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = pumpSystemCurveRoutes;
const zod_1 = require("zod");
const pumpSystemCurve_1 = require("../logic/pumpSystemCurve");
// Define Zod schema for PumpCurvePoint
const pumpCurvePointSchema = zod_1.z.object({
    flow: zod_1.z.number(),
    head: zod_1.z.number(),
});
// Define Zod schema for the request body
const pumpSystemCurveInputSchema = zod_1.z.object({
    pumpCurve: zod_1.z.array(pumpCurvePointSchema).min(2, "Pump curve must have at least two points."),
    systemCurve: zod_1.z.object({
        staticHead: zod_1.z.number(),
        resistanceCoefficient: zod_1.z.number().nonnegative(), // K in H_sys = H_static + K * Q^2
    }),
});
async function pumpSystemCurveRoutes(fastify, options) {
    fastify.post('/calculate/pump-system-curve', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    pumpCurve: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                flow: { type: 'number' },
                                head: { type: 'number' },
                            },
                            required: ['flow', 'head'],
                        },
                        minItems: 2,
                    },
                    systemCurve: {
                        type: 'object',
                        properties: {
                            staticHead: { type: 'number' },
                            resistanceCoefficient: { type: 'number' },
                        },
                        required: ['staticHead', 'resistanceCoefficient'],
                    },
                },
                required: ['pumpCurve', 'systemCurve'],
            },
        },
    }, async (request, reply) => {
        try {
            const { pumpCurve, systemCurve } = request.body;
            // Construct the system curve equation function
            const systemCurveEquation = (flow) => {
                return systemCurve.staticHead + systemCurve.resistanceCoefficient * Math.pow(flow, 2);
            };
            const operatingPoint = (0, pumpSystemCurve_1.calculateOperatingPoint)(pumpCurve, systemCurveEquation);
            return reply.send(operatingPoint);
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: error.message || 'Internal Server Error' });
        }
    });
}
