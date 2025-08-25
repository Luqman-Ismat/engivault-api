"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = npshrRoutes;
const npsh_1 = require("../logic/npsh");
const validation_1 = require("../schemas/validation");
const errorHandler_1 = require("../utils/errorHandler");
const schemaConverter_1 = require("../utils/schemaConverter");
async function npshrRoutes(fastify) {
    fastify.post('/calculate/npsh-required', {
        schema: {
            tags: ['NPSH'],
            summary: 'Calculate NPSH Required',
            description: 'Calculate Net Positive Suction Head Required (NPSHr) from curve data',
            body: (0, schemaConverter_1.createFastifySchema)(validation_1.npshrSchema),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        npshr: { type: 'number' },
                    },
                    required: ['npshr'],
                },
                400: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        code: { type: 'string' },
                        details: { type: 'object' },
                    },
                },
                422: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        code: { type: 'string' },
                        details: { type: 'object' },
                    },
                },
                500: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        code: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { flowRate, npshrCurve } = request.body;
            const results = (0, npsh_1.calculateNpshr)(flowRate, npshrCurve);
            return reply.send(results);
        }
        catch (error) {
            (0, errorHandler_1.handleError)(error, reply);
        }
    });
}
//# sourceMappingURL=npshRequired.js.map