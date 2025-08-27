/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HydraulicsService {
    /**
     * Calculate pressure drop using Darcy-Weisbach equation
     * Calculate pressure drop in circular pipes using the Darcy-Weisbach equation with Churchill friction factor correlation.
     *
     * **Correlations Used:**
     * - **Darcy-Weisbach Equation**: ΔP = f × (L/D) × (ρv²/2)
     * - **Churchill Friction Factor**: f = 8 × [(8/Re)^12 + (2.457×ln((7/Re)^0.9 + 0.27ε/D))^-16]^(1/12)
     * - **Reynolds Number**: Re = ρvD/μ
     *
     * **Validity Ranges:**
     * - Reynolds Number: 4,000 < Re < 10^8 (turbulent flow)
     * - Relative Roughness: 0 < ε/D < 0.05
     * - Pipe Diameter: 0.01 m < D < 2.0 m
     * - Flow Velocity: 0.1 m/s < v < 50 m/s
     *
     * **References:**
     * - Churchill, S.W. (1977). "Friction factor equation spans all fluid-flow regimes." Chemical Engineering, 84(24), 91-92.
     * - White, F.M. (2011). "Fluid Mechanics" (7th ed.). McGraw-Hill.
     *
     * **Version:** 1.0.0
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1CalculatePressureDrop(
        requestBody?: string,
    ): CancelablePromise<{
        /**
         * Pressure drop in Pa
         */
        pressureDrop: number;
        /**
         * Reynolds number (dimensionless)
         */
        reynoldsNumber: number;
        /**
         * Darcy friction factor (dimensionless)
         */
        frictionFactor: number;
        /**
         * Flow velocity in m/s
         */
        flowVelocity: number;
        /**
         * Relative roughness ε/D (dimensionless)
         */
        relativeRoughness: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/calculate/pressure-drop',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
    /**
     * Calculate pressure drop due to minor losses in pipe fittings
     * Calculate minor losses for pipe fittings
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1HydraulicsMinorLosses(
        requestBody: {
            fluid: {
                name: string;
                temperature?: Record<string, any>;
                density?: Record<string, any>;
                viscosity?: Record<string, any>;
            };
            pipe: {
                diameter: Record<string, any>;
                roughness?: Record<string, any>;
            };
            fittings: Array<{
                type: string;
                count: number;
                'k'?: number;
                nominalSize?: string;
                schedule?: string;
            }>;
            velocity?: Record<string, any>;
            flow?: Record<string, any>;
            diameter?: Record<string, any>;
        },
    ): CancelablePromise<{
        deltaP: {
            value: number;
            unit: string;
        };
        Keq: number;
        warnings: Array<string>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/hydraulics/minor-losses',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get list of available K-factors for minor losses calculations
     * Get available K-factors
     * @param nominalSize
     * @param schedule
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1HydraulicsKFactors(
        nominalSize?: string,
        schedule?: string,
    ): CancelablePromise<{
        kFactors?: Record<string, {
            type?: string;
            description?: string;
            'k'?: number;
            notes?: string;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/hydraulics/k-factors',
            query: {
                'nominalSize': nominalSize,
                'schedule': schedule,
            },
        });
    }
    /**
     * Get list of available fitting types for minor losses calculations
     * Get available fitting types
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1HydraulicsFittingTypes(): CancelablePromise<{
        fittingTypes?: Array<string>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/hydraulics/fitting-types',
        });
    }
    /**
     * Calculate pressure profile along pipeline segments
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1HydraulicsPressureProfile(
        requestBody: {
            segments: Array<{
                length: Record<string, any>;
                diameter: Record<string, any>;
                roughness: Record<string, any>;
                elevationDelta: Record<string, any>;
                kLocal?: Array<number>;
                flow?: Record<string, any>;
            }>;
            fluid: Record<string, any>;
        },
    ): CancelablePromise<{
        nodes: Array<{
            cumulativeLength: {
                value: number;
                unit: string;
            };
            elevation: {
                value: number;
                unit: string;
            };
            pressure: {
                value: number;
                unit: string;
            };
        }>;
        warnings: Array<string>;
        totalPressureDrop: {
            value: number;
            unit: string;
        };
        totalLength: {
            value: number;
            unit: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/hydraulics/pressure-profile',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
