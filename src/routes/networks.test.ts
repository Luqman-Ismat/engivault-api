import { describe, it, expect } from 'vitest';
import { FastifyInstance } from 'fastify';
import { build } from '../index';
import networkRoutes from './networks';

describe('Networks Route', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await build();
    await app.register(networkRoutes);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should solve a simple network', async () => {
    const testNetwork = {
      nodes: [
        {
          id: 'node1',
          elevation: { value: 100, unit: 'm' },
          demand: { value: -0.02, unit: 'm³/s' } // Supply
        },
        {
          id: 'node2',
          elevation: { value: 95, unit: 'm' },
          demand: { value: 0.01, unit: 'm³/s' } // Demand
        },
        {
          id: 'node3',
          elevation: { value: 90, unit: 'm' },
          demand: { value: 0.01, unit: 'm³/s' } // Demand
        }
      ],
      pipes: [
        {
          id: 'pipe1',
          from: 'node1',
          to: 'node2',
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' }
        },
        {
          id: 'pipe2',
          from: 'node2',
          to: 'node3',
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' }
        },
        {
          id: 'pipe3',
          from: 'node3',
          to: 'node1',
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' }
        }
      ],
      loops: [
        {
          id: 'loop1',
          pipes: ['pipe1', 'pipe2', 'pipe3']
        }
      ],
      fluidProperties: {
        density: { value: 998, unit: 'kg/m³' },
        viscosity: { value: 0.001, unit: 'Pa·s' }
      }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/networks/solve',
      payload: testNetwork
    });

    expect(response.statusCode).toBe(200);
    const result = JSON.parse(response.payload);
    
    expect(result.nodes).toHaveLength(3);
    expect(result.pipes).toHaveLength(3);
    expect(result.loops).toHaveLength(1);
    expect(result.convergence).toBeDefined();
    expect(result.metadata).toBeDefined();
    
    // Check that all nodes have calculated heads
    result.nodes.forEach((node: any) => {
      expect(node.head).toBeDefined();
      expect(typeof node.head).toBe('number');
    });
    
    // Check that all pipes have calculated flows and headlosses
    result.pipes.forEach((pipe: any) => {
      expect(pipe.flow).toBeDefined();
      expect(typeof pipe.flow).toBe('number');
      expect(pipe.headloss).toBeDefined();
      expect(typeof pipe.headloss).toBe('number');
    });
  });

  it('should return 400 for unbalanced network', async () => {
    const unbalancedNetwork = {
      nodes: [
        {
          id: 'node1',
          elevation: { value: 100, unit: 'm' },
          demand: { value: -0.01, unit: 'm³/s' } // Supply
        },
        {
          id: 'node2',
          elevation: { value: 95, unit: 'm' },
          demand: { value: 0.02, unit: 'm³/s' } // Demand > Supply
        }
      ],
      pipes: [
        {
          id: 'pipe1',
          from: 'node1',
          to: 'node2',
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' }
        }
      ],
      loops: [],
      fluidProperties: {
        density: { value: 998, unit: 'kg/m³' },
        viscosity: { value: 0.001, unit: 'Pa·s' }
      }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/networks/solve',
      payload: unbalancedNetwork
    });

    expect(response.statusCode).toBe(500); // Should return error for unbalanced network
  });

  it('should return 400 for invalid network structure', async () => {
    const invalidNetwork = {
      nodes: [
        {
          id: 'node1',
          elevation: { value: 100, unit: 'm' }
        }
      ],
      pipes: [
        {
          id: 'pipe1',
          from: 'node1',
          to: 'nonexistent', // Invalid node reference
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' }
        }
      ],
      loops: [],
      fluidProperties: {
        density: { value: 998, unit: 'kg/m³' },
        viscosity: { value: 0.001, unit: 'Pa·s' }
      }
    };

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/networks/solve',
      payload: invalidNetwork
    });

    expect(response.statusCode).toBe(400);
  });
});
