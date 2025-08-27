/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DynamicsService {
    /**
     * Simulate tank level dynamics over time
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1DynamicsTankLevel(
        requestBody: {
            tank: {
                area: {
                    value: number;
                    unit: string;
                };
                initialLevel?: {
                    value: number;
                    unit: string;
                };
                maxLevel?: {
                    value: number;
                    unit: string;
                };
                minLevel?: {
                    value: number;
                    unit: string;
                };
            };
            inflow: {
                type: 'constant' | 'curve' | 'function';
                value?: {
                    value: number;
                    unit: string;
                };
                curve?: Array<{
                    time: number;
                    flow: {
                        value: number;
                        unit: string;
                    };
                }>;
                function?: string;
            };
            outflow: {
                type: 'orifice' | 'pump' | 'constant';
                orifice?: {
                    coefficient: number;
                    area: {
                        value: number;
                        unit: string;
                    };
                };
                pump?: {
                    curve: Array<{
                        head: number;
                        flow: {
                            value: number;
                            unit: string;
                        };
                    }>;
                    onOffControl?: {
                        highLevel: {
                            value: number;
                            unit: string;
                        };
                        lowLevel: {
                            value: number;
                            unit: string;
                        };
                    };
                };
                constant?: {
                    flow: {
                        value: number;
                        unit: string;
                    };
                };
            };
            simulation: {
                endTime: {
                    value: number;
                    unit: string;
                };
                timeStep: {
                    value: number;
                    unit: string;
                };
            };
        },
    ): CancelablePromise<{
        timeSeries: Array<{
            time: number;
            level: number;
            inflow: number;
            outflow: number;
            pumpOn: boolean;
        }>;
        summary: {
            finalLevel: number;
            maxLevel: number;
            minLevel: number;
            averageInflow: number;
            averageOutflow: number;
            overflow: boolean;
            empty: boolean;
        };
        warnings: Array<string>;
        metadata: {
            input: Record<string, any>;
            calculations: {
                totalSteps: number;
                simulationTime: number;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/dynamics/tank-level',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
