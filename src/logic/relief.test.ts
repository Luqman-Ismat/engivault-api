import { describe, it, expect } from 'vitest';
import {
  liquidReliefArea,
  criticalPressureRatio,
  backPressureCorrection,
  gasReliefArea,
  sizeReliefValve,
  validateReliefValveInputs,
  type ReliefValveInput,
} from './relief';

describe('Relief Valve Sizing Logic', () => {
  describe('liquidReliefArea', () => {
    it('should calculate liquid relief area correctly', () => {
      const Q = 100; // gpm
      const deltaP = 50; // psi
      const SG = 1.0;
      const Kd = 0.65;

      const area = liquidReliefArea(Q, deltaP, SG, Kd);

      // Expected: A = Q * sqrt(SG / ΔP) / (K_d * 38)
      // A = 100 * sqrt(1.0 / 50) / (0.65 * 38) = 100 * 0.1414 / 24.7 = 0.573
      expect(area).toBeCloseTo(0.573, 3);
    });

    it('should handle different specific gravities', () => {
      const Q = 50; // gpm
      const deltaP = 25; // psi
      const Kd = 0.65;

      const areaWater = liquidReliefArea(Q, deltaP, 1.0, Kd);
      const areaHeavy = liquidReliefArea(Q, deltaP, 1.5, Kd);

      // Higher SG should result in larger area
      expect(areaHeavy).toBeGreaterThan(areaWater);
      expect(areaHeavy / areaWater).toBeCloseTo(Math.sqrt(1.5), 3);
    });

    it('should handle different discharge coefficients', () => {
      const Q = 75; // gpm
      const deltaP = 30; // psi
      const SG = 1.0;

      const areaHighKd = liquidReliefArea(Q, deltaP, SG, 0.8);
      const areaLowKd = liquidReliefArea(Q, deltaP, SG, 0.5);

      // Higher Kd should result in smaller area
      expect(areaLowKd).toBeGreaterThan(areaHighKd);
      expect(areaLowKd / areaHighKd).toBeCloseTo(0.8 / 0.5, 3);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => liquidReliefArea(0, 50, 1.0, 0.65)).toThrow(
        'All parameters must be positive'
      );
      expect(() => liquidReliefArea(100, -10, 1.0, 0.65)).toThrow(
        'All parameters must be positive'
      );
      expect(() => liquidReliefArea(100, 50, 0, 0.65)).toThrow(
        'All parameters must be positive'
      );
      expect(() => liquidReliefArea(100, 50, 1.0, 0)).toThrow(
        'All parameters must be positive'
      );
    });
  });

  describe('criticalPressureRatio', () => {
    it('should calculate critical pressure ratio for air', () => {
      const ratio = criticalPressureRatio(1.4);

      // For k = 1.4, critical ratio = (2/2.4)^(1.4/0.4) = 0.833^3.5 = 0.528
      expect(ratio).toBeCloseTo(0.528, 3);
    });

    it('should calculate critical pressure ratio for different gases', () => {
      const ratioMethane = criticalPressureRatio(1.32); // Methane
      const ratioHelium = criticalPressureRatio(1.67); // Helium

      expect(ratioMethane).toBeCloseTo(0.544, 3);
      expect(ratioHelium).toBeCloseTo(0.487, 3);
    });

    it('should throw error for invalid specific heat ratio', () => {
      expect(() => criticalPressureRatio(1.0)).toThrow(
        'Specific heat ratio must be greater than 1'
      );
      expect(() => criticalPressureRatio(0.8)).toThrow(
        'Specific heat ratio must be greater than 1'
      );
    });
  });

  describe('backPressureCorrection', () => {
    it('should return 1.0 for choked flow', () => {
      const k = 1.4;
      const criticalRatio = criticalPressureRatio(k);

      // Test choked flow (back pressure ratio <= critical ratio)
      const Kb = backPressureCorrection(criticalRatio * 0.5, k);
      expect(Kb).toBe(1.0);

      const KbCritical = backPressureCorrection(criticalRatio, k);
      expect(KbCritical).toBe(1.0);
    });

    it('should calculate correction factor for non-choked flow', () => {
      const k = 1.4;
      const backPressureRatio = 0.8; // Above critical ratio

      const Kb = backPressureCorrection(backPressureRatio, k);

      // Should be less than 1.0 for non-choked flow
      expect(Kb).toBeLessThan(1.0);
      expect(Kb).toBeGreaterThan(0.5); // Minimum Kb
    });

    it('should handle different specific heat ratios', () => {
      const backPressureRatio = 0.7;

      const KbAir = backPressureCorrection(backPressureRatio, 1.4);
      const KbMethane = backPressureCorrection(backPressureRatio, 1.32);

      expect(KbAir).toBeGreaterThan(0);
      expect(KbMethane).toBeGreaterThan(0);
    });

    it('should throw error for invalid back pressure ratio', () => {
      expect(() => backPressureCorrection(-0.1, 1.4)).toThrow(
        'Back pressure ratio must be between 0 and 1'
      );
      expect(() => backPressureCorrection(1.1, 1.4)).toThrow(
        'Back pressure ratio must be between 0 and 1'
      );
    });
  });

  describe('gasReliefArea', () => {
    it('should calculate choked gas relief area', () => {
      const Q = 1000; // scfm
      const upstreamPressure = 100; // psia
      const backPressure = 50; // psia (below critical)
      const temperature = 530; // R (70°F)
      const molecularWeight = 29; // Air
      const k = 1.4;
      const Kd = 0.65;

      const result = gasReliefArea(
        Q,
        upstreamPressure,
        backPressure,
        temperature,
        molecularWeight,
        k,
        Kd
      );

      expect(result.regime).toBe('choked-gas');
      expect(result.area).toBeGreaterThan(0);
      expect(result.criticalRatio).toBeCloseTo(0.528, 3);
      expect(result.Kb).toBe(1.0);
    });

    it('should calculate non-choked gas relief area', () => {
      const Q = 500; // scfm
      const upstreamPressure = 100; // psia
      const backPressure = 80; // psia (above critical)
      const temperature = 530; // R
      const molecularWeight = 29; // Air
      const k = 1.4;
      const Kd = 0.65;

      const result = gasReliefArea(
        Q,
        upstreamPressure,
        backPressure,
        temperature,
        molecularWeight,
        k,
        Kd
      );

      expect(result.regime).toBe('non-choked-gas');
      expect(result.area).toBeGreaterThan(0);
      expect(result.Kb).toBeLessThan(1.0);
    });

    it('should handle different molecular weights', () => {
      const Q = 1000; // scfm
      const upstreamPressure = 100; // psia
      const backPressure = 50; // psia
      const temperature = 530; // R
      const k = 1.4;
      const Kd = 0.65;

      const resultAir = gasReliefArea(
        Q,
        upstreamPressure,
        backPressure,
        temperature,
        29,
        k,
        Kd
      );
      const resultMethane = gasReliefArea(
        Q,
        upstreamPressure,
        backPressure,
        temperature,
        16,
        k,
        Kd
      );

      // Lower molecular weight should result in smaller area
      expect(resultMethane.area).toBeLessThan(resultAir.area);
    });

    it('should handle different temperatures', () => {
      const Q = 1000; // scfm
      const upstreamPressure = 100; // psia
      const backPressure = 50; // psia
      const molecularWeight = 29; // Air
      const k = 1.4;
      const Kd = 0.65;

      const resultCold = gasReliefArea(
        Q,
        upstreamPressure,
        backPressure,
        460,
        molecularWeight,
        k,
        Kd
      );
      const resultHot = gasReliefArea(
        Q,
        upstreamPressure,
        backPressure,
        600,
        molecularWeight,
        k,
        Kd
      );

      // Higher temperature should result in larger area
      expect(resultHot.area).toBeGreaterThan(resultCold.area);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => gasReliefArea(0, 100, 50, 530, 29, 1.4, 0.65)).toThrow(
        'All parameters must be positive'
      );
      expect(() => gasReliefArea(1000, 0, 50, 530, 29, 1.4, 0.65)).toThrow(
        'All parameters must be positive'
      );
      expect(() => gasReliefArea(1000, 100, 50, 0, 29, 1.4, 0.65)).toThrow(
        'All parameters must be positive'
      );
      expect(() => gasReliefArea(1000, 100, 50, 530, 0, 1.4, 0.65)).toThrow(
        'All parameters must be positive'
      );
      expect(() => gasReliefArea(1000, 100, 120, 530, 29, 1.4, 0.65)).toThrow(
        'Back pressure must be less than upstream pressure'
      );
    });
  });

  describe('sizeReliefValve', () => {
    it('should size liquid relief valve', () => {
      const input: ReliefValveInput = {
        fluidType: 'liquid',
        flow: { value: 100, unit: 'gpm' },
        pressureDrop: { value: 50, unit: 'psi' },
        specificGravity: 1.0,
        dischargeCoefficient: 0.65,
      };

      const result = sizeReliefValve(input);

      expect(result.requiredArea.unit).toBe('in²');
      expect(result.requiredArea.value).toBeGreaterThan(0);
      expect(result.flowRegime).toBe('liquid');
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.metadata.calculations.assumptions).toContain(
        'Incompressible liquid flow'
      );
    });

    it('should size choked gas relief valve', () => {
      const input: ReliefValveInput = {
        fluidType: 'gas',
        flow: { value: 1000, unit: 'scfm' },
        pressureDrop: { value: 100, unit: 'psia' },
        molecularWeight: 29,
        temperature: { value: 530, unit: 'R' },
        backPressure: { value: 50, unit: 'psia' },
        dischargeCoefficient: 0.65,
      };

      const result = sizeReliefValve(input);

      expect(result.requiredArea.unit).toBe('in²');
      expect(result.requiredArea.value).toBeGreaterThan(0);
      expect(result.flowRegime).toBe('choked-gas');
      expect(result.criticalPressureRatio).toBeCloseTo(0.528, 3);
      expect(result.backPressureCorrection).toBe(1.0);
      expect(result.metadata.calculations.assumptions).toContain(
        'Isentropic gas flow'
      );
    });

    it('should size non-choked gas relief valve', () => {
      const input: ReliefValveInput = {
        fluidType: 'gas',
        flow: { value: 500, unit: 'scfm' },
        pressureDrop: { value: 100, unit: 'psia' },
        molecularWeight: 29,
        temperature: { value: 530, unit: 'R' },
        backPressure: { value: 80, unit: 'psia' },
        dischargeCoefficient: 0.65,
      };

      const result = sizeReliefValve(input);

      expect(result.requiredArea.unit).toBe('in²');
      expect(result.requiredArea.value).toBeGreaterThan(0);
      expect(result.flowRegime).toBe('non-choked-gas');
      expect(result.backPressureCorrection).toBeLessThan(1.0);
    });

    it('should generate warnings for extreme conditions', () => {
      const input: ReliefValveInput = {
        fluidType: 'liquid',
        flow: { value: 1000, unit: 'gpm' },
        pressureDrop: { value: 0.5, unit: 'psi' }, // Low pressure drop
        specificGravity: 2.5, // High SG
        dischargeCoefficient: 0.3, // Low Kd
      };

      const result = sizeReliefValve(input);

      expect(
        result.warnings.some(
          w => typeof w === 'string' && w.includes('Low pressure drop')
        )
      ).toBe(true);
      expect(
        result.warnings.some(
          w => typeof w === 'string' && w.includes('Specific gravity above 2.0')
        )
      ).toBe(true);
      expect(
        result.warnings.some(
          w => typeof w === 'string' && w.includes('Low discharge coefficient')
        )
      ).toBe(true);
    });

    it('should throw error for missing gas parameters', () => {
      const input: ReliefValveInput = {
        fluidType: 'gas',
        flow: { value: 1000, unit: 'scfm' },
        pressureDrop: { value: 100, unit: 'psia' },
        // Missing required gas parameters
      };

      expect(() => sizeReliefValve(input)).toThrow(
        'Molecular weight must be provided and positive for gas flow'
      );
    });

    it('should throw error for invalid pressure relationship', () => {
      const input: ReliefValveInput = {
        fluidType: 'gas',
        flow: { value: 1000, unit: 'scfm' },
        pressureDrop: { value: 100, unit: 'psia' },
        molecularWeight: 29,
        temperature: { value: 530, unit: 'R' },
        backPressure: { value: 120, unit: 'psia' }, // Higher than upstream
      };

      expect(() => sizeReliefValve(input)).toThrow(
        'Back pressure must be less than upstream pressure'
      );
    });

    it('should handle custom coefficients', () => {
      const input: ReliefValveInput = {
        fluidType: 'liquid',
        flow: { value: 100, unit: 'gpm' },
        pressureDrop: { value: 50, unit: 'psi' },
        specificGravity: 1.0,
        dischargeCoefficient: 0.8,
        backPressureCorrection: 0.9,
        compressibilityFactor: 0.95,
        specificHeatRatio: 1.3,
      };

      const result = sizeReliefValve(input);

      expect(result.requiredArea.value).toBeGreaterThan(0);
      expect(result.metadata.calculations.dischargeCoefficient).toBe(0.8);
    });
  });

  describe('validateReliefValveInputs', () => {
    it('should validate valid liquid input', () => {
      const input: ReliefValveInput = {
        fluidType: 'liquid',
        flow: { value: 100, unit: 'gpm' },
        pressureDrop: { value: 50, unit: 'psi' },
        specificGravity: 1.0,
      };

      const result = validateReliefValveInputs(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid gas input', () => {
      const input: ReliefValveInput = {
        fluidType: 'gas',
        flow: { value: 1000, unit: 'scfm' },
        pressureDrop: { value: 100, unit: 'psia' },
        molecularWeight: 29,
        temperature: { value: 530, unit: 'R' },
        backPressure: { value: 50, unit: 'psia' },
      };

      const result = validateReliefValveInputs(input);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid flow rate', () => {
      const input: ReliefValveInput = {
        fluidType: 'liquid',
        flow: { value: 0, unit: 'gpm' },
        pressureDrop: { value: 50, unit: 'psi' },
      };

      const result = validateReliefValveInputs(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Flow rate must be positive');
    });

    it('should reject invalid fluid type', () => {
      const input = {
        fluidType: 'gas',
        flow: { value: 1000, unit: 'scfm' },
        pressureDrop: { value: 50, unit: 'psi' },
      } as ReliefValveInput;

      const result = validateReliefValveInputs(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Fluid type must be either "liquid" or "gas"'
      );
    });

    it('should reject missing gas parameters', () => {
      const input: ReliefValveInput = {
        fluidType: 'gas',
        flow: { value: 1000, unit: 'scfm' },
        pressureDrop: { value: 100, unit: 'psia' },
        // Missing required parameters
      };

      const result = validateReliefValveInputs(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Molecular weight must be provided and positive for gas flow'
      );
      expect(result.errors).toContain(
        'Temperature must be provided for gas flow'
      );
      expect(result.errors).toContain(
        'Back pressure must be provided for gas flow'
      );
    });

    it('should reject invalid pressure relationship', () => {
      const input: ReliefValveInput = {
        fluidType: 'gas',
        flow: { value: 1000, unit: 'scfm' },
        pressureDrop: { value: 100, unit: 'psia' },
        molecularWeight: 29,
        temperature: { value: 530, unit: 'R' },
        backPressure: { value: 120, unit: 'psia' }, // Higher than upstream
      };

      const result = validateReliefValveInputs(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Back pressure must be less than upstream pressure'
      );
    });

    it('should reject invalid coefficients', () => {
      const input: ReliefValveInput = {
        fluidType: 'liquid',
        flow: { value: 100, unit: 'gpm' },
        pressureDrop: { value: 50, unit: 'psi' },
        dischargeCoefficient: 1.5, // Invalid
        backPressureCorrection: -0.1, // Invalid
        compressibilityFactor: 0, // Invalid
        specificHeatRatio: 0.8, // Invalid
      };

      const result = validateReliefValveInputs(input);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Discharge coefficient must be between 0 and 1'
      );
      expect(result.errors).toContain(
        'Back pressure correction factor must be between 0 and 1'
      );
      expect(result.errors).toContain(
        'Compressibility factor must be positive'
      );
      expect(result.errors).toContain(
        'Specific heat ratio must be greater than 1'
      );
    });
  });
});
