/**
 * K-factors for minor losses in pipe fittings and valves
 * Based on standard engineering references and manufacturer data
 */

export interface KFactor {
  type: string;
  description: string;
  k: number;
  notes?: string;
}

export interface KFactorCatalog {
  [nominalSize: string]: {
    [schedule: string]: {
      [fittingType: string]: KFactor;
    };
  };
}

// Generic K-factors for common fittings (independent of size)
export const GENERIC_K_FACTORS: Record<string, KFactor> = {
  'elbow-90-long-radius': {
    type: 'elbow-90-long-radius',
    description: '90° Long Radius Elbow',
    k: 0.3,
    notes: 'Standard long radius elbow, R/D = 1.5',
  },
  'elbow-90-standard': {
    type: 'elbow-90-standard',
    description: '90° Standard Radius Elbow',
    k: 0.3,
    notes: 'Standard radius elbow, R/D = 1.0',
  },
  'elbow-90-short-radius': {
    type: 'elbow-90-short-radius',
    description: '90° Short Radius Elbow',
    k: 0.5,
    notes: 'Short radius elbow, R/D = 0.5',
  },
  'elbow-45': {
    type: 'elbow-45',
    description: '45° Elbow',
    k: 0.2,
    notes: 'Standard 45° elbow',
  },
  'tee-through': {
    type: 'tee-through',
    description: 'Tee - Through Flow',
    k: 0.2,
    notes: 'Flow through the run of a tee',
  },
  'tee-branch': {
    type: 'tee-branch',
    description: 'Tee - Branch Flow',
    k: 1.0,
    notes: 'Flow through the branch of a tee',
  },
  'tee-line': {
    type: 'tee-line',
    description: 'Tee - Line Flow',
    k: 0.9,
    notes: 'Flow from branch into the run',
  },
  reducer: {
    type: 'reducer',
    description: 'Sudden Contraction',
    k: 0.5,
    notes: 'Typical value, depends on area ratio',
  },
  enlargement: {
    type: 'enlargement',
    description: 'Sudden Expansion',
    k: 1.0,
    notes: 'Typical value, depends on area ratio',
  },
  'entrance-sharp': {
    type: 'entrance-sharp',
    description: 'Sharp Entrance',
    k: 0.5,
    notes: 'Sharp-edged entrance to pipe',
  },
  'entrance-rounded': {
    type: 'entrance-rounded',
    description: 'Rounded Entrance',
    k: 0.1,
    notes: 'Well-rounded entrance',
  },
  exit: {
    type: 'exit',
    description: 'Pipe Exit',
    k: 1.0,
    notes: 'Exit from pipe to reservoir',
  },
};

// Size-specific K-factors for valves
export const VALVE_K_FACTORS: KFactorCatalog = {
  '0.5': {
    '40': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 1/2" Schedule 40',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 1/2" Schedule 40',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
      'ball-valve': {
        type: 'ball-valve',
        description: 'Ball Valve - 1/2" Schedule 40',
        k: 0.05,
        notes: 'Fully open ball valve',
      },
      'check-valve-swing': {
        type: 'check-valve-swing',
        description: 'Swing Check Valve - 1/2" Schedule 40',
        k: 2.5,
        notes: 'Swing check valve',
      },
    },
    '80': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 1/2" Schedule 80',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 1/2" Schedule 80',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
  },
  '0.75': {
    '40': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 3/4" Schedule 40',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 3/4" Schedule 40',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
  },
  '1': {
    '40': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 1" Schedule 40',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 1" Schedule 40',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
    '80': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 1" Schedule 80',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 1" Schedule 80',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
  },
  '1.5': {
    '40': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 1.5" Schedule 40',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 1.5" Schedule 40',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
  },
  '2': {
    '40': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 2" Schedule 40',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 2" Schedule 40',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
    '80': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 2" Schedule 80',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 2" Schedule 80',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
  },
  '3': {
    '40': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 3" Schedule 40',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 3" Schedule 40',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
  },
  '4': {
    '40': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 4" Schedule 40',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 4" Schedule 40',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
  },
  '6': {
    '40': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 6" Schedule 40',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 6" Schedule 40',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
  },
  '8': {
    '40': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 8" Schedule 40',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 8" Schedule 40',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
  },
  '10': {
    '40': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 10" Schedule 40',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 10" Schedule 40',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
  },
  '12': {
    '40': {
      'globe-valve': {
        type: 'globe-valve',
        description: 'Globe Valve - 12" Schedule 40',
        k: 6.0,
        notes: 'Fully open globe valve',
      },
      'gate-valve': {
        type: 'gate-valve',
        description: 'Gate Valve - 12" Schedule 40',
        k: 0.15,
        notes: 'Fully open gate valve',
      },
    },
  },
};

/**
 * Get K-factor for a specific fitting type, size, and schedule
 * @param type - Fitting type (e.g., 'globe-valve', 'elbow-90-long-radius')
 * @param nominalSize - Nominal pipe size (e.g., '2', '4')
 * @param schedule - Pipe schedule (e.g., '40', '80')
 * @returns K-factor or null if not found
 */
export function getKFactor(
  type: string,
  nominalSize?: string,
  schedule?: string
): KFactor | null {
  // First check size-specific valve catalog
  if (
    nominalSize &&
    schedule &&
    VALVE_K_FACTORS[nominalSize]?.[schedule]?.[type]
  ) {
    return VALVE_K_FACTORS[nominalSize][schedule][type];
  }

  // Then check generic K-factors
  if (GENERIC_K_FACTORS[type]) {
    return GENERIC_K_FACTORS[type];
  }

  return null;
}

/**
 * Get all available K-factors for a given size and schedule
 * @param nominalSize - Nominal pipe size
 * @param schedule - Pipe schedule
 * @returns Object with all available K-factors
 */
export function getKFactorsForSize(
  nominalSize: string,
  schedule: string
): Record<string, KFactor> {
  const sizeFactors = VALVE_K_FACTORS[nominalSize]?.[schedule] || {};
  return { ...GENERIC_K_FACTORS, ...sizeFactors };
}

/**
 * Get all available fitting types
 * @returns Array of all available fitting types
 */
export function getAvailableFittingTypes(): string[] {
  const genericTypes = Object.keys(GENERIC_K_FACTORS);
  const valveTypes = new Set<string>();

  // Collect all valve types from the catalog
  Object.values(VALVE_K_FACTORS).forEach(sizeData => {
    Object.values(sizeData).forEach(scheduleData => {
      Object.keys(scheduleData).forEach(type => {
        valveTypes.add(type);
      });
    });
  });

  return [...genericTypes, ...Array.from(valveTypes)];
}

/**
 * Get available nominal sizes
 * @returns Array of available nominal sizes
 */
export function getAvailableNominalSizes(): string[] {
  return Object.keys(VALVE_K_FACTORS);
}

/**
 * Get available schedules for a given nominal size
 * @param nominalSize - Nominal pipe size
 * @returns Array of available schedules
 */
export function getAvailableSchedules(nominalSize: string): string[] {
  return Object.keys(VALVE_K_FACTORS[nominalSize] || {});
}
