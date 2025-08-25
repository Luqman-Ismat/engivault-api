import { describe, it, expect } from 'vitest';
import {
  getKFactor,
  getKFactorsForSize,
  getAvailableFittingTypes,
  getAvailableNominalSizes,
  getAvailableSchedules,
  GENERIC_K_FACTORS,
  VALVE_K_FACTORS,
} from './k-factors';

describe('K-Factors Data', () => {
  describe('getKFactor', () => {
    it('should return K-factor for generic fitting', () => {
      const kFactor = getKFactor('elbow-90-long-radius');

      expect(kFactor).not.toBeNull();
      expect(kFactor?.type).toBe('elbow-90-long-radius');
      expect(kFactor?.k).toBe(0.3);
      expect(kFactor?.description).toBe('90° Long Radius Elbow');
    });

    it('should return K-factor for size-specific valve', () => {
      const kFactor = getKFactor('globe-valve', '2', '40');

      expect(kFactor).not.toBeNull();
      expect(kFactor?.type).toBe('globe-valve');
      expect(kFactor?.k).toBe(6.0);
      expect(kFactor?.description).toBe('Globe Valve - 2" Schedule 40');
    });

    it('should return null for unknown fitting', () => {
      const kFactor = getKFactor('unknown-fitting');

      expect(kFactor).toBeNull();
    });

    it('should return null for unknown size/schedule combination', () => {
      const kFactor = getKFactor('globe-valve', '999', '999');

      expect(kFactor).toBeNull();
    });

    it('should fall back to generic K-factor when size/schedule not found', () => {
      const kFactor = getKFactor('elbow-90-long-radius', '999', '999');

      expect(kFactor).not.toBeNull();
      expect(kFactor?.type).toBe('elbow-90-long-radius');
      expect(kFactor?.k).toBe(0.3);
    });
  });

  describe('getKFactorsForSize', () => {
    it('should return all K-factors for a specific size and schedule', () => {
      const kFactors = getKFactorsForSize('2', '40');

      expect(kFactors).toHaveProperty('elbow-90-long-radius');
      expect(kFactors).toHaveProperty('globe-valve');
      expect(kFactors).toHaveProperty('gate-valve');
      expect(kFactors['globe-valve'].k).toBe(6.0);
      expect(kFactors['gate-valve'].k).toBe(0.15);
    });

    it('should include generic K-factors', () => {
      const kFactors = getKFactorsForSize('2', '40');

      expect(kFactors['elbow-90-long-radius'].k).toBe(0.3);
      expect(kFactors['tee-through'].k).toBe(0.2);
      expect(kFactors['entrance-sharp'].k).toBe(0.5);
    });

    it('should handle unknown size/schedule', () => {
      const kFactors = getKFactorsForSize('999', '999');

      expect(kFactors).toHaveProperty('elbow-90-long-radius');
      expect(kFactors).toHaveProperty('tee-through');
      expect(Object.keys(kFactors)).toHaveLength(
        Object.keys(GENERIC_K_FACTORS).length
      );
    });
  });

  describe('getAvailableFittingTypes', () => {
    it('should return all available fitting types', () => {
      const fittingTypes = getAvailableFittingTypes();

      expect(fittingTypes).toContain('elbow-90-long-radius');
      expect(fittingTypes).toContain('tee-through');
      expect(fittingTypes).toContain('globe-valve');
      expect(fittingTypes).toContain('gate-valve');
      expect(fittingTypes).toContain('ball-valve');
      expect(fittingTypes).toContain('check-valve-swing');
    });

    it('should include all generic fitting types', () => {
      const fittingTypes = getAvailableFittingTypes();
      const genericTypes = Object.keys(GENERIC_K_FACTORS);

      genericTypes.forEach(type => {
        expect(fittingTypes).toContain(type);
      });
    });

    it('should include all valve types', () => {
      const fittingTypes = getAvailableFittingTypes();

      expect(fittingTypes).toContain('globe-valve');
      expect(fittingTypes).toContain('gate-valve');
      expect(fittingTypes).toContain('ball-valve');
      expect(fittingTypes).toContain('check-valve-swing');
    });
  });

  describe('getAvailableNominalSizes', () => {
    it('should return all available nominal sizes', () => {
      const sizes = getAvailableNominalSizes();

      expect(sizes).toContain('0.5');
      expect(sizes).toContain('1');
      expect(sizes).toContain('2');
      expect(sizes).toContain('4');
      expect(sizes).toContain('6');
      expect(sizes).toContain('8');
      expect(sizes).toContain('10');
      expect(sizes).toContain('12');
    });

    it('should return all sizes from VALVE_K_FACTORS', () => {
      const sizes = getAvailableNominalSizes();
      const expectedSizes = Object.keys(VALVE_K_FACTORS);

      expect(sizes).toEqual(expectedSizes);
    });
  });

  describe('getAvailableSchedules', () => {
    it('should return schedules for existing size', () => {
      const schedules = getAvailableSchedules('2');

      expect(schedules).toContain('40');
      expect(schedules).toContain('80');
    });

    it('should return empty array for unknown size', () => {
      const schedules = getAvailableSchedules('999');

      expect(schedules).toEqual([]);
    });

    it('should return correct schedules for different sizes', () => {
      const schedules1 = getAvailableSchedules('1');
      const schedules2 = getAvailableSchedules('4');

      expect(schedules1).toContain('40');
      expect(schedules1).toContain('80');
      expect(schedules2).toContain('40');
      expect(schedules2).not.toContain('80'); // 4" only has schedule 40
    });
  });

  describe('GENERIC_K_FACTORS', () => {
    it('should contain common fitting types', () => {
      expect(GENERIC_K_FACTORS).toHaveProperty('elbow-90-long-radius');
      expect(GENERIC_K_FACTORS).toHaveProperty('elbow-90-standard');
      expect(GENERIC_K_FACTORS).toHaveProperty('elbow-90-short-radius');
      expect(GENERIC_K_FACTORS).toHaveProperty('elbow-45');
      expect(GENERIC_K_FACTORS).toHaveProperty('tee-through');
      expect(GENERIC_K_FACTORS).toHaveProperty('tee-branch');
      expect(GENERIC_K_FACTORS).toHaveProperty('entrance-sharp');
      expect(GENERIC_K_FACTORS).toHaveProperty('exit');
    });

    it('should have reasonable K-factor values', () => {
      expect(GENERIC_K_FACTORS['elbow-90-long-radius'].k).toBe(0.3);
      expect(GENERIC_K_FACTORS['elbow-90-short-radius'].k).toBe(0.5);
      expect(GENERIC_K_FACTORS['tee-branch'].k).toBe(1.0);
      expect(GENERIC_K_FACTORS['entrance-rounded'].k).toBe(0.1);
      expect(GENERIC_K_FACTORS['exit'].k).toBe(1.0);
    });

    it('should have proper descriptions', () => {
      expect(GENERIC_K_FACTORS['elbow-90-long-radius'].description).toBe(
        '90° Long Radius Elbow'
      );
      expect(GENERIC_K_FACTORS['tee-through'].description).toBe(
        'Tee - Through Flow'
      );
      expect(GENERIC_K_FACTORS['entrance-sharp'].description).toBe(
        'Sharp Entrance'
      );
    });
  });

  describe('VALVE_K_FACTORS', () => {
    it('should contain valve types for different sizes', () => {
      expect(VALVE_K_FACTORS['2']['40']).toHaveProperty('globe-valve');
      expect(VALVE_K_FACTORS['2']['40']).toHaveProperty('gate-valve');
      expect(VALVE_K_FACTORS['1']['40']).toHaveProperty('globe-valve');
      expect(VALVE_K_FACTORS['1']['40']).toHaveProperty('gate-valve');
    });

    it('should have consistent K-factors across sizes', () => {
      // Globe valves should have consistent K-factor across sizes
      expect(VALVE_K_FACTORS['1']['40']['globe-valve'].k).toBe(6.0);
      expect(VALVE_K_FACTORS['2']['40']['globe-valve'].k).toBe(6.0);
      expect(VALVE_K_FACTORS['4']['40']['globe-valve'].k).toBe(6.0);

      // Gate valves should have consistent K-factor across sizes
      expect(VALVE_K_FACTORS['1']['40']['gate-valve'].k).toBe(0.15);
      expect(VALVE_K_FACTORS['2']['40']['gate-valve'].k).toBe(0.15);
      expect(VALVE_K_FACTORS['4']['40']['gate-valve'].k).toBe(0.15);
    });

    it('should have proper descriptions with size information', () => {
      expect(VALVE_K_FACTORS['2']['40']['globe-valve'].description).toBe(
        'Globe Valve - 2" Schedule 40'
      );
      expect(VALVE_K_FACTORS['1']['80']['gate-valve'].description).toBe(
        'Gate Valve - 1" Schedule 80'
      );
    });

    it('should have different schedules for some sizes', () => {
      expect(VALVE_K_FACTORS['2']).toHaveProperty('40');
      expect(VALVE_K_FACTORS['2']).toHaveProperty('80');
      expect(VALVE_K_FACTORS['4']).toHaveProperty('40');
      expect(VALVE_K_FACTORS['4']).not.toHaveProperty('80'); // 4" only has schedule 40
    });
  });

  describe('K-factor validation', () => {
    it('should have positive K-factors', () => {
      // Check generic K-factors
      Object.values(GENERIC_K_FACTORS).forEach(kFactor => {
        expect(kFactor.k).toBeGreaterThan(0);
      });

      // Check valve K-factors
      Object.values(VALVE_K_FACTORS).forEach(sizeData => {
        Object.values(sizeData).forEach(scheduleData => {
          Object.values(scheduleData).forEach(kFactor => {
            expect(kFactor.k).toBeGreaterThan(0);
          });
        });
      });
    });

    it('should have reasonable K-factor ranges', () => {
      // Generic fittings should typically have K < 2
      Object.values(GENERIC_K_FACTORS).forEach(kFactor => {
        expect(kFactor.k).toBeLessThan(2);
      });

      // Valves can have higher K-factors
      Object.values(VALVE_K_FACTORS).forEach(sizeData => {
        Object.values(sizeData).forEach(scheduleData => {
          Object.values(scheduleData).forEach(kFactor => {
            expect(kFactor.k).toBeLessThan(10); // Reasonable upper limit
          });
        });
      });
    });

    it('should have unique fitting types', () => {
      const genericTypes = Object.keys(GENERIC_K_FACTORS);
      const uniqueTypes = new Set(genericTypes);

      expect(uniqueTypes.size).toBe(genericTypes.length);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string inputs', () => {
      const kFactor = getKFactor('', '', '');
      expect(kFactor).toBeNull();
    });

    it('should handle undefined inputs', () => {
      const kFactor = getKFactor('elbow-90-long-radius', undefined, undefined);
      expect(kFactor).not.toBeNull();
      expect(kFactor?.type).toBe('elbow-90-long-radius');
    });

    it('should handle case sensitivity', () => {
      const kFactor = getKFactor('ELBOW-90-LONG-RADIUS');
      expect(kFactor).toBeNull(); // Should be case sensitive
    });
  });
});
