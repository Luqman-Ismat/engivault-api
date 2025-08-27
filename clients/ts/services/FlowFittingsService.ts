/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FlowFittingsService {
    /**
     * Calculate flow fitting pressure drop
     * Calculate pressure drop across flow fittings using K-factor method
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1CalculateFlowFittings(
        requestBody?: string,
    ): CancelablePromise<{
        pressureDrop: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/calculate/flow-fittings',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
