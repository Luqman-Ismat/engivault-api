/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TransientsService {
    /**
     * Calculate pressure surge using Joukowsky equation
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1TransientsJoukowsky(
        requestBody: {
            fluid: {
                density: {
                    value: number;
                    unit: string;
                };
                bulkModulus?: {
                    value: number;
                    unit: string;
                };
            };
            pipe: {
                elasticModulus?: {
                    value: number;
                    unit: string;
                };
                wallThickness?: {
                    value: number;
                    unit: string;
                };
                diameter?: {
                    value: number;
                    unit: string;
                };
                waveSpeed?: {
                    value: number;
                    unit: string;
                };
            };
            velocityChange: {
                value: number;
                unit: string;
            };
            pipeRating?: {
                value: number;
                unit: string;
            };
        },
    ): CancelablePromise<{
        pressureSurge: {
            value: number;
            unit: string;
        };
        waveSpeed: {
            value: number;
            unit: string;
        };
        comparison?: {
            pipeRating: {
                value: number;
                unit: string;
            };
            safetyFactor: number;
            isWithinRating: boolean;
        };
        warnings: Array<string>;
        metadata: {
            input: Record<string, any>;
            calculations: {
                fluidDensity: number;
                velocityChange: number;
                waveSpeed: number;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/transients/joukowsky',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
