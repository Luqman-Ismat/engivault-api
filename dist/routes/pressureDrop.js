"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = pressureDropRoutes;
const pressureDrop_1 = require("../logic/pressureDrop");
const validation_1 = require("../schemas/validation");
const errorHandler_1 = require("../utils/errorHandler");
const schemaConverter_1 = require("../utils/schemaConverter");
async function pressureDropRoutes(fastify) {
    fastify.post('/calculate/pressure-drop', {
        schema: {
            tags: ['Pressure Drop'],
            summary: 'Calculate pressure drop',
            description: 'Calculate pressure drop using Darcy-Weisbach equation',
            body: (0, schemaConverter_1.createFastifySchema)(validation_1.pressureDropSchema),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        pressureDrop: { type: 'number' },
                        reynoldsNumber: { type: 'number' },
                        frictionFactor: { type: 'number' },
                    },
                    required: ['pressureDrop', 'reynoldsNumber', 'frictionFactor'],
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
            const results = (0, pressureDrop_1.calculatePressureDrop)(inputs);
            return reply.send(results);
        }
        catch (error) {
            (0, errorHandler_1.handleError)(error, reply);
        }
    });
}
//# sourceMappingURL=pressureDrop.js.map