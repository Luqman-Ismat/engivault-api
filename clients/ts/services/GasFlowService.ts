/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GasFlowService {
    /**
     * Calculate Rayleigh line - gas properties along a duct with heat transfer
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1GasRayleigh(
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
            heatTransferRate: {
                value: number;
                unit: string;
            };
            diameter: {
                value: number;
                unit: string;
            };
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
        maxHeatTransfer?: number;
        isChoked: boolean;
        warnings: Array<string>;
        metadata: {
            input: Record<string, any>;
            calculations: {
                type: 'rayleigh';
                specificHeatRatio: number;
                molecularWeight: number;
                sonicConditions?: Record<string, any>;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/gas/rayleigh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
