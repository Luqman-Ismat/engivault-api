import { Quantity } from '@/schemas/common';
import { convert } from '@/utils/units';
import { getFluidDefaults } from '@/props';
import { reynolds, churchillF, darcyWeisbachDP } from './friction';
import { warnTransition, accumulateWarnings, Warning } from '@/utils/guardrails';

export interface PipelineSegment {
  length: Quantity;
  diameter: Quantity;
  roughness: Quantity;
  elevationDelta: Quantity;
  kLocal?: number[];
  flow?: Quantity;
}

export interface PressureNode {
  cumulativeLength: Quantity;
  elevation: Quantity;
  pressure: Quantity;
}

export interface PressureProfileResult {
  nodes: PressureNode[];
  warnings: (string | Warning)[];
  totalPressureDrop: Quantity;
  totalLength: Quantity;
}

export interface SegmentCalculation {
  segment: PipelineSegment;
  reynoldsNumber: number;
  frictionFactor: number;
  velocity: number;
  frictionalLoss: number;
  localLoss: number;
  staticHead: number;
  totalLoss: number;
  warnings: string[];
}

export function computeProfile(
  segments: PipelineSegment[],
  fluid: { name?: string; temperature: Quantity; density?: Quantity; viscosity?: Quantity }
): PressureProfileResult {
  const warnings: string[] = [];
  
  // Get fluid properties
  const temperature = convert(fluid.temperature, 'K').value;
  let rho: number, mu: number;
  
  if (fluid.density && fluid.viscosity) {
    rho = convert(fluid.density, 'kg/m³').value;
    mu = convert(fluid.viscosity, 'Pa·s').value;
  } else if (fluid.name) {
    const fluidProps = getFluidDefaults(fluid.name, temperature);
    rho = convert(fluidProps.density, 'kg/m³').value;
    mu = convert(fluidProps.viscosity, 'Pa·s').value;
  } else {
    throw new Error('Either fluid properties (density, viscosity) or fluid name must be provided');
  }

  // Calculate total flow rate if not provided for all segments
  let totalFlow = 0;
  const segmentsWithFlow = segments.filter(s => s.flow);
  if (segmentsWithFlow.length > 0) {
    totalFlow = convert(segmentsWithFlow[0].flow!, 'm³/s').value;
  } else {
    // If no flow is provided, we need to throw an error or provide a default
    throw new Error('Flow rate must be provided for at least one segment');
  }

  // Validate that all segments have the same flow rate if specified
  if (segmentsWithFlow.length > 0) {
    const firstFlow = convert(segmentsWithFlow[0].flow!, 'm³/s').value;
    for (const segment of segmentsWithFlow) {
      const segmentFlow = convert(segment.flow!, 'm³/s').value;
      if (Math.abs(segmentFlow - firstFlow) > 1e-6) {
        throw new Error('All segments must have the same flow rate');
      }
    }
  }

  const nodes: PressureNode[] = [];
  let cumulativeLength = 0;
  let currentElevation = 0;
  let currentPressure = 0; // Start at atmospheric pressure
  let totalPressureDrop = 0;

  // Calculate each segment
  const segmentCalculations: SegmentCalculation[] = [];
  
  for (const segment of segments) {
    const length = convert(segment.length, 'm').value;
    const diameter = convert(segment.diameter, 'm').value;
    const roughness = convert(segment.roughness, 'm').value;
    const elevationDelta = convert(segment.elevationDelta, 'm').value;
    
    // Calculate velocity
    const area = Math.PI * (diameter / 2) ** 2;
    const velocity = totalFlow / area;
    
    // Calculate Reynolds number
    const Re = reynolds(rho, velocity, diameter, mu);
    
    // Calculate friction factor using Churchill
    const epsOverD = roughness / diameter;
    const frictionFactor = churchillF(Re, epsOverD);
    
    // Calculate frictional pressure drop
    const frictionalLoss = darcyWeisbachDP(rho, velocity, length, diameter, frictionFactor);
    
    // Calculate local losses
    let localLoss = 0;
    if (segment.kLocal && segment.kLocal.length > 0) {
      const totalK = segment.kLocal.reduce((sum, k) => sum + k, 0);
      localLoss = 0.5 * rho * velocity ** 2 * totalK;
    }
    
    // Calculate static head
    const g = 9.81; // m/s²
    const staticHead = rho * g * elevationDelta;
    
    // Total pressure change for this segment
    const totalLoss = frictionalLoss + localLoss + staticHead;
    
    // Collect warnings
    const segmentWarnings: (string | Warning)[] = [];
    const transitionWarning = warnTransition(Re);
    if (transitionWarning) {
      segmentWarnings.push(transitionWarning);
    }
    
    // Check for very high velocities (potential cavitation risk)
    if (velocity > 10) {
      segmentWarnings.push(`High velocity (${velocity.toFixed(1)} m/s) may cause cavitation or erosion`);
    }
    
    // Check for very low velocities (potential sedimentation)
    if (velocity < 0.5) {
      segmentWarnings.push(`Low velocity (${velocity.toFixed(2)} m/s) may cause sedimentation`);
    }
    
    segmentCalculations.push({
      segment,
      reynoldsNumber: Re,
      frictionFactor,
      velocity,
      frictionalLoss,
      localLoss,
      staticHead,
      totalLoss,
      warnings: segmentWarnings
    });
    
    // Update cumulative values
    cumulativeLength += length;
    currentElevation += elevationDelta;
    currentPressure -= totalLoss; // Pressure decreases along the flow
    totalPressureDrop += totalLoss;
    
    // Add node at end of segment
    nodes.push({
      cumulativeLength: { value: cumulativeLength, unit: 'm' },
      elevation: { value: currentElevation, unit: 'm' },
      pressure: { value: currentPressure, unit: 'Pa' }
    });
    
    // Accumulate warnings
    warnings.push(...segmentWarnings);
  }

  // Add initial node (start of pipeline)
  nodes.unshift({
    cumulativeLength: { value: 0, unit: 'm' },
    elevation: { value: 0, unit: 'm' },
    pressure: { value: 0, unit: 'Pa' }
  });

  return {
    nodes,
    warnings: warnings,
    totalPressureDrop: { value: totalPressureDrop, unit: 'Pa' },
    totalLength: { value: cumulativeLength, unit: 'm' }
  };
}

export function validateSegments(segments: PipelineSegment[]): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  if (segments.length === 0) {
    return { isValid: false, warnings: ['At least one segment is required'] };
  }
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    // Check for negative values
    if (segment.length.value <= 0) {
      warnings.push(`Segment ${i + 1}: Length must be positive`);
    }
    
    if (segment.diameter.value <= 0) {
      warnings.push(`Segment ${i + 1}: Diameter must be positive`);
    }
    
    if (segment.roughness.value < 0) {
      warnings.push(`Segment ${i + 1}: Roughness cannot be negative`);
    }
    
    // Check for reasonable roughness values
    const diameter = convert(segment.diameter, 'm').value;
    const roughness = convert(segment.roughness, 'm').value;
    if (roughness > diameter / 10) {
      warnings.push(`Segment ${i + 1}: Roughness is very high relative to diameter`);
    }
    
    // Check K-factors
    if (segment.kLocal) {
      for (let j = 0; j < segment.kLocal.length; j++) {
        if (segment.kLocal[j] < 0) {
          warnings.push(`Segment ${i + 1}, K-factor ${j + 1}: Cannot be negative`);
        }
      }
    }
  }
  
  return { isValid: warnings.length === 0, warnings };
}

export function getPressureProfileSummary(result: PressureProfileResult): string {
  const totalLength = result.totalLength.value;
  const totalDrop = result.totalPressureDrop.value;
  const nodeCount = result.nodes.length;
  const warningCount = result.warnings.length;
  
  return `Pressure Profile: ${nodeCount} nodes, ${totalLength.toFixed(1)}m total length, ${totalDrop.toFixed(0)}Pa total drop. Warnings: ${warningCount}`;
}
