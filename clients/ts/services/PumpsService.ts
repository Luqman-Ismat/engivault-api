/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PumpsService {
    /**
     * Calculate Net Positive Suction Head Available (NPSHa)
     * Calculate the Net Positive Suction Head Available (NPSHa) for pump suction conditions.
     *
     * **Equation Used:**
     * - **NPSHa = P_atm/ρg + P_gage/ρg + Z - h_f - P_v/ρg**
     * - P_atm: Atmospheric pressure (Pa)
     * - P_gage: Gage pressure at suction (Pa)
     * - Z: Elevation head (m)
     * - h_f: Friction head loss (m)
     * - P_v: Vapor pressure (Pa)
     *
     * **Validity Ranges:**
     * - Temperature: 0°C < T < 100°C (for water)
     * - Pressure: 0.8 bar < P < 2.0 bar (atmospheric)
     * - Elevation: -100 m < Z < 1000 m
     * - Flow Rate: 0.001 m³/s < Q < 10 m³/s
     *
     * **Safety Margins:**
     * - Recommended NPSHa > 1.5 × NPSHr (pump required)
     * - Minimum NPSHa > 0.5 m for most applications
     *
     * **References:**
     * - ANSI/HI 9.6.1-2017: "Rotodynamic Pumps - Guideline for NPSH Margin"
     * - Karassik, I.J. et al. (2008). "Pump Handbook" (4th ed.). McGraw-Hill.
     *
     * **Version:** 1.0.0
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1CalculateNpsh(
        requestBody?: string,
    ): CancelablePromise<{
        npsha: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/calculate/npsh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
    /**
     * Calculate pump operating point for given arrangement and system
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1PumpsOperate(
        requestBody: {
            pumps: Array<{
                id: string;
                curve: Array<{
                    'q': number;
                    'h': number;
                }>;
                speed?: number;
            }>;
            arrangement: 'single' | 'parallel' | 'series';
            system: {
                staticHead: number;
                'k': number;
                polynomial?: Array<number>;
            };
            speed?: number;
        },
    ): CancelablePromise<{
        flow: {
            value: number;
            unit: string;
        };
        head: {
            value: number;
            unit: string;
        };
        pumpHead: {
            value: number;
            unit: string;
        };
        systemHead: {
            value: number;
            unit: string;
        };
        meta: {
            iterations: number;
            residual: number;
            convergence: boolean;
            method: string;
        };
        warnings: Array<string>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/pumps/operate',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
    /**
     * Get supported pump arrangements
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1PumpsArrangements(): CancelablePromise<{
        arrangements: Array<{
            type: string;
            description: string;
            characteristics: string;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/pumps/arrangements',
        });
    }
    /**
     * Calculate cavitation risk analysis for pump system
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1PumpsCavitationRisk(
        requestBody: {
            atmosphericPressure?: {
                value: number;
                unit: string;
            };
            vaporPressure?: {
                value: number;
                unit: string;
            };
            staticHead: {
                value: number;
                unit: string;
            };
            losses: {
                value: number;
                unit: string;
            };
            flowRate: {
                value: number;
                unit: string;
            };
            npshCurve: {
                points: Array<{
                    'q': number;
                    npshr: number;
                }>;
                name?: string;
            };
            altitude?: number;
            temperature?: {
                value: number;
                unit: string;
            };
            fluidName?: string;
        },
    ): CancelablePromise<{
        npshAvailable: {
            value: number;
            unit: string;
        };
        npshRequired: {
            value: number;
            unit: string;
        };
        cavitationMargin: {
            value: number;
            unit: string;
        };
        warnings: Array<string>;
        metadata: {
            atmosphericPressure: {
                value: number;
                unit: string;
            };
            vaporPressure: {
                value: number;
                unit: string;
            };
            staticHead: {
                value: number;
                unit: string;
            };
            losses: {
                value: number;
                unit: string;
            };
            flowRate: {
                value: number;
                unit: string;
            };
            altitude?: number;
            temperature: {
                value: number;
                unit: string;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/pumps/cavitation-risk',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
    /**
     * Get supported fluids for NPSH calculations
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1PumpsFluids(): CancelablePromise<{
        fluids: Array<{
            name: string;
            description: string;
            vaporPressureMethod: string;
            temperatureRange: string;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/pumps/fluids',
        });
    }
    /**
     * Calculate annual energy consumption and cost for pump system
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1PumpsEnergy(
        requestBody: {
            fluid: {
                density: {
                    value: number;
                    unit: string;
                };
                name?: string;
            };
            pumpEfficiency: number;
            motorEfficiency: number;
            vfdEfficiency?: number;
            loadProfile: Array<{
                hours: number;
                Qset: {
                    value: number;
                    unit: string;
                };
                speed?: number;
            }>;
            tariff: {
                rate: number;
                name?: string;
                description?: string;
            };
            head: {
                value: number;
                unit: string;
            };
        },
    ): CancelablePromise<{
        totalEnergy: {
            value: number;
            unit: string;
        };
        totalCost: {
            value: number;
            unit: string;
        };
        averagePower: {
            value: number;
            unit: string;
        };
        loadProfile: Array<{
            hours: number;
            Qset: {
                value: number;
                unit: string;
            };
            speed?: number;
            power: {
                value: number;
                unit: string;
            };
            energy: {
                value: number;
                unit: string;
            };
            cost: {
                value: number;
                unit: string;
            };
        }>;
        efficiency: {
            averagePumpEfficiency: number;
            averageMotorEfficiency: number;
            averageVfdEfficiency?: number;
            averageTotalEfficiency: number;
        };
        warnings: Array<string>;
        metadata: {
            tariff: {
                rate: number;
                name?: string;
                description?: string;
            };
            totalHours: number;
            operatingPoints: number;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/pumps/energy',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
    /**
     * Get example load profiles for energy calculations
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1PumpsLoadProfiles(): CancelablePromise<{
        profiles: Array<{
            name: string;
            description: string;
            points: Array<{
                hours: number;
                Qset: {
                    value: number;
                    unit: string;
                };
                speed?: number;
            }>;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/pumps/load-profiles',
        });
    }
    /**
     * Get example energy tariffs for cost calculations
     * @returns any Default Response
     * @throws ApiError
     */
    public static getApiV1PumpsEnergyTariffs(): CancelablePromise<{
        tariffs: Array<{
            name: string;
            rate: number;
            description: string;
            region?: string;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/pumps/energy-tariffs',
        });
    }
}
