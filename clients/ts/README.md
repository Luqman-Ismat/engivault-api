# EngiVault TypeScript SDK

A TypeScript client library for the EngiVault API, automatically generated from the OpenAPI schema.

## Installation

```bash
npm install @engivault/ts-sdk
```

## Usage

```typescript
import { EngiVaultClient } from '@engivault/ts-sdk';

// Create client instance
const client = new EngiVaultClient({
  BASE: 'http://localhost:3000',
});

// Calculate pressure drop
const result = await client.hydraulics.calculatePressureDrop({
  Q: 0.1,
  L: 100,
  D: 0.1,
  roughness: 0.000045,
  fluid: 'water',
  units: 'SI'
});

console.log(result);
```

## Available Services

### Hydraulics
- `calculatePressureDrop()` - Calculate pressure drop using Darcy-Weisbach equation
- `calculateMinorLosses()` - Calculate minor losses
- `sizePipeForTarget()` - Size pipe for target velocity or pressure drop

### Pumps
- `calculateNpsh()` - Calculate Net Positive Suction Head
- `checkBep()` - Check Best Efficiency Point

### Valves
- `calculateValveFlow()` - Calculate valve flow using orifice equation

### Networks
- `solveNetwork()` - Solve network using Hardy Cross method

### Transients
- `calculateTransients()` - Calculate transients using Joukowsky equation

### Gas
- `calculateGasFlow()` - Calculate gas flow (isothermal/adiabatic)
- `calculateFannoLine()` - Calculate Fanno line
- `calculateRayleighLine()` - Calculate Rayleigh line

### Thermal
- `calculateViscosityAdjustedDrop()` - Calculate viscosity adjusted pressure drop
- `calculateHxPressureDrop()` - Calculate heat exchanger pressure drop

### Slurries
- `calculateSlurryFlow()` - Calculate slurry flow using Durand correlation

### Operations
- `calculateFillDrainTime()` - Calculate fill/drain time for tanks

### Curves
- `fitPumpCurve()` - Fit pump curve using polynomial regression

### Utilities
- `convertUnits()` - Convert between different units
- `getHealth()` - Get API health status

## Examples

See `example.ts` for comprehensive usage examples.

## Development

This SDK is automatically generated from the OpenAPI schema. To regenerate:

```bash
npm run generate-sdk
```

## License

MIT
