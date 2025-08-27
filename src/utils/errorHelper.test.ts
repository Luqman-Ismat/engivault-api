import { describe, it, expect } from 'vitest';
import { ErrorHelper, ErrorHint } from './errorHelper';

describe('ErrorHelper', () => {
  describe('createError', () => {
    it('should create a basic error', () => {
      const error = ErrorHelper.createError('Test error', 'TEST_ERROR');
      
      expect(error).toEqual({
        error: 'Test error',
        code: 'TEST_ERROR',
        details: undefined,
        hints: undefined,
      });
    });

    it('should create an error with details and hints', () => {
      const hints: ErrorHint[] = [
        {
          type: 'assumption_violation',
          message: 'Test hint',
        },
      ];
      
      const error = ErrorHelper.createError('Test error', 'TEST_ERROR', { test: 'data' }, hints);
      
      expect(error).toEqual({
        error: 'Test error',
        code: 'TEST_ERROR',
        details: { test: 'data' },
        hints,
      });
    });
  });

  describe('addMachViolationHint', () => {
    it('should not add hint for Mach < 0.3', () => {
      const hints = ErrorHelper.addMachViolationHint(0.2);
      expect(hints).toEqual([]);
    });

    it('should add hint for Mach > 0.3', () => {
      const hints = ErrorHelper.addMachViolationHint(0.5);
      expect(hints).toHaveLength(1);
      expect(hints[0]).toEqual({
        type: 'assumption_violation',
        message: 'Mach number (0.500) exceeds 0.3. Compressible flow effects are significant.',
        suggestedEndpoint: '/api/v1/gas/pressure-drop',
        validRange: { min: 0, max: 0.3 },
      });
    });
  });

  describe('addReynoldsViolationHint', () => {
    it('should not add hint for turbulent flow', () => {
      const hints = ErrorHelper.addReynoldsViolationHint(5000);
      expect(hints).toEqual([]);
    });

    it('should add hint for laminar flow', () => {
      const hints = ErrorHelper.addReynoldsViolationHint(1500);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('laminar flow');
      expect(hints[0].validRange).toEqual({ min: 4000, max: 100000000 });
    });

    it('should add hint for transition region', () => {
      const hints = ErrorHelper.addReynoldsViolationHint(3000);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('transition region');
    });
  });

  describe('addRoughnessViolationHint', () => {
    it('should not add hint for normal roughness', () => {
      const hints = ErrorHelper.addRoughnessViolationHint(0.001);
      expect(hints).toEqual([]);
    });

    it('should add hint for excessive roughness', () => {
      const hints = ErrorHelper.addRoughnessViolationHint(0.1);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('exceeds 0.05');
      expect(hints[0].validRange).toEqual({ min: 0, max: 0.05 });
    });
  });

  describe('addDiameterViolationHint', () => {
    it('should not add hint for normal diameter', () => {
      const hints = ErrorHelper.addDiameterViolationHint(0.1);
      expect(hints).toEqual([]);
    });

    it('should add hint for very small diameter', () => {
      const hints = ErrorHelper.addDiameterViolationHint(0.005);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('very small');
      expect(hints[0].validRange).toEqual({ min: 0.01, max: 2.0 });
    });

    it('should add hint for very large diameter', () => {
      const hints = ErrorHelper.addDiameterViolationHint(3.0);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('very large');
    });
  });

  describe('addVelocityViolationHint', () => {
    it('should not add hint for normal velocity', () => {
      const hints = ErrorHelper.addVelocityViolationHint(5.0);
      expect(hints).toEqual([]);
    });

    it('should add hint for very low velocity', () => {
      const hints = ErrorHelper.addVelocityViolationHint(0.05);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('very low');
      expect(hints[0].validRange).toEqual({ min: 0.1, max: 50 });
    });

    it('should add hint for very high velocity', () => {
      const hints = ErrorHelper.addVelocityViolationHint(60.0);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('very high');
      expect(hints[0].suggestedEndpoint).toBe('/api/v1/gas/pressure-drop');
    });
  });

  describe('addNPSHViolationHint', () => {
    it('should not add hint for adequate NPSH', () => {
      const hints = ErrorHelper.addNPSHViolationHint(5.0, 3.0);
      expect(hints).toEqual([]);
    });

    it('should add hint for insufficient NPSH', () => {
      const hints = ErrorHelper.addNPSHViolationHint(2.0, 3.0);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('Cavitation risk is high');
      expect(hints[0].suggestedValue).toBe(4.0);
    });

    it('should add hint for close NPSH', () => {
      const hints = ErrorHelper.addNPSHViolationHint(3.5, 3.0);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('close to NPSHr');
    });
  });

  describe('addBEPViolationHint', () => {
    it('should not add hint for close to BEP', () => {
      const hints = ErrorHelper.addBEPViolationHint(0.1);
      expect(hints).toEqual([]);
    });

    it('should add hint for far from BEP', () => {
      const hints = ErrorHelper.addBEPViolationHint(0.3);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('far from BEP');
      expect(hints[0].validRange).toEqual({ min: 0, max: 0.2 });
    });
  });

  describe('addCurveFittingViolationHint', () => {
    it('should not add hint for adequate points', () => {
      const hints = ErrorHelper.addCurveFittingViolationHint(5, 'quadratic', 0.95);
      expect(hints).toEqual([]);
    });

    it('should add hint for insufficient points for quadratic', () => {
      const hints = ErrorHelper.addCurveFittingViolationHint(2, 'quadratic', 0.95);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('requires at least 3 points');
      expect(hints[0].suggestedValue).toBe(3);
    });

    it('should add hint for insufficient points for cubic', () => {
      const hints = ErrorHelper.addCurveFittingViolationHint(3, 'cubic', 0.95);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('requires at least 4 points');
      expect(hints[0].suggestedValue).toBe(4);
    });

    it('should add hint for poor fit', () => {
      const hints = ErrorHelper.addCurveFittingViolationHint(5, 'quadratic', 0.8);
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('poor fit');
      expect(hints[0].validRange).toEqual({ min: 0.9, max: 1.0 });
    });
  });

  describe('addUnitConversionHint', () => {
    it('should add unit conversion hint', () => {
      const hints = ErrorHelper.addUnitConversionHint('m/s', 'ft/s', 'velocity');
      expect(hints).toHaveLength(1);
      expect(hints[0].type).toBe('unit_conversion');
      expect(hints[0].message).toContain('/api/v1/utilities/convert');
      expect(hints[0].suggestedEndpoint).toBe('/api/v1/utilities/convert');
    });
  });

  describe('addParameterFixHint', () => {
    it('should add parameter fix hint', () => {
      const hints = ErrorHelper.addParameterFixHint('diameter', 0.005, 0.01, 'too small');
      expect(hints).toHaveLength(1);
      expect(hints[0].type).toBe('parameter_fix');
      expect(hints[0].message).toContain('diameter (0.005): too small');
      expect(hints[0].suggestedValue).toBe(0.01);
    });
  });

  describe('createValidationError', () => {
    it('should create validation error with hints', () => {
      const hints: ErrorHint[] = [
        {
          type: 'assumption_violation',
          message: 'Test hint',
        },
      ];
      
      const error = ErrorHelper.createValidationError('diameter', 0.005, 'min', 'Too small', hints);
      
      expect(error).toEqual({
        error: 'Validation Error',
        code: 'VALIDATION_ERROR',
        validationErrors: [
          {
            field: 'diameter',
            value: 0.005,
            constraint: 'min',
            message: 'Too small',
          },
        ],
        hints,
      });
    });
  });

  describe('addEngineeringHints', () => {
    it('should add pressure drop hints', () => {
      const hints = ErrorHelper.addEngineeringHints('pressure_drop', {
        reynolds: 1500,
        relativeRoughness: 0.1,
        diameter: 0.005,
        velocity: 0.05,
      });
      
      expect(hints).toHaveLength(4);
      expect(hints.some(h => h.message.includes('laminar flow'))).toBe(true);
      expect(hints.some(h => h.message.includes('exceeds 0.05'))).toBe(true);
      expect(hints.some(h => h.message.includes('very small'))).toBe(true);
      expect(hints.some(h => h.message.includes('very low'))).toBe(true);
    });

    it('should add gas flow hints', () => {
      const hints = ErrorHelper.addEngineeringHints('gas_flow', {
        mach: 0.5,
      });
      
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('exceeds 0.3');
    });

    it('should add NPSH hints', () => {
      const hints = ErrorHelper.addEngineeringHints('npsh', {
        npsha: 2.0,
        npshr: 3.0,
      });
      
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('Cavitation risk is high');
    });

    it('should add BEP hints', () => {
      const hints = ErrorHelper.addEngineeringHints('bep_check', {
        bepDistance: 0.3,
      });
      
      expect(hints).toHaveLength(1);
      expect(hints[0].message).toContain('far from BEP');
    });

    it('should add curve fitting hints', () => {
      const hints = ErrorHelper.addEngineeringHints('curve_fit', {
        nPoints: 2,
        model: 'quadratic',
        rSquared: 0.8,
      });
      
      expect(hints).toHaveLength(2);
      expect(hints.some(h => h.message.includes('requires at least 3 points'))).toBe(true);
      expect(hints.some(h => h.message.includes('poor fit'))).toBe(true);
    });

    it('should return empty array for unknown calculation type', () => {
      const hints = ErrorHelper.addEngineeringHints('unknown', {});
      expect(hints).toEqual([]);
    });
  });
});
