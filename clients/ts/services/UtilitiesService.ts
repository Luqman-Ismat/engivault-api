/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UtilitiesService {
    /**
     * Fit pump curve using polynomial regression
     * Fit pump performance curves using polynomial regression with statistical analysis.
     *
     * **Method Used:**
     * - **Polynomial Regression**: h = a₀ + a₁q + a₂q² + a₃q³
     * - **Normal Equations**: (X^T X)β = X^T y solved using Gaussian elimination
     * - **R-squared**: R² = 1 - (SS_res / SS_tot)
     * - **Standard Error**: SE = √(SS_res / (n-p-1))
     * - **Residuals**: ε_i = h_i - ĥ_i
     *
     * **Models Available:**
     * - **Quadratic**: h = a₀ + a₁q + a₂q² (minimum 3 points)
     * - **Cubic**: h = a₀ + a₁q + a₂q² + a₃q³ (minimum 4 points)
     *
     * **Validity Ranges:**
     * - Flow Rate: 0.001 m³/s < q < 100 m³/s
     * - Head: 0.1 m < h < 1000 m
     * - Data Points: 3-50 points for stable fitting
     * - R-squared: 0.8 < R² < 1.0 (good fit)
     *
     * **Quality Metrics:**
     * - **R-squared**: Coefficient of determination (0-1)
     * - **Standard Error**: Average prediction error
     * - **Residuals**: Individual prediction errors
     * - **Adjusted R-squared**: Penalized for model complexity
     *
     * **References:**
     * - Montgomery, D.C. (2012). "Introduction to Linear Regression Analysis" (5th ed.). Wiley
     * - Draper, N.R. & Smith, H. (1998). "Applied Regression Analysis" (3rd ed.). Wiley
     *
     * **Version:** 1.0.0
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1CurvesFit(
        requestBody: {
            points: Array<{
                /**
                 * Flow rate in m³/s
                 */
                'q': number;
                /**
                 * Head in m
                 */
                'h': number;
            }>;
            /**
             * Polynomial model type
             */
            model: 'quadratic' | 'cubic';
        },
    ): CancelablePromise<{
        /**
         * Polynomial coefficients [a₀, a₁, a₂, a₃]
         */
        coefficients: Array<number>;
        /**
         * Coefficient of determination (0-1)
         */
        rSquared: number;
        /**
         * Prediction residuals
         */
        residuals: Array<number>;
        model: 'quadratic' | 'cubic';
        /**
         * Human-readable equation
         */
        equation: string;
        /**
         * Fitted values
         */
        predictedValues: Array<number>;
        /**
         * Standard error of regression
         */
        standardError: number;
        /**
         * Maximum absolute residual
         */
        maxResidual: number;
        /**
         * Mean absolute residual
         */
        meanResidual: number;
        metadata: {
            input: {
                points: Array<{
                    'q': number;
                    'h': number;
                }>;
                model: 'quadratic' | 'cubic';
            };
            statistics: {
                nPoints: number;
                degreesOfFreedom: number;
                adjustedRSquared: number;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/curves/fit',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
