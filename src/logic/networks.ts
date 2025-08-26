import { Quantity } from '@/schemas/common';
import { convert } from '@/utils/units';
import { churchillF, reynolds } from './friction';

export interface Node {
  id: string;
  elevation: Quantity; // m
  demand?: Quantity; // m³/s (negative for supply)
  head?: number; // m (calculated)
}

export interface Pipe {
  id: string;
  from: string; // node ID
  to: string; // node ID
  length: Quantity; // m
  diameter: Quantity; // m
  roughness: Quantity; // m
  flow?: number; // m³/s (calculated)
  headloss?: number; // m (calculated)
}

export interface Loop {
  id: string;
  pipes: string[]; // pipe IDs in clockwise order
}

export interface NetworkInput {
  nodes: Node[];
  pipes: Pipe[];
  loops: Loop[];
  fluidProperties: {
    density: Quantity; // kg/m³
    viscosity: Quantity; // Pa·s
  };
  tolerance?: number; // convergence tolerance (default: 1e-6)
  maxIterations?: number; // maximum iterations (default: 100)
  initialFlowGuess?: number; // m³/s (default: 0.1)
}

export interface NetworkResult {
  nodes: (Node & { head: number })[];
  pipes: (Pipe & { flow: number; headloss: number })[];
  loops: Loop[];
  convergence: {
    converged: boolean;
    iterations: number;
    finalTolerance: number;
    maxTolerance: number;
  };
  metadata: {
    input: NetworkInput;
    calculations: {
      totalDemand: number;
      totalSupply: number;
      networkBalance: number;
    };
  };
}

/**
 * Calculate pipe resistance coefficient (K) using Churchill friction factor
 * For Hardy Cross method: hf = K * Q^2
 * where K = f * L / (2 * g * D^5 * A^2)
 * @param length - Pipe length (m)
 * @param diameter - Pipe diameter (m)
 * @param roughness - Pipe roughness (m)
 * @param flow - Flow rate (m³/s)
 * @param density - Fluid density (kg/m³)
 * @param viscosity - Fluid viscosity (Pa·s)
 * @returns Resistance coefficient K (s²/m⁵)
 */
export function calculatePipeResistance(
  length: number,
  diameter: number,
  roughness: number,
  flow: number,
  density: number,
  viscosity: number
): number {
  if (flow === 0) {
    return 0;
  }

  const area = Math.PI * diameter * diameter / 4;
  const velocity = Math.abs(flow) / area;
  const reynoldsNumber = reynolds(density, velocity, diameter, viscosity);
  const frictionFactor = churchillF(reynoldsNumber, roughness / diameter);
  
  // K = f * L / (2 * g * D^5 * A^2)
  const g = 9.81; // m/s²
  const K = (frictionFactor * length) / (2 * g * Math.pow(diameter, 5) * Math.pow(area, 2));
  
  return K;
}

/**
 * Calculate headloss in a pipe using Darcy-Weisbach equation
 * hf = K * Q^2 where K = f * L / (2 * g * D^5 * A^2)
 * @param flow - Flow rate (m³/s)
 * @param length - Pipe length (m)
 * @param diameter - Pipe diameter (m)
 * @param roughness - Pipe roughness (m)
 * @param density - Fluid density (kg/m³)
 * @param viscosity - Fluid viscosity (Pa·s)
 * @returns Headloss (m)
 */
export function calculateHeadloss(
  flow: number,
  length: number,
  diameter: number,
  roughness: number,
  density: number,
  viscosity: number
): number {
  const K = calculatePipeResistance(length, diameter, roughness, flow, density, viscosity);
  return K * flow * flow; // hf = K * Q^2 (always positive)
}

/**
 * Perform Hardy Cross iteration for a single loop
 * @param loop - Loop definition
 * @param pipes - Array of pipes with current flows
 * @param fluidProperties - Fluid properties
 * @returns Flow correction for the loop
 */
export function hardyCrossIteration(
  loop: Loop,
  pipes: (Pipe & { flow: number })[],
  fluidProperties: { density: number; viscosity: number }
): number {
  let sumKQ = 0; // Sum of K * Q * |Q|
  let sum2KQ = 0; // Sum of 2 * K * |Q|
  
  for (const pipeId of loop.pipes) {
    const pipe = pipes.find(p => p.id === pipeId);
    if (!pipe || pipe.flow === undefined) {
      throw new Error(`Pipe ${pipeId} not found or flow not set`);
    }
    
    const length = convert(pipe.length, 'm').value;
    const diameter = convert(pipe.diameter, 'm').value;
    const roughness = convert(pipe.roughness, 'm').value;
    const flow = pipe.flow;
    
    const K = calculatePipeResistance(
      length,
      diameter,
      roughness,
      flow,
      fluidProperties.density,
      fluidProperties.viscosity
    );
    
    // For Hardy Cross, we need to determine flow direction relative to loop
    // This is a simplified approach - in practice, you'd need to track flow direction
    // For now, assume all flows are positive in the loop direction
    sumKQ += K * flow * flow;
    sum2KQ += 2 * K * Math.abs(flow);
  }
  
  // Flow correction: ΔQ = -Σ(KQ|Q|) / Σ(2K|Q|)
  const flowCorrection = -sumKQ / sum2KQ;
  
  return flowCorrection;
}

/**
 * Apply flow correction to pipes in a loop
 * @param loop - Loop definition
 * @param pipes - Array of pipes
 * @param flowCorrection - Flow correction to apply
 */
export function applyFlowCorrection(
  loop: Loop,
  pipes: (Pipe & { flow: number })[],
  flowCorrection: number
): void {
  for (const pipeId of loop.pipes) {
    const pipe = pipes.find(p => p.id === pipeId);
    if (pipe && pipe.flow !== undefined) {
      pipe.flow += flowCorrection;
    }
  }
}

/**
 * Calculate node heads using energy equation
 * @param nodes - Array of nodes
 * @param pipes - Array of pipes with flows and headlosses
 * @param referenceNode - Reference node ID (usually a reservoir)
 */
export function calculateNodeHeads(
  nodes: Node[],
  pipes: (Pipe & { flow: number; headloss: number })[],
  referenceNode: string
): void {
  const nodeMap = new Map<string, Node & { head?: number }>();
  nodes.forEach(node => nodeMap.set(node.id, { ...node }));
  
  // Set reference node head to its elevation
  const refNode = nodeMap.get(referenceNode);
  if (!refNode) {
    throw new Error(`Reference node ${referenceNode} not found`);
  }
  refNode.head = convert(refNode.elevation, 'm').value;
  
  // Create adjacency list for pipes
  const adjacencyList = new Map<string, { to: string; pipe: Pipe & { flow: number; headloss: number } }[]>();
  pipes.forEach(pipe => {
    if (!adjacencyList.has(pipe.from)) {
      adjacencyList.set(pipe.from, []);
    }
    if (!adjacencyList.has(pipe.to)) {
      adjacencyList.set(pipe.to, []);
    }
    
    adjacencyList.get(pipe.from)!.push({ to: pipe.to, pipe });
    adjacencyList.get(pipe.to)!.push({ to: pipe.from, pipe });
  });
  
  // BFS to calculate heads
  const queue: string[] = [referenceNode];
  const visited = new Set<string>();
  visited.add(referenceNode);
  
  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;
    const currentNode = nodeMap.get(currentNodeId)!;
    
    const neighbors = adjacencyList.get(currentNodeId) || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.to)) continue;
      
      const neighborNode = nodeMap.get(neighbor.to)!;
      const pipe = neighbor.pipe;
      
      // Calculate head based on flow direction
      let headloss = pipe.headloss!;
      if (pipe.from === currentNodeId) {
        // Flow from current to neighbor
        neighborNode.head = currentNode.head! - headloss;
      } else {
        // Flow from neighbor to current
        neighborNode.head = currentNode.head! + headloss;
      }
      
      visited.add(neighbor.to);
      queue.push(neighbor.to);
    }
  }
  
  // Update original nodes array
  nodes.forEach((node, index) => {
    const updatedNode = nodeMap.get(node.id);
    if (updatedNode && updatedNode.head !== undefined) {
      nodes[index] = { ...node, head: updatedNode.head };
    }
  });
}

/**
 * Solve pipe network using Hardy Cross method
 * @param input - Network input data
 * @returns Network solution with flows, headlosses, and node heads
 */
export function solveNetwork(input: NetworkInput): NetworkResult {
  const {
    nodes,
    pipes,
    loops,
    fluidProperties,
    tolerance = 1e-6,
    maxIterations = 100,
    initialFlowGuess = 0.1
  } = input;
  
  // Convert fluid properties to SI units
  const density = convert(fluidProperties.density, 'kg/m³').value;
  const viscosity = convert(fluidProperties.viscosity, 'Pa·s').value;
  
  // Check network balance first
  const totalDemand = nodes
    .filter(node => node.demand && convert(node.demand!, 'm³/s').value > 0)
    .reduce((sum, node) => sum + convert(node.demand!, 'm³/s').value, 0);
  
  const totalSupply = nodes
    .filter(node => node.demand && convert(node.demand!, 'm³/s').value < 0)
    .reduce((sum, node) => sum + Math.abs(convert(node.demand!, 'm³/s').value), 0);
  
  const networkBalance = totalSupply - totalDemand;
  
  if (Math.abs(networkBalance) > tolerance) {
    throw new Error(`Network is not balanced. Supply: ${totalSupply}, Demand: ${totalDemand}`);
  }
  
  // Initialize flows with better guess values based on network topology
  const pipesWithFlows = pipes.map(pipe => ({
    ...pipe,
    flow: initialFlowGuess
  }));
  
  // Simple flow distribution - this is a basic approach
  // In practice, you'd want a more sophisticated initial flow distribution
  const totalFlow = totalSupply;
  const avgFlow = totalFlow / pipes.length;
  pipesWithFlows.forEach(pipe => {
    pipe.flow = avgFlow;
  });
  
  // Hardy Cross iterations
  let iteration = 0;
  let maxTolerance = Infinity;
  
  while (iteration < maxIterations && maxTolerance > tolerance) {
    maxTolerance = 0;
    
    // Iterate through each loop
    for (const loop of loops) {
      const flowCorrection = hardyCrossIteration(loop, pipesWithFlows, { density, viscosity });
      applyFlowCorrection(loop, pipesWithFlows, flowCorrection);
      maxTolerance = Math.max(maxTolerance, Math.abs(flowCorrection));
    }
    
    iteration++;
  }
  
  // Calculate headlosses for all pipes
  pipesWithFlows.forEach(pipe => {
    const length = convert(pipe.length, 'm').value;
    const diameter = convert(pipe.diameter, 'm').value;
    const roughness = convert(pipe.roughness, 'm').value;
    
    pipe.headloss = calculateHeadloss(
      pipe.flow!,
      length,
      diameter,
      roughness,
      density,
      viscosity
    );
  });
  
  // Ensure all pipes have headloss defined
  const pipesWithHeadloss = pipesWithFlows.map(pipe => ({
    ...pipe,
    headloss: pipe.headloss!
  }));
  
  // Calculate node heads (use first node as reference)
  const referenceNode = nodes[0]?.id;
  if (!referenceNode) {
    throw new Error('No nodes provided');
  }
  calculateNodeHeads(nodes, pipesWithHeadloss, referenceNode);
  
  return {
    nodes: nodes as (Node & { head: number })[],
    pipes: pipesWithHeadloss as (Pipe & { flow: number; headloss: number })[],
    loops,
    convergence: {
      converged: maxTolerance <= tolerance,
      iterations: iteration,
      finalTolerance: maxTolerance,
      maxTolerance
    },
    metadata: {
      input,
      calculations: {
        totalDemand,
        totalSupply,
        networkBalance
      }
    }
  };
}
