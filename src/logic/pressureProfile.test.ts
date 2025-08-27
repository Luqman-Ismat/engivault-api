import { describe, it, expect } from 'vitest';
import {
  computeProfile,
  validateSegments,
  getPressureProfileSummary,
} from './pressureProfile';
import { PipelineSegment } from './pressureProfile';

describe('Pressure Profile', () => {
  const waterFluid = {
    name: 'water',
    temperature: { value: 20, unit: 'C' },
  };

  const airFluid = {
    name: 'air',
    temperature: { value: 25, unit: 'C' },
  };

  describe('computeProfile', () => {
    it('should calculate pressure profile for single segment', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 5, unit: 'm' },
          flow: { value: 0.01, unit: 'm³/s' },
        },
      ];

      const result = computeProfile(segments, waterFluid);

      expect(result.nodes).toHaveLength(2); // Start and end nodes
      expect(result.nodes[0].cumulativeLength.value).toBe(0);
      expect(result.nodes[0].elevation.value).toBe(0);
      expect(result.nodes[0].pressure.value).toBe(0);

      expect(result.nodes[1].cumulativeLength.value).toBe(100);
      expect(result.nodes[1].elevation.value).toBe(5);
      expect(result.nodes[1].pressure.value).toBeLessThan(0); // Pressure decreases

      expect(result.totalLength.value).toBe(100);
      expect(result.totalPressureDrop.value).toBeGreaterThan(0);
      expect(result.warnings).toBeInstanceOf(Array);
    });

    it('should handle multiple segments with mixed diameters', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 50, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 2, unit: 'm' },
          flow: { value: 0.01, unit: 'm³/s' },
        },
        {
          length: { value: 75, unit: 'm' },
          diameter: { value: 0.08, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: -1, unit: 'm' },
          flow: { value: 0.01, unit: 'm³/s' },
        },
      ];

      const result = computeProfile(segments, waterFluid);

      expect(result.nodes).toHaveLength(3);
      expect(result.nodes[1].cumulativeLength.value).toBe(50);
      expect(result.nodes[1].elevation.value).toBe(2);
      expect(result.nodes[2].cumulativeLength.value).toBe(125);
      expect(result.nodes[2].elevation.value).toBe(1);

      // Second segment should have higher velocity due to smaller diameter
      expect(result.totalLength.value).toBe(125);
    });

    it('should include local losses from K-factors', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
          kLocal: [0.5, 1.2], // Two fittings
          flow: { value: 0.01, unit: 'm³/s' },
        },
      ];

      const result = computeProfile(segments, waterFluid);

      expect(result.nodes[1].pressure.value).toBeLessThan(0);
      expect(result.totalPressureDrop.value).toBeGreaterThan(0);
    });

    it('should handle elevation changes correctly', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 10, unit: 'm' }, // Uphill
          flow: { value: 0.01, unit: 'm³/s' },
        },
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: -15, unit: 'm' }, // Downhill
          flow: { value: 0.01, unit: 'm³/s' },
        },
      ];

      const result = computeProfile(segments, waterFluid);

      expect(result.nodes[1].elevation.value).toBe(10);
      expect(result.nodes[2].elevation.value).toBe(-5);

      // Uphill segment should have higher pressure drop
      // Downhill segment might have pressure recovery
    });

    it('should generate transition warnings for Reynolds numbers in transition region', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.05, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
          flow: { value: 0.0001, unit: 'm³/s' }, // Very low flow for transition region
        },
      ];

      const result = computeProfile(segments, waterFluid);

      // Should have transition warning
      const hasTransitionWarning = result.warnings.some(warning => {
        if (typeof warning === 'string') {
          return warning.includes('transition') || warning.includes('Reynolds');
        } else {
          return (
            warning.message.includes('transition') ||
            warning.message.includes('Reynolds')
          );
        }
      });
      expect(hasTransitionWarning).toBe(true);
    });

    it('should handle high velocity warnings', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.01, unit: 'm' }, // Very small diameter
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
          flow: { value: 0.01, unit: 'm³/s' }, // High velocity
        },
      ];

      const result = computeProfile(segments, waterFluid);

      const hasHighVelocityWarning = result.warnings.some(warning => {
        if (typeof warning === 'string') {
          return (
            warning.includes('High velocity') || warning.includes('cavitation')
          );
        } else {
          return (
            warning.message.includes('High velocity') ||
            warning.message.includes('cavitation')
          );
        }
      });
      expect(hasHighVelocityWarning).toBe(true);
    });

    it('should handle low velocity warnings', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.5, unit: 'm' }, // Large diameter
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
          flow: { value: 0.001, unit: 'm³/s' }, // Low velocity
        },
      ];

      const result = computeProfile(segments, waterFluid);

      const hasLowVelocityWarning = result.warnings.some(warning => {
        if (typeof warning === 'string') {
          return (
            warning.includes('Low velocity') ||
            warning.includes('sedimentation')
          );
        } else {
          return (
            warning.message.includes('Low velocity') ||
            warning.message.includes('sedimentation')
          );
        }
      });
      expect(hasLowVelocityWarning).toBe(true);
    });

    it('should work with air as fluid', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 5, unit: 'm' },
          flow: { value: 0.1, unit: 'm³/s' },
        },
      ];

      const result = computeProfile(segments, airFluid);

      expect(result.nodes).toHaveLength(2);
      expect(result.totalLength.value).toBe(100);
      expect(result.totalPressureDrop.value).toBeGreaterThan(0);
    });

    it('should work with explicit fluid properties', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
          flow: { value: 0.01, unit: 'm³/s' },
        },
      ];

      const fluid = {
        temperature: { value: 20, unit: 'C' },
        density: { value: 998, unit: 'kg/m³' },
        viscosity: { value: 0.001, unit: 'Pa·s' },
      };

      const result = computeProfile(segments, fluid);

      expect(result.nodes).toHaveLength(2);
      expect(result.totalLength.value).toBe(100);
    });

    it('should throw error for missing fluid properties', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
          flow: { value: 0.01, unit: 'm³/s' },
        },
      ];

      const fluid = {
        temperature: { value: 20, unit: 'C' },
      };

      expect(() => computeProfile(segments, fluid)).toThrow(
        'Either fluid properties'
      );
    });

    it('should throw error for different flow rates in segments', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
          flow: { value: 0.01, unit: 'm³/s' },
        },
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
          flow: { value: 0.02, unit: 'm³/s' }, // Different flow rate
        },
      ];

      expect(() => computeProfile(segments, waterFluid)).toThrow(
        'All segments must have the same flow rate'
      );
    });
  });

  describe('validateSegments', () => {
    it('should validate valid segments', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
        },
      ];

      const result = validateSegments(segments);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should reject empty segments array', () => {
      const segments: PipelineSegment[] = [];

      const result = validateSegments(segments);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('At least one segment is required');
    });

    it('should warn about negative length', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: -100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
        },
      ];

      const result = validateSegments(segments);

      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Segment 1: Length must be positive');
    });

    it('should warn about negative diameter', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: -0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
        },
      ];

      const result = validateSegments(segments);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain('Segment 1: Diameter must be positive');
    });

    it('should warn about negative roughness', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: -0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
        },
      ];

      const result = validateSegments(segments);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'Segment 1: Roughness cannot be negative'
      );
    });

    it('should warn about high roughness relative to diameter', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.02, unit: 'm' }, // Very high roughness
          elevationDelta: { value: 0, unit: 'm' },
        },
      ];

      const result = validateSegments(segments);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'Segment 1: Roughness is very high relative to diameter'
      );
    });

    it('should warn about negative K-factors', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
          kLocal: [0.5, -1.2, 0.8], // Negative K-factor
        },
      ];

      const result = validateSegments(segments);
      expect(result.isValid).toBe(false);
      expect(result.warnings).toContain(
        'Segment 1, K-factor 2: Cannot be negative'
      );
    });
  });

  describe('getPressureProfileSummary', () => {
    it('should generate summary string', () => {
      const segments: PipelineSegment[] = [
        {
          length: { value: 100, unit: 'm' },
          diameter: { value: 0.1, unit: 'm' },
          roughness: { value: 0.000045, unit: 'm' },
          elevationDelta: { value: 0, unit: 'm' },
          flow: { value: 0.01, unit: 'm³/s' },
        },
      ];

      const result = computeProfile(segments, waterFluid);
      const summary = getPressureProfileSummary(result);

      expect(summary).toContain('Pressure Profile:');
      expect(summary).toContain('nodes');
      expect(summary).toContain('total length');
      expect(summary).toContain('total drop');
      expect(summary).toContain('Warnings:');
    });
  });
});
