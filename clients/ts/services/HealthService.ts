/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class HealthService {
    /**
     * Health check endpoint
     * Returns the health status of the API
     * @returns any Default Response
     * @throws ApiError
     */
    public static getHealth(): CancelablePromise<{
        status: string;
        timestamp: string;
        uptime: number;
        version: string;
        memory: {
            rss?: number;
            heapTotal?: number;
            heapUsed?: number;
            external?: number;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/health',
        });
    }
    /**
     * Root endpoint
     * Returns basic API information
     * @returns any Default Response
     * @throws ApiError
     */
    public static get(): CancelablePromise<{
        status: string;
        message: string;
        documentation: string;
        health: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/',
        });
    }
}
