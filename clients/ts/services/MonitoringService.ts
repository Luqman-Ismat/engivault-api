/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MonitoringService {
    /**
     * Get Prometheus metrics
     * Returns Prometheus-formatted metrics for monitoring
     * @returns string Prometheus metrics in text format
     * @throws ApiError
     */
    public static getMetrics(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/metrics',
        });
    }
}
