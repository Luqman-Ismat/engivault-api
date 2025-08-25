"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = npshRoutes;
const npsh_1 = require("../logic/npsh");
const validation_1 = require("../schemas/validation");
const errorHandler_1 = require("../utils/errorHandler");
const schemaConverter_1 = require("../utils/schemaConverter");
async function npshRoutes(fastify) {
    fastify.post('/calculate/npsh', {
        schema: {
            tags: ['NPSH'],
            summary: 'Calculate NPSH Available',
            description: 'Calculate Net Positive Suction Head Available (NPSHa)',
            body: (0, schemaConverter_1.createFastifySchema)(validation_1.npshSchema),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        npsha: { type: 'number' },
                    },
                    required: ['npsha'],
                },
                400: {
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
            const inputs = request.body;
            const results = (0, npsh_1.calculateNpsh)(inputs);
            return reply.send(results);
        }
        catch (error) {
            (0, errorHandler_1.handleError)(error, reply);
        }
    });
}
//# sourceMappingURL=npsh.js.map