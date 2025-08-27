/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GasService {
    /**
     * Calculate gas pressure drop using isothermal or adiabatic models
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1GasPressureDrop(
        requestBody: {
            gas: {
                density: {
                    value: number;
                    unit: string;
                };
                viscosity: {
                    value: number;
                    unit: string;
                };
                molecularWeight: {
                    value: number;
                    unit: string;
                };
                specificHeatRatio?: number;
                compressibilityFactor?: number;
            };
            pipe: {
                diameter: {
                    value: number;
                    unit: string;
                };
                length: {
                    value: number;
                    unit: string;
                };
                roughness: {
                    value: number;
                    unit: string;
                };
            };
            inletPressure: {
                value: number;
                unit: string;
            };
            outletPressure?: {
                value: number;
                unit: string;
            };
            massFlowRate: {
                value: number;
                unit: string;
            };
            temperature: {
                value: number;
                unit: string;
            };
            model: 'isothermal' | 'adiabatic';
        },
    ): CancelablePromise<{
        inletPressure: {
            value: number;
            unit: string;
        };
        outletPressure: {
            value: number;
            unit: string;
        };
        pressureDrop: {
            value: number;
            unit: string;
        };
        pressureDropPercent: number;
        velocity: {
            value: number;
            unit: string;
        };
        machNumber: number;
        isChoked: boolean;
        frictionFactor: number;
        reynoldsNumber: number;
        warnings: Array<string>;
        metadata: {
            input: Record<string, any>;
            calculations: {
                model: 'isothermal' | 'adiabatic';
                compressibilityFactor: number;
                specificHeatRatio?: number;
                sonicVelocity: number;
                relativeRoughness: number;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/gas/pressure-drop',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
    /**
     * Calculate Fanno line - gas properties along a duct with friction
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1GasFanno(
        requestBody: {
            state0: {
                pressure: number;
                temperature: number;
                density: number;
                velocity: number;
                machNumber: number;
                stagnationPressure: number;
                stagnationTemperature: number;
            };
            length: {
                value: number;
                unit: string;
            };
            diameter: {
                value: number;
                unit: string;
            };
            frictionFactor: number;
            specificHeatRatio: number;
            molecularWeight: {
                value: number;
                unit: string;
            };
        },
    ): CancelablePromise<{
        states: Array<{
            pressure: number;
            temperature: number;
            density: number;
            velocity: number;
            machNumber: number;
            stagnationPressure: number;
            stagnationTemperature: number;
        }>;
        maxLength?: number;
        isChoked: boolean;
        warnings: Array<string>;
        metadata: {
            input: Record<string, any>;
            calculations: {
                type: 'fanno';
                specificHeatRatio: number;
                molecularWeight: number;
                sonicConditions?: Record<string, any>;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/gas/fanno',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
