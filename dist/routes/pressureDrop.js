"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = pressureDropRoutes;
const pressureDrop_1 = require("../logic/pressureDrop");
// Define the schema for the request body
const pressureDropSchema = {
    type: 'object',
    required: [
        'flowRate',
        'pipeDiameter',
        'pipeLength',
        'fluidDensity',
        'fluidViscosity',
        'roughness',
    ],
    properties: {
        flowRate: { type: 'number' },
        pipeDiameter: { type: 'number' },
        pipeLength: { type: 'number' },
        fluidDensity: { type: 'number' },
        fluidViscosity: { type: 'number' },
        roughness: { type: 'number' },
    },
};
async function pressureDropRoutes(fastify, options) {
    fastify.post('/calculate/pressure-drop', {
        schema: {
            body: pressureDropSchema,
        },
    }, async (request, reply) => {
        try {
            const inputs = request.body;
            const results = (0, pressureDrop_1.calculatePressureDrop)(inputs);
            return reply.send(results);
        }
        catch (error) {
            fastify.log.error(error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
}
