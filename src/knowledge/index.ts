// Knowledge Base Index
// This file exports all knowledge articles for easy importing

// Physics Articles
export { gravityNewtonsSecondLaw } from './physics/gravity-newtons-second-law';
export { accelerationFundamentals } from './physics/acceleration-fundamentals';

// Thermal Engineering Articles
export { copperTubeHeatLosses } from './thermal/copper-tube-heat-losses';
export { heatExchangerFundamentals } from './thermal/heat-exchanger-fundamentals';
export { thermalAnalysisFundamentals } from './thermal/thermal-analysis-fundamentals';

// Fluid Mechanics Articles
export { controlValveSizing } from './fluid/control-valve-sizing';
export { coldWaterStorageDesign } from './fluid/cold-water-storage-design';
export { pressureDropFundamentals } from './fluid/pressure-drop-fundamentals';
export { npshFundamentals } from './fluid/npsh-fundamentals';
export { valveSizingPrinciples } from './fluid/valve-sizing-principles';

// Mechanical Engineering Articles
export { centrifugalPumpCapacityModulation } from './mechanical/centrifugal-pump-capacity-modulation';
export { pumpPerformanceAnalysis } from './mechanical/pump-performance-analysis';

// Materials Engineering Articles
export { materialProperties } from './materials/material-properties';

// Structural Engineering Articles
export { beamAnalysis } from './structural/beam-analysis';

// Knowledge Base Categories
export const knowledgeCategories = {
  physics: {
    name: 'Physics',
    description: 'Fundamental physics concepts and principles',
    articles: ['gravity-newtons-second-law', 'acceleration-fundamentals'],
  },
  mechanical: {
    name: 'Mechanical Engineering',
    description: 'Mechanical systems, pumps, and machinery',
    articles: ['centrifugal-pump-capacity-modulation', 'pump-performance-analysis'],
  },
  thermal: {
    name: 'Thermal Engineering',
    description: 'Heat transfer, thermodynamics, and thermal systems',
    articles: ['copper-tube-heat-losses', 'heat-exchanger-fundamentals', 'thermal-analysis-fundamentals'],
  },
  fluid: {
    name: 'Fluid Mechanics',
    description: 'Fluid flow, pressure, and hydraulic systems',
    articles: ['control-valve-sizing', 'cold-water-storage-design', 'pressure-drop-fundamentals', 'npsh-fundamentals', 'valve-sizing-principles'],
  },
  structural: {
    name: 'Structural Engineering',
    description: 'Structural analysis and design principles',
    articles: ['beam-analysis'],
  },
  materials: {
    name: 'Materials Engineering',
    description: 'Material properties and selection',
    articles: ['material-properties'],
  },
} as const;

// Related Calculators Mapping
export const relatedCalculators = {
  'gravity-newtons-second-law': ['newtons-second-law', 'free-fall', 'kinematics'],
  'acceleration-fundamentals': ['kinematics', 'acceleration', 'motion-analysis'],
  'copper-tube-heat-losses': ['heat-transfer', 'thermal-analysis', 'energy-efficiency'],
  'heat-exchanger-fundamentals': ['heat-exchanger', 'thermal-design', 'heat-transfer'],
  'thermal-analysis-fundamentals': ['thermal-analysis', 'heat-transfer', 'temperature'],
  'control-valve-sizing': ['valve-sizing', 'flow-coefficient', 'pressure-drop'],
  'cold-water-storage-design': ['water-storage', 'building-services', 'storage-sizing'],
  'centrifugal-pump-capacity-modulation': ['pump-performance', 'energy-efficiency', 'vfd-sizing'],
  'pump-performance-analysis': ['pump-performance', 'energy-efficiency', 'system-analysis'],
  'pressure-drop-fundamentals': ['pressure-drop', 'flow-analysis', 'system-design'],
  'npsh-fundamentals': ['npsh', 'pump-suction', 'cavitation'],
  'valve-sizing-principles': ['valve-sizing', 'flow-coefficient', 'control-valves'],
  'material-properties': ['material-properties', 'material-selection', 'thermal-analysis'],
  'beam-analysis': ['beam-analysis', 'moment-shear', 'deflection'],
} as const;
