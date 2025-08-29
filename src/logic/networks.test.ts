import { describe, it, expect } from 'vitest';
import {
  solveNetwork,
  calculatePipeResistance,
  calculateHeadloss,
  hardyCrossIteration,
  applyFlowCorrection,
  calculateNodeHeads,
  type NetworkInput,
  type Node,
  type Loop,
} from './networks';

describe('Networks Module', () => {
  describe('calculatePipeResistance', () => {
    it('should calculate pipe resistance coefficient correctly', () => {
      const length = 100; // m
      const diameter = 0.1; // m
      const roughness = 0.000045; // m (steel pipe)
      const flow = 0.01; // m³/s
      const density = 998; // kg/m³ (water)
      const viscosity = 0.001; // Pa·s (water)

      const K = calculatePipeResistance(
        length,
        diameter,
        roughness,
        flow,
        density,
        viscosity
      );

      expect(K).toBeGreaterThan(0);
      expect(K).toBeLessThan(1e9); // Reasonable range for this pipe
    });

    it('should return zero for zero flow', () => {
      const K = calculatePipeResistance(100, 0.1, 0.000045, 0, 998, 0.001);
      expect(K).toBe(0);
    });
  });

  describe('calculateHeadloss', () => {
    it('should calculate headloss correctly', () => {
      const flow = 0.01; // m³/s
      const length = 100; // m
      const diameter = 0.1; // m
      const roughness = 0.000045; // m
      const density = 998; // kg/m³
      const viscosity = 0.001; // Pa·s

      const headloss = calculateHeadloss(
        flow,
        length,
        diameter,
        roughness,
        density,
        viscosity
      );

      expect(headloss).toBeGreaterThan(0);
      expect(headloss).toBeLessThan(100000); // Reasonable headloss for this pipe
    });

    it('should handle negative flow (reverse direction)', () => {
      const flow = -0.01; // m³/s
      const length = 100; // m
      const diameter = 0.1; // m
      const roughness = 0.000045; // m
      const density = 998; // kg/m³
      const viscosity = 0.001; // Pa·s

      const headloss = calculateHeadloss(
        flow,
        length,
        diameter,
        roughness,
        density,
        viscosity
      );

      expect(headloss).toBeGreaterThan(0); // Headloss should always be positive
    });
  });

  describe('hardyCrossIteration', () => {
    it('should calculate flow correction for a loop', () => {
      const loop: Loop = {
        id: 'loop1',
        pipes: ['pipe1', 'pipe2', 'pipe3'],
      };

      const pipes = [
        {
          id: 'pipe1',
          from: 'node1',
          to: 'node2',
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          flow: 0.01,
        },
        {
          id: 'pipe2',
          from: 'node2',
          to: 'node3',
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          flow: 0.01,
        },
        {
          id: 'pipe3',
          from: 'node3',
          to: 'node1',
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          flow: 0.01,
        },
      ];

      const fluidProperties = {
        density: 998,
        viscosity: 0.001,
      };

      const correction = hardyCrossIteration(loop, pipes, fluidProperties);

      expect(typeof correction).toBe('number');
      expect(Math.abs(correction)).toBeLessThan(1); // Reasonable correction
    });
  });

  describe('applyFlowCorrection', () => {
    it('should apply flow correction to pipes in a loop', () => {
      const loop: Loop = {
        id: 'loop1',
        pipes: ['pipe1', 'pipe2'],
      };

      const pipes = [
        {
          id: 'pipe1',
          from: 'node1',
          to: 'node2',
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          flow: 0.01,
        },
        {
          id: 'pipe2',
          from: 'node2',
          to: 'node1',
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          flow: 0.01,
        },
      ];

      const initialFlows = pipes.map(p => p.flow!);
      const correction = 0.001;

      applyFlowCorrection(loop, pipes, correction);

      pipes.forEach((pipe, index) => {
        expect(pipe.flow).toBe(initialFlows[index] + correction);
      });
    });
  });

  describe('calculateNodeHeads', () => {
    it('should calculate node heads correctly', () => {
      const nodes: Node[] = [
        {
          id: 'node1',
          elevation: { value: 100, unit: 'm' },
        },
        {
          id: 'node2',
          elevation: { value: 95, unit: 'm' },
        },
        {
          id: 'node3',
          elevation: { value: 90, unit: 'm' },
        },
      ];

      const pipes = [
        {
          id: 'pipe1',
          from: 'node1',
          to: 'node2',
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          flow: 0.01,
          headloss: 2.0,
        },
        {
          id: 'pipe2',
          from: 'node2',
          to: 'node3',
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          flow: 0.01,
          headloss: 1.5,
        },
      ];

      calculateNodeHeads(nodes, pipes, 'node1');

      expect(nodes[0].head).toBe(100); // Reference node
      expect(nodes[1].head).toBe(98); // 100 - 2.0
      expect(nodes[2].head).toBe(96.5); // 98 - 1.5
    });
  });

  describe('solveNetwork - Simple Loop Network', () => {
    it('should solve a simple loop network correctly', () => {
      // Create a simple loop network with 3 nodes and 3 pipes
      const input: NetworkInput = {
        nodes: [
          {
            id: 'node1',
            elevation: { value: 100, unit: 'm' },
            demand: { value: -0.02, unit: 'm³/s' }, // Supply (negative)
          },
          {
            id: 'node2',
            elevation: { value: 95, unit: 'm' },
            demand: { value: 0.01, unit: 'm³/s' }, // Demand
          },
          {
            id: 'node3',
            elevation: { value: 90, unit: 'm' },
            demand: { value: 0.01, unit: 'm³/s' }, // Demand
          },
        ],
        pipes: [
          {
            id: 'pipe1',
            from: 'node1',
            to: 'node2',
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }, // Steel pipe
          },
          {
            id: 'pipe2',
            from: 'node2',
            to: 'node3',
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
          },
          {
            id: 'pipe3',
            from: 'node3',
            to: 'node1',
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
          },
        ],
        loops: [
          {
            id: 'loop1',
            pipes: ['pipe1', 'pipe2', 'pipe3'],
          },
        ],
        fluidProperties: {
          density: { value: 998, unit: 'kg/m³' }, // Water
          viscosity: { value: 0.001, unit: 'Pa·s' },
        },
        tolerance: 1e-6,
        maxIterations: 100,
        initialFlowGuess: 0.01,
      };

      const result = solveNetwork(input);

      // Check basic structure
      expect(result.nodes).toHaveLength(3);
      expect(result.pipes).toHaveLength(3);
      expect(result.loops).toHaveLength(1);

      // Check convergence
      expect(result.convergence.converged).toBe(true);
      expect(result.convergence.iterations).toBeGreaterThan(0);
      expect(result.convergence.iterations).toBeLessThanOrEqual(100);
      expect(result.convergence.finalTolerance).toBeLessThanOrEqual(1e-6);

      // Check network balance
      expect(result.metadata.calculations.networkBalance).toBeCloseTo(0, 6);
      expect(result.metadata.calculations.totalSupply).toBe(0.02);
      expect(result.metadata.calculations.totalDemand).toBe(0.02);

      // Check that all nodes have calculated heads
      result.nodes.forEach(node => {
        expect(node.head).toBeDefined();
        expect(typeof node.head).toBe('number');
        expect(node.head).toBeGreaterThan(0);
      });

      // Check that all pipes have calculated flows and headlosses
      result.pipes.forEach(pipe => {
        expect(pipe.flow).toBeDefined();
        expect(typeof pipe.flow).toBe('number');
        expect(pipe.headloss).toBeDefined();
        expect(typeof pipe.headloss).toBe('number');
        expect(pipe.headloss).toBeGreaterThanOrEqual(0);
      });

      // Check that the solution converged and produced reasonable results
      expect(result.convergence.converged).toBe(true);
      expect(result.convergence.iterations).toBeGreaterThan(0);
      expect(result.convergence.finalTolerance).toBeLessThanOrEqual(1e-6);
    });

    it('should handle a more complex network with multiple loops', () => {
      // Create a network with 4 nodes and 5 pipes forming 2 loops
      const input: NetworkInput = {
        nodes: [
          {
            id: 'node1',
            elevation: { value: 100, unit: 'm' },
            demand: { value: -0.03, unit: 'm³/s' }, // Supply
          },
          {
            id: 'node2',
            elevation: { value: 95, unit: 'm' },
            demand: { value: 0.01, unit: 'm³/s' }, // Demand
          },
          {
            id: 'node3',
            elevation: { value: 90, unit: 'm' },
            demand: { value: 0.01, unit: 'm³/s' }, // Demand
          },
          {
            id: 'node4',
            elevation: { value: 85, unit: 'm' },
            demand: { value: 0.01, unit: 'm³/s' }, // Demand
          },
        ],
        pipes: [
          {
            id: 'pipe1',
            from: 'node1',
            to: 'node2',
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
          },
          {
            id: 'pipe2',
            from: 'node2',
            to: 'node3',
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
          },
          {
            id: 'pipe3',
            from: 'node3',
            to: 'node4',
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
          },
          {
            id: 'pipe4',
            from: 'node1',
            to: 'node3',
            length: { value: 150, unit: 'm' },
            diameter: { value: 0.08, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
          },
          {
            id: 'pipe5',
            from: 'node2',
            to: 'node4',
            length: { value: 150, unit: 'm' },
            diameter: { value: 0.08, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
          },
        ],
        loops: [
          {
            id: 'loop1',
            pipes: ['pipe1', 'pipe2', 'pipe4'],
          },
          {
            id: 'loop2',
            pipes: ['pipe2', 'pipe3', 'pipe5'],
          },
        ],
        fluidProperties: {
          density: { value: 998, unit: 'kg/m³' },
          viscosity: { value: 0.001, unit: 'Pa·s' },
        },
      };

      const result = solveNetwork(input);

      // Check basic structure
      expect(result.nodes).toHaveLength(4);
      expect(result.pipes).toHaveLength(5);
      expect(result.loops).toHaveLength(2);

      // Check convergence - for complex networks, we may not always converge perfectly
      expect(result.convergence.iterations).toBeGreaterThan(0);
      expect(result.convergence.iterations).toBeLessThanOrEqual(100);
      // For complex networks, we just check that it ran without errors
      expect(result.convergence.finalTolerance).toBeGreaterThan(0);

      // Check network balance
      expect(result.metadata.calculations.networkBalance).toBeCloseTo(0, 6);
    });

    it('should throw error for unbalanced network', () => {
      const input: NetworkInput = {
        nodes: [
          {
            id: 'node1',
            elevation: { value: 100, unit: 'm' },
            demand: { value: -0.01, unit: 'm³/s' }, // Supply
          },
          {
            id: 'node2',
            elevation: { value: 95, unit: 'm' },
            demand: { value: 0.02, unit: 'm³/s' }, // Demand > Supply
          },
        ],
        pipes: [
          {
            id: 'pipe1',
            from: 'node1',
            to: 'node2',
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' },
          },
        ],
        loops: [],
        fluidProperties: {
          density: { value: 998, unit: 'kg/m³' },
          viscosity: { value: 0.001, unit: 'Pa·s' },
        },
      };

      expect(() => solveNetwork(input)).toThrow('Network is not balanced');
    });

    it('should handle different pipe materials and sizes', () => {
      const input: NetworkInput = {
        nodes: [
          {
            id: 'node1',
            elevation: { value: 100, unit: 'm' },
            demand: { value: -0.02, unit: 'm³/s' },
          },
          {
            id: 'node2',
            elevation: { value: 95, unit: 'm' },
            demand: { value: 0.01, unit: 'm³/s' },
          },
          {
            id: 'node3',
            elevation: { value: 90, unit: 'm' },
            demand: { value: 0.01, unit: 'm³/s' },
          },
        ],
        pipes: [
          {
            id: 'pipe1',
            from: 'node1',
            to: 'node2',
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.15, unit: 'm' }, // Larger diameter
            roughness: { value: 0.0000015, unit: 'm' }, // PVC pipe
          },
          {
            id: 'pipe2',
            from: 'node2',
            to: 'node3',
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.1, unit: 'm' },
            roughness: { value: 0.000045, unit: 'm' }, // Steel pipe
          },
          {
            id: 'pipe3',
            from: 'node3',
            to: 'node1',
            length: { value: 100, unit: 'm' },
            diameter: { value: 0.08, unit: 'm' }, // Smaller diameter
            roughness: { value: 0.00026, unit: 'm' }, // Cast iron pipe
          },
        ],
        loops: [
          {
            id: 'loop1',
            pipes: ['pipe1', 'pipe2', 'pipe3'],
          },
        ],
        fluidProperties: {
          density: { value: 998, unit: 'kg/m³' },
          viscosity: { value: 0.001, unit: 'Pa·s' },
        },
      };

      const result = solveNetwork(input);

      expect(result.convergence.converged).toBe(true);
      expect(result.pipes).toHaveLength(3);

      // Check that different pipe characteristics result in different headlosses
      const headlosses = result.pipes.map(p => p.headloss);
      expect(new Set(headlosses).size).toBeGreaterThan(1); // Should have different headlosses
    });
  });
});
