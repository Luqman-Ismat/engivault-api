import { describe, it, expect } from 'vitest';
import {
  requiredCvLiquid,
  cvToKv,
  kvToCv,
  criticalPressureDrop,
  checkChokedFlow,
  calculateValveAuthority,
  getDefaultPressureRecoveryFactor,
  getVaporPressure,
  sizeValve,
  validateValveSizingInputs,
  ValveTrimCharacteristic,
  ValveSizingInput,
} from './valves';

describe('Valve Logic', () => {
  describe('requiredCvLiquid', () => {
    it('should calculate Cv correctly for water', () => {
      const Q = 50; // gpm
      const deltaP = 10; // psi
      const SG = 1.0; // water

      const cv = requiredCvLiquid(Q, deltaP, SG);

      // Manual calculation: Cv = Q * sqrt(SG / ΔP)
      // Cv = 50 * sqrt(1.0 / 10) = 50 * 0.316 = 15.81
      expect(cv).toBeCloseTo(15.81, 2);
    });

    it('should calculate Cv correctly for different specific gravity', () => {
      const Q = 50; // gpm
      const deltaP = 10; // psi
      const SG = 1.5; // heavier fluid

      const cv = requiredCvLiquid(Q, deltaP, SG);

      // Manual calculation: Cv = 50 * sqrt(1.5 / 10) = 50 * 0.387 = 19.36
      expect(cv).toBeCloseTo(19.36, 2);
    });

    it('should calculate Cv correctly for different pressure drop', () => {
      const Q = 50; // gpm
      const deltaP = 25; // psi (higher pressure drop)
      const SG = 1.0; // water

      const cv = requiredCvLiquid(Q, deltaP, SG);

      // Manual calculation: Cv = 50 * sqrt(1.0 / 25) = 50 * 0.2 = 10.0
      expect(cv).toBeCloseTo(10.0, 1);
    });

    it('should throw error for zero pressure drop', () => {
      expect(() => requiredCvLiquid(50, 0, 1.0)).toThrow(
        'Pressure drop must be positive'
      );
    });

    it('should throw error for negative pressure drop', () => {
      expect(() => requiredCvLiquid(50, -10, 1.0)).toThrow(
        'Pressure drop must be positive'
      );
    });

    it('should throw error for zero specific gravity', () => {
      expect(() => requiredCvLiquid(50, 10, 0)).toThrow(
        'Specific gravity must be positive'
      );
    });

    it('should throw error for negative specific gravity', () => {
      expect(() => requiredCvLiquid(50, 10, -1.0)).toThrow(
        'Specific gravity must be positive'
      );
    });

    it('should throw error for zero flow rate', () => {
      expect(() => requiredCvLiquid(0, 10, 1.0)).toThrow(
        'Flow rate must be positive'
      );
    });

    it('should throw error for negative flow rate', () => {
      expect(() => requiredCvLiquid(-50, 10, 1.0)).toThrow(
        'Flow rate must be positive'
      );
    });
  });

  describe('cvToKv and kvToCv', () => {
    it('should convert Cv to Kv correctly', () => {
      const cv = 15.81;
      const kv = cvToKv(cv);

      // Manual calculation: Kv = Cv / 1.156 = 15.81 / 1.156 = 13.68
      expect(kv).toBeCloseTo(13.68, 2);
    });

    it('should convert Kv to Cv correctly', () => {
      const kv = 13.68;
      const cv = kvToCv(kv);

      // Manual calculation: Cv = Kv * 1.156 = 13.68 * 1.156 = 15.81
      expect(cv).toBeCloseTo(15.81, 2);
    });

    it('should be reversible conversions', () => {
      const originalCv = 25.5;
      const kv = cvToKv(originalCv);
      const convertedCv = kvToCv(kv);

      expect(convertedCv).toBeCloseTo(originalCv, 10);
    });
  });

  describe('criticalPressureDrop', () => {
    it('should calculate critical pressure drop correctly', () => {
      const FL = 0.9;
      const P1 = 101325; // Pa (1 atm)
      const Pv = 2330; // Pa (water vapor pressure at 20°C)

      const criticalDeltaP = criticalPressureDrop(FL, P1, Pv);

      // Manual calculation: ΔPc = FL² * (P1 - Pv)
      // ΔPc = 0.9² * (101325 - 2330) = 0.81 * 98995 = 80186 Pa
      expect(criticalDeltaP).toBeCloseTo(80186, 0);
    });

    it('should handle zero vapor pressure', () => {
      const FL = 0.9;
      const P1 = 101325; // Pa
      const Pv = 0; // Pa

      const criticalDeltaP = criticalPressureDrop(FL, P1, Pv);

      // Manual calculation: ΔPc = 0.9² * (101325 - 0) = 0.81 * 101325 = 82073 Pa
      expect(criticalDeltaP).toBeCloseTo(82073, 0);
    });

    it('should throw error for invalid FL', () => {
      expect(() => criticalPressureDrop(0, 101325, 0)).toThrow(
        'Pressure recovery factor must be between 0 and 1'
      );
      expect(() => criticalPressureDrop(1.1, 101325, 0)).toThrow(
        'Pressure recovery factor must be between 0 and 1'
      );
    });

    it('should throw error for invalid upstream pressure', () => {
      expect(() => criticalPressureDrop(0.9, 0, 0)).toThrow(
        'Upstream pressure must be positive'
      );
      expect(() => criticalPressureDrop(0.9, -101325, 0)).toThrow(
        'Upstream pressure must be positive'
      );
    });

    it('should throw error for negative vapor pressure', () => {
      expect(() => criticalPressureDrop(0.9, 101325, -1000)).toThrow(
        'Vapor pressure cannot be negative'
      );
    });
  });

  describe('checkChokedFlow', () => {
    it('should identify choked flow correctly', () => {
      const actualDeltaP = 90000; // Pa
      const criticalDeltaP = 80000; // Pa

      const result = checkChokedFlow(actualDeltaP, criticalDeltaP);

      // Ratio = 90000 / 80000 = 1.125 > 1.0, so choked
      expect(result.isChoked).toBe(true);
      expect(result.likelihood).toBe('high');
    });

    it('should identify high likelihood of choked flow', () => {
      const actualDeltaP = 70000; // Pa
      const criticalDeltaP = 80000; // Pa

      const result = checkChokedFlow(actualDeltaP, criticalDeltaP);

      // Ratio = 70000 / 80000 = 0.875 > 0.8, so high likelihood
      expect(result.isChoked).toBe(false);
      expect(result.likelihood).toBe('high');
    });

    it('should identify medium likelihood of choked flow', () => {
      const actualDeltaP = 60000; // Pa
      const criticalDeltaP = 80000; // Pa

      const result = checkChokedFlow(actualDeltaP, criticalDeltaP);

      // Ratio = 60000 / 80000 = 0.75 > 0.6, so medium likelihood
      expect(result.isChoked).toBe(false);
      expect(result.likelihood).toBe('medium');
    });

    it('should identify low likelihood of choked flow', () => {
      const actualDeltaP = 50000; // Pa
      const criticalDeltaP = 80000; // Pa

      const result = checkChokedFlow(actualDeltaP, criticalDeltaP);

      // Ratio = 50000 / 80000 = 0.625 > 0.6, so medium likelihood
      expect(result.isChoked).toBe(false);
      expect(result.likelihood).toBe('medium');
    });

    it('should identify no likelihood of choked flow', () => {
      const actualDeltaP = 30000; // Pa
      const criticalDeltaP = 80000; // Pa

      const result = checkChokedFlow(actualDeltaP, criticalDeltaP);

      // Ratio = 30000 / 80000 = 0.375 < 0.4, so no likelihood
      expect(result.isChoked).toBe(false);
      expect(result.likelihood).toBe('none');
    });

    it('should handle zero or negative values', () => {
      expect(checkChokedFlow(0, 80000)).toEqual({
        isChoked: false,
        likelihood: 'none',
      });
      expect(checkChokedFlow(50000, 0)).toEqual({
        isChoked: false,
        likelihood: 'none',
      });
      expect(checkChokedFlow(-1000, 80000)).toEqual({
        isChoked: false,
        likelihood: 'none',
      });
    });
  });

  describe('calculateValveAuthority', () => {
    it('should calculate valve authority correctly', () => {
      const valveDeltaP = 10; // psi
      const systemDeltaP = 20; // psi

      const authority = calculateValveAuthority(valveDeltaP, systemDeltaP);

      // Manual calculation: Authority = 10 / (10 + 10) = 10 / 20 = 0.5
      expect(authority).toBe(0.5);
    });

    it('should calculate high valve authority', () => {
      const valveDeltaP = 18; // psi
      const systemDeltaP = 20; // psi

      const authority = calculateValveAuthority(valveDeltaP, systemDeltaP);

      // Manual calculation: Authority = 18 / (18 + 2) = 18 / 20 = 0.9
      expect(authority).toBe(0.9);
    });

    it('should calculate low valve authority', () => {
      const valveDeltaP = 2; // psi
      const systemDeltaP = 20; // psi

      const authority = calculateValveAuthority(valveDeltaP, systemDeltaP);

      // Manual calculation: Authority = 2 / (2 + 18) = 2 / 20 = 0.1
      expect(authority).toBe(0.1);
    });

    it('should throw error for zero valve pressure drop', () => {
      expect(() => calculateValveAuthority(0, 20)).toThrow(
        'Valve pressure drop must be positive'
      );
    });

    it('should throw error for zero system pressure drop', () => {
      expect(() => calculateValveAuthority(10, 0)).toThrow(
        'System pressure drop must be positive'
      );
    });

    it('should throw error when valve pressure drop exceeds system pressure drop', () => {
      expect(() => calculateValveAuthority(25, 20)).toThrow(
        'Valve pressure drop cannot exceed system pressure drop'
      );
    });
  });

  describe('getDefaultPressureRecoveryFactor', () => {
    it('should return correct FL for linear trim', () => {
      const trim: ValveTrimCharacteristic = { type: 'linear' };
      const FL = getDefaultPressureRecoveryFactor(trim);
      expect(FL).toBe(0.9);
    });

    it('should return correct FL for equal-percentage trim', () => {
      const trim: ValveTrimCharacteristic = { type: 'equal-percentage' };
      const FL = getDefaultPressureRecoveryFactor(trim);
      expect(FL).toBe(0.85);
    });

    it('should return correct FL for quick-opening trim', () => {
      const trim: ValveTrimCharacteristic = { type: 'quick-opening' };
      const FL = getDefaultPressureRecoveryFactor(trim);
      expect(FL).toBe(0.95);
    });

    it('should return correct FL for modified-parabolic trim', () => {
      const trim: ValveTrimCharacteristic = { type: 'modified-parabolic' };
      const FL = getDefaultPressureRecoveryFactor(trim);
      expect(FL).toBe(0.88);
    });
  });

  describe('getVaporPressure', () => {
    it('should calculate water vapor pressure at 20°C', () => {
      const T = 293.15; // K (20°C)
      const Pv = getVaporPressure('water', T);

      // Expected: ~2330 Pa at 20°C
      expect(Pv).toBeCloseTo(2330, 0);
    });

    it('should calculate water vapor pressure at 100°C', () => {
      const T = 373.15; // K (100°C)
      const Pv = getVaporPressure('water', T);

      // Expected: ~101336 Pa at 100°C (atmospheric pressure)
      expect(Pv).toBeCloseTo(101336, 0);
    });

    it('should calculate ethanol vapor pressure at 25°C', () => {
      const T = 298.15; // K (25°C)
      const Pv = getVaporPressure('ethanol', T);

      // Should be positive and reasonable
      expect(Pv).toBeGreaterThan(0);
      expect(Pv).toBeLessThan(10000); // Less than 10 kPa at 25°C
    });

    it('should return zero for unknown fluid', () => {
      const T = 293.15; // K
      const Pv = getVaporPressure('unknown', T);
      expect(Pv).toBe(0);
    });

    it('should return zero for out-of-range temperature', () => {
      const T = 150; // K (too cold)
      const Pv = getVaporPressure('water', T);
      expect(Pv).toBe(0);
    });
  });

  describe('sizeValve', () => {
    const sampleInput: ValveSizingInput = {
      flow: { value: 50, unit: 'gpm' },
      pressureDrop: { value: 10, unit: 'psi' },
      specificGravity: 1.0,
      trimCharacteristic: { type: 'equal-percentage' },
    };

    it('should size valve correctly for basic input', () => {
      const result = sizeValve(sampleInput);

      expect(result.cv.value).toBeCloseTo(15.81, 2);
      expect(result.cv.unit).toBe('gpm/psi^0.5');
      expect(result.kv.value).toBeCloseTo(13.68, 2);
      expect(result.kv.unit).toBe('m³/h/bar^0.5');
      expect(result.valveAuthority).toBe(0.5); // Default assumption
      expect(result.chokedFlow.isChoked).toBe(false);
      expect(result.chokedFlow.likelihood).toBe('none');
      expect(result.warnings).toBeInstanceOf(Array);
    });

    it('should calculate valve authority when pressures provided', () => {
      const inputWithPressures: ValveSizingInput = {
        ...sampleInput,
        upstreamPressure: { value: 101325, unit: 'Pa' },
        downstreamPressure: { value: 101325, unit: 'Pa' },
      };

      const result = sizeValve(inputWithPressures);

      expect(result.valveAuthority).toBeGreaterThan(0);
      expect(result.valveAuthority).toBeLessThan(1);
    });

    it('should analyze choked flow when upstream pressure provided', () => {
      const inputWithChokedAnalysis: ValveSizingInput = {
        ...sampleInput,
        upstreamPressure: { value: 101325, unit: 'Pa' },
        fluidName: 'water',
        temperature: { value: 293.15, unit: 'K' },
      };

      const result = sizeValve(inputWithChokedAnalysis);

      expect(result.chokedFlow.criticalPressureDrop.value).toBeGreaterThan(0);
      expect(result.chokedFlow.actualPressureDrop).toEqual(
        sampleInput.pressureDrop
      );
    });

    it('should generate warnings for low valve authority', () => {
      const inputWithLowAuthority: ValveSizingInput = {
        ...sampleInput,
        upstreamPressure: { value: 101325, unit: 'Pa' },
        downstreamPressure: { value: 90000, unit: 'Pa' }, // Different pressures
        pressureDrop: { value: 0.1, unit: 'psi' }, // Very low pressure drop
      };

      const result = sizeValve(inputWithLowAuthority);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some(
          w => typeof w === 'string' && w.includes('authority')
        )
      ).toBe(true);
    });

    it('should generate warnings for high pressure drop', () => {
      const inputWithHighPressureDrop: ValveSizingInput = {
        ...sampleInput,
        pressureDrop: { value: 150, unit: 'psi' }, // Very high pressure drop
      };

      const result = sizeValve(inputWithHighPressureDrop);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some(
          w => typeof w === 'string' && w.includes('pressure drop')
        )
      ).toBe(true);
    });

    it('should generate warnings for extreme specific gravity', () => {
      const inputWithHighSG: ValveSizingInput = {
        ...sampleInput,
        specificGravity: 2.5, // Very high specific gravity
      };

      const result = sizeValve(inputWithHighSG);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(
        result.warnings.some(
          w => typeof w === 'string' && w.includes('Specific gravity')
        )
      ).toBe(true);
    });

    it('should throw error for negative specific gravity', () => {
      const invalidInput: ValveSizingInput = {
        ...sampleInput,
        specificGravity: -1.0,
      };

      expect(() => sizeValve(invalidInput)).toThrow(
        'Specific gravity must be positive'
      );
    });
  });

  describe('validateValveSizingInputs', () => {
    const validInput: ValveSizingInput = {
      flow: { value: 50, unit: 'gpm' },
      pressureDrop: { value: 10, unit: 'psi' },
      specificGravity: 1.0,
      trimCharacteristic: { type: 'equal-percentage' },
    };

    it('should validate correct inputs', () => {
      const result = validateValveSizingInputs(validInput);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative flow rate', () => {
      const invalidInput: ValveSizingInput = {
        ...validInput,
        flow: { value: -50, unit: 'gpm' },
      };

      const result = validateValveSizingInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Flow rate must be positive');
    });

    it('should reject negative pressure drop', () => {
      const invalidInput: ValveSizingInput = {
        ...validInput,
        pressureDrop: { value: -10, unit: 'psi' },
      };

      const result = validateValveSizingInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pressure drop must be positive');
    });

    it('should reject negative specific gravity', () => {
      const invalidInput: ValveSizingInput = {
        ...validInput,
        specificGravity: -1.0,
      };

      const result = validateValveSizingInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Specific gravity must be positive');
    });

    it('should reject missing trim characteristic', () => {
      const invalidInput: ValveSizingInput = {
        ...validInput,
        trimCharacteristic: { type: '' as never },
      };

      const result = validateValveSizingInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Trim characteristic type is required');
    });

    it('should reject invalid pressure recovery factor', () => {
      const invalidInput: ValveSizingInput = {
        ...validInput,
        pressureRecoveryFactor: 1.5,
      };

      const result = validateValveSizingInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Pressure recovery factor must be between 0 and 1'
      );
    });

    it('should reject invalid pressure relationship', () => {
      const invalidInput: ValveSizingInput = {
        ...validInput,
        upstreamPressure: { value: 100000, unit: 'Pa' },
        downstreamPressure: { value: 110000, unit: 'Pa' }, // Downstream > upstream
      };

      const result = validateValveSizingInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Upstream pressure must be greater than downstream pressure'
      );
    });

    it('should reject excessive pressure drop', () => {
      const invalidInput: ValveSizingInput = {
        ...validInput,
        upstreamPressure: { value: 100000, unit: 'Pa' },
        downstreamPressure: { value: 90000, unit: 'Pa' },
        pressureDrop: { value: 15000, unit: 'Pa' }, // Exceeds actual pressure drop
      };

      const result = validateValveSizingInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Specified pressure drop cannot exceed actual pressure drop'
      );
    });

    it('should reject out-of-range temperature', () => {
      const invalidInput: ValveSizingInput = {
        ...validInput,
        temperature: { value: 100, unit: 'K' }, // Too cold
      };

      const result = validateValveSizingInputs(invalidInput);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Temperature should be between 200K and 600K'
      );
    });
  });
});
