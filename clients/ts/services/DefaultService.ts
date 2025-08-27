/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1HydraulicsSizePipe(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/hydraulics/size-pipe',
        });
    }
    /**
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1PumpsBepCheck(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/pumps/bep-check',
        });
    }
    /**
     * @param id
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1Runs(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/runs/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns any Default Response
     * @throws ApiError
     */
    public static deleteApiV1Runs(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/runs/{id}',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1Runs1(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/runs',
        });
    }
    /**
     * @returns any Default Response
     * @throws ApiError
     */
    public static deleteApiV1Runs1(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/runs',
        });
    }
}
