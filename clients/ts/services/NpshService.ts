/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NpshService {
    /**
     * Calculate NPSH Required
     * Calculate Net Positive Suction Head Required (NPSHr) from curve data
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1CalculateNpshRequired(
        requestBody?: string,
    ): CancelablePromise<{
        npshr: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/calculate/npsh-required',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                422: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
