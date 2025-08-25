"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = pumpSystemCurveRoutes;
const pumpSystemCurve_1 = require("../logic/pumpSystemCurve");
const validation_1 = require("../schemas/validation");
const errorHandler_1 = require("../utils/errorHandler");
const schemaConverter_1 = require("../utils/schemaConverter");
async function pumpSystemCurveRoutes(fastify) {
    fastify.post('/calculate/pump-system-curve', {
        schema: {
            tags: ['Pump System Curve'],
            summary: 'Calculate pump system curve intersection',
            description: 'Find the operating point where pump curve intersects system curve',
            body: (0, schemaConverter_1.createFastifySchema)(validation_1.pumpSystemCurveSchema),
            response: {
                200: {
                    type: 'object',
                    properties: {
                        flow: { type: 'number' },
                        head: { type: 'number' },
                    },
                    required: ['flow', 'head'],
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
            const { pumpCurve, systemCurve } = request.body;
            // Construct the system curve equation function
            const systemCurveEquation = (flow) => {
                return (systemCurve.staticHead +
                    systemCurve.resistanceCoefficient * Math.pow(flow, 2));
            };
            const operatingPoint = (0, pumpSystemCurve_1.calculateOperatingPoint)(pumpCurve, systemCurveEquation);
            return reply.send(operatingPoint);
        }
        catch (error) {
            (0, errorHandler_1.handleError)(error, reply);
        }
    });
}
//# sourceMappingURL=pumpSystemCurve.js.map