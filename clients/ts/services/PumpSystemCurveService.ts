/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PumpSystemCurveService {
    /**
     * Calculate pump system curve intersection
     * Find the operating point where pump curve intersects system curve
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1CalculatePumpSystemCurve(
        requestBody?: string,
    ): CancelablePromise<{
        flow: number;
        head: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/calculate/pump-system-curve',
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
