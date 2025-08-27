"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = npshRoutes;
const npsh_1 = require("../logic/npsh");
const validation_1 = require("../schemas/validation");
const errorHandler_1 = require("../utils/errorHandler");
const schemaConverter_1 = require("../utils/schemaConverter");
const errorHelper_1 = require("../utils/errorHelper");
async function npshRoutes(fastify) {
    fastify.post('/calculate/npsh', {
        schema: {
            tags: ['Pumps'],
            summary: 'Calculate Net Positive Suction Head Available (NPSHa)',
            description: `Calculate the Net Positive Suction Head Available (NPSHa) for pump suction conditions.

**Equation Used:**
- **NPSHa = P_atm/ρg + P_gage/ρg + Z - h_f - P_v/ρg**
  - P_atm: Atmospheric pressure (Pa)
  - P_gage: Gage pressure at suction (Pa)
  - Z: Elevation head (m)
  - h_f: Friction head loss (m)
  - P_v: Vapor pressure (Pa)

**Validity Ranges:**
- Temperature: 0°C < T < 100°C (for water)
- Pressure: 0.8 bar < P < 2.0 bar (atmospheric)
- Elevation: -100 m < Z < 1000 m
- Flow Rate: 0.001 m³/s < Q < 10 m³/s

**Safety Margins:**
- Recommended NPSHa > 1.5 × NPSHr (pump required)
- Minimum NPSHa > 0.5 m for most applications

**References:**
- ANSI/HI 9.6.1-2017: "Rotodynamic Pumps - Guideline for NPSH Margin"
- Karassik, I.J. et al. (2008). "Pump Handbook" (4th ed.). McGraw-Hill.

**Version:** 1.0.0`,
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
            const results = (0, npsh_1.calculateCavitationRisk)(inputs);
            // Add engineering hints based on NPSH results
            const hints = errorHelper_1.ErrorHelper.addEngineeringHints('npsh', {
                npsha: results.npshAvailable?.value,
                npshr: results.npshRequired?.value,
            });
            // If there are hints, add them to the response
            if (hints.length > 0) {
                return reply.send({
                    ...results,
                    warnings: [
                        ...(results.warnings || []),
                        ...hints.map(h => h.message),
                    ],
                    hints,
                });
            }
            return reply.send(results);
        }
        catch (error) {
            // Add engineering hints to error response
            const hints = errorHelper_1.ErrorHelper.addEngineeringHints('npsh', {
                npsha: error?.npshAvailable?.value,
                npshr: error?.npshRequired?.value,
            });
            (0, errorHandler_1.handleError)(error, reply, hints);
        }
    });
}
//# sourceMappingURL=npsh.js.map