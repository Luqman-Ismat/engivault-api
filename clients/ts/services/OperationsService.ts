/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OperationsService {
    /**
     * Calculate tank fill/drain time using numerical integration
     * Calculate fill or drain time for tanks using numerical integration with variable flow rates.
     *
     * **Method Used:**
     * - **Numerical Integration**: Fourth-order Runge-Kutta method for time stepping
     * - **Volume Calculation**: V = f(h) based on tank geometry (cylindrical, rectangular, custom)
     * - **Flow Rate**: Q = Q(t) or constant Q
     * - **Time Integration**: Δt = min(timeStep, convergence_criteria)
     *
     * **Tank Geometries:**
     * - **Cylindrical**: V = πD²h/4, A = πD²/4
     * - **Rectangular**: V = L×W×h, A = L×W
     * - **Custom**: User-defined volume-height relationship
     *
     * **Validity Ranges:**
     * - Tank Volume: 0.1 m³ < V < 100,000 m³
     * - Flow Rate: 0.001 m³/s < Q < 100 m³/s
     * - Time Step: 0.1 s < Δt < 3600 s
     * - Level Change: 0.01 m < Δh < 100 m
     * - Integration Time: 1 s < t < 24 hours
     *
     * **Convergence Criteria:**
     * - Volume balance satisfied within 0.1%
     * - Time step stability maintained
     * - Maximum iterations not exceeded
     *
     * **References:**
     * - Press, W.H. et al. (2007). "Numerical Recipes" (3rd ed.). Cambridge University Press
     * - Chapra, S.C. (2018). "Applied Numerical Methods with MATLAB" (4th ed.). McGraw-Hill
     *
     * **Version:** 1.0.0
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1OperationsFillDrainTime(
        requestBody: {
            tank: {
                volume: {
                    value: number;
                    unit: string;
                };
                height?: {
                    value: number;
                    unit: string;
                };
                diameter?: {
                    value: number;
                    unit: string;
                };
                shape: 'cylindrical' | 'rectangular' | 'custom';
            };
            flowRate: {
                type: 'constant' | 'variable';
                value?: {
                    value: number;
                    unit: string;
                };
                function?: string;
            };
            operation: 'fill' | 'drain';
            initialLevel?: {
                value: number;
                unit: string;
            };
            targetLevel?: {
                value: number;
                unit: string;
            };
            timeStep?: {
                value: number;
                unit: string;
            };
        },
    ): CancelablePromise<{
        totalTime: {
            value: number;
            unit: string;
        };
        averageFlowRate: {
            value: number;
            unit: string;
        };
        volumeChange: {
            value: number;
            unit: string;
        };
        timeHistory: Array<{
            time?: number;
            level?: number;
            volume?: number;
            flowRate?: number;
        }>;
        warnings: Array<{
            type?: string;
            message?: string;
            severity?: 'low' | 'medium' | 'high';
        }>;
        metadata: {
            input?: Record<string, any>;
            calculations?: {
                method?: string;
                timeSteps?: number;
                convergence?: boolean;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/operations/fill-drain-time',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
