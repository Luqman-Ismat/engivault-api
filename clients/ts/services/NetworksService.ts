/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class NetworksService {
    /**
     * Solve pipe network using Hardy Cross iterative method
     * Solve complex pipe networks using the Hardy Cross iterative method for flow distribution analysis.
     *
     * **Algorithm Used:**
     * - **Hardy Cross Method**: Iterative loop-based approach for flow distribution
     * - **Loop Corrections**: ΔQ = -Σh_f / (2 × Σh_f/Q)
     * - **Friction Loss**: h_f = f × (L/D) × (V²/2g) using Churchill correlation
     * - **Convergence**: Iterative corrections until |ΔQ| < tolerance
     *
     * **Validity Ranges:**
     * - Network Size: 2-100 nodes, 1-50 loops
     * - Flow Rates: 0.001 m³/s < Q < 100 m³/s
     * - Pipe Diameters: 0.01 m < D < 2.0 m
     * - Reynolds Numbers: 4,000 < Re < 10^8 (turbulent flow)
     * - Convergence Tolerance: 1e-6 < tolerance < 1e-3
     * - Maximum Iterations: 10 < maxIter < 1000
     *
     * **Network Requirements:**
     * - Must have at least one supply node (no demand)
     * - Must have at least one demand node
     * - All pipes must be connected in loops
     * - Network must be properly defined with valid topology
     *
     * **Convergence Criteria:**
     * - Flow corrections < tolerance for all loops
     * - Mass balance satisfied at all nodes
     * - Energy balance satisfied around all loops
     *
     * **References:**
     * - Hardy Cross (1936). "Analysis of flow in networks of conduits or conductors." University of Illinois Bulletin
     * - Jeppson, R.W. (1976). "Analysis of Flow in Pipe Networks." Ann Arbor Science
     *
     * **Version:** 1.0.0
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static postApiV1NetworksSolve(
        requestBody: {
            nodes: Array<{
                id: string;
                elevation: {
                    value: number;
                    unit: string;
                };
                demand?: {
                    value: number;
                    unit: string;
                };
            }>;
            pipes: Array<{
                id: string;
                from: string;
                to: string;
                length: {
                    value: number;
                    unit: string;
                };
                diameter: {
                    value: number;
                    unit: string;
                };
                roughness: {
                    value: number;
                    unit: string;
                };
            }>;
            loops: Array<{
                id: string;
                pipes: Array<string>;
            }>;
            fluidProperties: {
                density: {
                    value: number;
                    unit: string;
                };
                viscosity: {
                    value: number;
                    unit: string;
                };
            };
            tolerance?: number;
            maxIterations?: number;
            initialFlowGuess?: number;
        },
    ): CancelablePromise<{
        nodes: Array<{
            id: string;
            elevation: {
                value: number;
                unit: string;
            };
            demand?: {
                value: number;
                unit: string;
            };
            head: number;
        }>;
        pipes: Array<{
            id: string;
            from: string;
            to: string;
            length: {
                value: number;
                unit: string;
            };
            diameter: {
                value: number;
                unit: string;
            };
            roughness: {
                value: number;
                unit: string;
            };
            flow: number;
            headloss: number;
        }>;
        loops: Array<{
            id: string;
            pipes: Array<string>;
        }>;
        convergence: {
            converged: boolean;
            iterations: number;
            finalTolerance: number;
            maxTolerance: number;
        };
        metadata: {
            input: Record<string, any>;
            calculations: {
                totalDemand: number;
                totalSupply: number;
                networkBalance: number;
            };
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/networks/solve',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Default Response`,
                500: `Default Response`,
            },
        });
    }
}
