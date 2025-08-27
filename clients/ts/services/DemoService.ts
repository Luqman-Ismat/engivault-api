/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DemoService {
    /**
     * Demonstrate Error Helper functionality
     * Demonstrate the centralized error helper that adds helpful hints when engineering assumptions are violated.
     *
     * **Examples:**
     * - Mach number > 0.3 → suggests gas flow endpoint
     * - Reynolds < 2300 → warns about laminar flow
     * - NPSHa < NPSHr → warns about cavitation risk
     * - Poor curve fit → suggests more data points
     *
     * **Response includes:**
     * - Calculation results
     * - Warnings array with helpful hints
     * - Suggested endpoints or parameter fixes
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1DemoErrorHelper(
        requestBody: {
            /**
             * Type of calculation to demonstrate
             */
            calculationType: 'pressure_drop' | 'gas_flow' | 'npsh' | 'curve_fit';
            /**
             * Parameters for the calculation
             */
            parameters: Record<string, any>;
        },
    ): CancelablePromise<{
        result?: string;
        warnings?: Array<string>;
        hints?: Array<{
            type?: string;
            message?: string;
            suggestedEndpoint?: string;
            suggestedValue?: number;
            validRange?: {
                min?: number;
                max?: number;
            };
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/demo/error-helper',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Demonstrate Mach number violation hint
     * Shows how the error helper suggests using gas flow endpoint when Mach > 0.3
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1DemoMachViolation(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/demo/mach-violation',
        });
    }
    /**
     * Demonstrate Reynolds number violation hint
     * Shows how the error helper warns about laminar flow when Re < 2300
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1DemoReynoldsViolation(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/demo/reynolds-violation',
        });
    }
    /**
     * Demonstrate NPSH violation hint
     * Shows how the error helper warns about cavitation risk when NPSHa < NPSHr
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1DemoNpshViolation(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/demo/npsh-violation',
        });
    }
    /**
     * Demonstrate curve fitting violation hint
     * Shows how the error helper suggests more data points for poor curve fits
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1DemoCurveFittingViolation(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/demo/curve-fitting-violation',
        });
    }
}
