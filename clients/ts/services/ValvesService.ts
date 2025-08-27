/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ValvesService {
    /**
     * Size control valve for liquid flow using IEC 60534 standard
     * Size control valves for liquid flow using IEC 60534-2-1 standard with pressure recovery considerations.
     *
     * **Correlations Used:**
     * - **Flow Coefficient (Cv)**: Cv = Q × √(SG/ΔP)
     * - **Metric Flow Coefficient (Kv)**: Kv = Cv × 1.156
     * - **Valve Authority**: β = ΔP_valve / (ΔP_valve + ΔP_system)
     * - **Choked Flow**: ΔP_choked = FL² × (P1 - FF × Pv)
     * - FL: Liquid pressure recovery factor
     * - FF: Liquid critical pressure ratio factor
     * - Pv: Vapor pressure
     *
     * **Validity Ranges:**
     * - Flow Rate: 0.001 m³/h < Q < 1000 m³/h
     * - Pressure Drop: 0.1 bar < ΔP < 50 bar
     * - Specific Gravity: 0.5 < SG < 2.0
     * - Temperature: -40°C < T < 200°C
     * - Valve Authority: 0.1 < β < 0.9 (recommended)
     *
     * **Trim Characteristics:**
     * - **Linear**: Equal percentage change in flow per unit change in valve position
     * - **Equal Percentage**: Equal percentage change in flow per equal percentage change in valve position
     * - **Quick Opening**: Large flow change for small valve movement at low openings
     * - **Modified Parabolic**: Intermediate between linear and equal percentage
     *
     * **References:**
     * - IEC 60534-2-1: "Industrial-process control valves - Part 2-1: Flow capacity - Sizing equations for fluid flow under installed conditions"
     * - ISA-75.01.01: "Flow Equations for Sizing Control Valves"
     *
     * **Version:** 1.0.0
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1ValvesSize(
        requestBody: {
            flow: {
                value: number;
                unit: string;
            };
            pressureDrop: {
                value: number;
                unit: string;
            };
            specificGravity: number;
            trimCharacteristic: {
                type: 'linear' | 'equal-percentage' | 'quick-opening' | 'modified-parabolic';
                description?: string;
            };
            pressureRecoveryFactor?: number;
            upstreamPressure?: {
                value: number;
                unit: string;
            };
            downstreamPressure?: {
                value: number;
                unit: string;
            };
            temperature?: {
                value: number;
                unit: string;
            };
            fluidName?: string;
        },
    ): CancelablePromise<{
        cv: {
            value: number;
            unit: string;
        };
        kv: {
            value: number;
            unit: string;
        };
        valveAuthority: number;
        chokedFlow: {
            isChoked: boolean;
            likelihood: 'none' | 'low' | 'medium' | 'high';
            criticalPressureDrop: {
                value: number;
                unit: string;
            };
            actualPressureDrop: {
                value: number;
                unit: string;
            };
        };
        warnings: Array<string>;
        metadata: {
            input: {
                flow: {
                    value: number;
                    unit: string;
                };
                pressureDrop: {
                    value: number;
                    unit: string;
                };
                specificGravity: number;
                trimCharacteristic: {
                    type: string;
                    description?: string;
                };
            };
            calculations: {
                flowRate: {
                    value: number;
                    unit: string;
                };
                pressureDrop: {
                    value: number;
                    unit: string;
                };
                specificGravity: number;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/valves/size',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
    /**
     * Get valve trim characteristics for sizing
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1ValvesTrimCharacteristics(): CancelablePromise<{
        characteristics: Array<{
            type: string;
            name: string;
            description: string;
            typicalFL: number;
            applications: Array<string>;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/valves/trim-characteristics',
        });
    }
    /**
     * Get example valve sizing scenarios
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1ValvesSizingExamples(): CancelablePromise<{
        examples: Array<{
            name: string;
            description: string;
            scenario: {
                flow: {
                    value: number;
                    unit: string;
                };
                pressureDrop: {
                    value: number;
                    unit: string;
                };
                specificGravity: number;
                trimCharacteristic: {
                    type: string;
                    description?: string;
                };
                upstreamPressure?: {
                    value: number;
                    unit: string;
                };
                downstreamPressure?: {
                    value: number;
                    unit: string;
                };
                temperature?: {
                    value: number;
                    unit: string;
                };
                fluidName?: string;
            };
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/valves/sizing-examples',
        });
    }
}
