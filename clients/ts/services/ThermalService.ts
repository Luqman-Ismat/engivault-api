/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ThermalService {
    /**
     * Calculate viscosity-adjusted pressure drop with temperature-dependent properties
     * Calculate pressure drop accounting for temperature-dependent viscosity changes using iterative convergence.
     *
     * **Correlations Used:**
     * - **Viscosity-Temperature**: μ(T) = μ₀ × exp[β(1/T - 1/T₀)] (Andrade equation)
     * - **Darcy-Weisbach**: ΔP = f × (L/D) × (ρv²/2)
     * - **Churchill Friction Factor**: f = 8 × [(8/Re)^12 + (2.457×ln((7/Re)^0.9 + 0.27ε/D))^-16]^(1/12)
     * - **Reynolds Number**: Re = ρvD/μ(T)
     * - **Convergence**: Iterative solution until |ΔP_i - ΔP_{i-1}| < tolerance
     *
     * **Validity Ranges:**
     * - Temperature: 273 K < T < 373 K (0-100°C)
     * - Viscosity: 0.0001 Pa·s < μ < 1 Pa·s
     * - Reynolds Number: 4,000 < Re < 10^8 (turbulent flow)
     * - Temperature Change: |ΔT| < 50 K
     * - Convergence: 1e-12 < tolerance < 1e-3
     *
     * **Convergence Criteria:**
     * - Pressure drop change < tolerance between iterations
     * - Maximum iterations not exceeded
     * - Stable viscosity-temperature relationship
     *
     * **References:**
     * - Andrade, E.N. da C. (1930). "The viscosity of liquids." Nature, 125, 309-310
     * - Reid, R.C. et al. (1987). "The Properties of Gases and Liquids" (4th ed.). McGraw-Hill
     *
     * **Version:** 1.0.0
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1ThermalViscosityAdjustedDrop(
        requestBody: {
            flowRate: {
                value: number;
                unit: string;
            };
            length: {
                value: number;
                unit: string;
            };
            diameter: {
                value: number;
                unit: string;
            };
            roughness: {
                value: number;
                unit: string;
            };
            fluid: {
                density: {
                    value: number;
                    unit: string;
                };
                viscosity: {
                    value: number;
                    unit: string;
                };
                referenceTemperature: {
                    value: number;
                    unit: string;
                };
                viscosityTemperatureCoefficient?: number;
            };
            inletTemperature: {
                value: number;
                unit: string;
            };
            outletTemperature?: {
                value: number;
                unit: string;
            };
            maxIterations?: number;
            convergenceTolerance?: number;
        },
    ): CancelablePromise<{
        inletTemperature: {
            value: number;
            unit: string;
        };
        outletTemperature: {
            value: number;
            unit: string;
        };
        averageTemperature: {
            value: number;
            unit: string;
        };
        pressureDrop: {
            value: number;
            unit: string;
        };
        pressureDropPercent: number;
        inletViscosity: {
            value: number;
            unit: string;
        };
        outletViscosity: {
            value: number;
            unit: string;
        };
        averageViscosity: {
            value: number;
            unit: string;
        };
        reynoldsNumber: number;
        frictionFactor: number;
        velocity: {
            value: number;
            unit: string;
        };
        iterations: number;
        converged: boolean;
        warnings: Array<string>;
        metadata: {
            input: Record<string, any>;
            calculations: {
                convergenceHistory: Array<{
                    iteration: number;
                    pressureDrop: number;
                    averageTemperature: number;
                    averageViscosity: number;
                    reynoldsNumber: number;
                    frictionFactor: number;
                }>;
                finalTolerance: number;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/thermal/viscosity-adjusted-drop',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
    /**
     * Calculate heat exchanger pressure drop using standard correlations
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1ThermalHxDrop(
        requestBody: {
            geometry: {
                tubeDiameter: {
                    value: number;
                    unit: string;
                };
                tubeLength: {
                    value: number;
                    unit: string;
                };
                numberOfTubes: number;
                tubePitch: {
                    value: number;
                    unit: string;
                };
                tubeThickness: {
                    value: number;
                    unit: string;
                };
                shellDiameter: {
                    value: number;
                    unit: string;
                };
                baffleSpacing: {
                    value: number;
                    unit: string;
                };
                baffleCut: number;
                tubeLayout: 'triangular' | 'square' | 'rotated-square';
            };
            passes: number;
            massFlux: {
                value: number;
                unit: string;
            };
            fluidSide: 'tube' | 'shell';
            fluidProperties: {
                density: {
                    value: number;
                    unit: string;
                };
                viscosity: {
                    value: number;
                    unit: string;
                };
            };
            roughness?: {
                value: number;
                unit: string;
            };
        },
    ): CancelablePromise<{
        pressureDrop: {
            value: number;
            unit: string;
        };
        pressureDropPercent: number;
        velocity: {
            value: number;
            unit: string;
        };
        reynoldsNumber: number;
        frictionFactor: number;
        flowArea: {
            value: number;
            unit: string;
        };
        equivalentDiameter: {
            value: number;
            unit: string;
        };
        flowLength: {
            value: number;
            unit: string;
        };
        numberOfCrossings: number;
        baffleSpacing: {
            value: number;
            unit: string;
        };
        warnings: Array<string>;
        metadata: {
            input: Record<string, any>;
            calculations: {
                correlation: string;
                flowRegime: 'laminar' | 'turbulent' | 'transition';
                parameters: {
                    relativeRoughness?: number;
                    returnBendEquivalentLength?: number;
                    totalLength?: number;
                    singleTubeLength?: number;
                    numberOfPasses?: number;
                    bundleDiameter?: number;
                    tubeOuterDiameter?: number;
                    clearance?: number;
                    crossFlowArea?: number;
                    windowPressureDrop?: number;
                    entranceExitPressureDrop?: number;
                    crossFlowPressureDrop?: number;
                };
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/thermal/hx-drop',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
