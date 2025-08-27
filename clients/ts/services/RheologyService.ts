/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RheologyService {
    /**
     * Calculate slurry pressure drop using Durand correlation
     * Calculate pressure drop for slurry flow using Durand correlation with particle settling considerations.
     *
     * **Correlations Used:**
     * - **Durand Correlation**: ΔP_slurry = ΔP_fluid × (1 + K × C_v × Fr^(-1.5))
     * - K: Durand factor (typically 150-180)
     * - C_v: Volume concentration
     * - Fr: Froude number = V/√(gD)
     * - **Settling Velocity**: V_s = √[(4gD_p(ρ_p - ρ_f))/(3ρ_fC_d)]
     * - **Froude Number**: Fr = V/√(gD)
     * - **Concentration Effect**: C_effect = 1 + K × C_v × Fr^(-1.5)
     *
     * **Validity Ranges:**
     * - Particle Diameter: 0.01 mm < D_p < 10 mm
     * - Volume Concentration: 0.01 < C_v < 0.3 (1-30%)
     * - Froude Number: 1 < Fr < 10
     * - Reynolds Number: 4,000 < Re < 10^6
     * - Particle Density: 1,000 kg/m³ < ρ_p < 8,000 kg/m³
     *
     * **Flow Regimes:**
     * - **Homogeneous**: C_v < 0.01 (1%), particles well suspended
     * - **Heterogeneous**: 0.01 < C_v < 0.15, particles partially suspended
     * - **Dense Slurry**: C_v > 0.15, significant particle settling
     *
     * **References:**
     * - Durand, R. (1953). "Basic relationships of the transportation of solids in pipes." Proc. Minnesota Int. Hydraulics Conv.
     * - Wilson, K.C. et al. (2006). "Slurry Transport Using Centrifugal Pumps" (3rd ed.). Springer
     *
     * **Version:** 1.0.0
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1SlurriesPressureDrop(
        requestBody: {
            slurry: {
                carrierFluid: {
                    density: {
                        value: number;
                        unit: string;
                    };
                    viscosity: {
                        value: number;
                        unit: string;
                    };
                };
                particles: {
                    density: {
                        value: number;
                        unit: string;
                    };
                    diameter: {
                        value: number;
                        unit: string;
                    };
                    shape?: 'spherical' | 'angular' | 'flat';
                };
                concentration: {
                    value: number;
                    unit: string;
                };
                concentrationType: 'volume' | 'weight';
            };
            pipe: {
                diameter: {
                    value: number;
                    unit: string;
                };
                length: {
                    value: number;
                    unit: string;
                };
                roughness: {
                    value: number;
                    unit: string;
                };
            };
            velocity: {
                value: number;
                unit: string;
            };
        },
    ): CancelablePromise<{
        headloss: {
            value: number;
            unit: string;
        };
        pressureDrop: {
            value: number;
            unit: string;
        };
        frictionFactor: number;
        relativeRoughness: number;
        durandFactor: number;
        froudeNumber: number;
        concentrationEffect: number;
        warnings: Array<string>;
        metadata: {
            input: Record<string, any>;
            calculations: {
                reynoldsNumber: number;
                carrierFrictionFactor: number;
                settlingVelocity: number;
                concentration: number;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/slurries/pressure-drop',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
