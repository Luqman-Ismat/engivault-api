"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = flowFittingsRoutes;
const flowFittings_1 = require("../logic/flowFittings");
const validation_1 = require("../schemas/validation");
const errorHandler_1 = require("../utils/errorHandler");
const schemaConverter_1 = require("../utils/schemaConverter");
async function flowFittingsRoutes(fastify) {
    fastify.post('/calculate/flow-fittings', {
        schema: {
            tags: ['Flow Fittings'],
            summary: 'Calculate flow fitting pressure drop',
            description: 'Calculate pressure drop across flow fittings using K-factor method',
            body: (0, schemaConverter_1.createFastifySchema)(validation_1.flowFittingsSchema),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        pressureDrop: { type: 'number' },
                    },
                    required: ['pressureDrop'],
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
            const results = (0, flowFittings_1.calculateFittingPressureDrop)(inputs);
            return reply.send(results);
        }
        catch (error) {
            (0, errorHandler_1.handleError)(error, reply);
        }
    });
}
