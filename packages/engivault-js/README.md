# EngiVault JavaScript/TypeScript SDK

[![npm version](https://badge.fury.io/js/engivault.svg)](https://badge.fury.io/js/engivault)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official JavaScript/TypeScript SDK for EngiVault - Engineering calculations made simple.

## Features

- 🚀 **Full TypeScript Support** - Complete type safety and IntelliSense
- 🌳 **Tree Shakeable** - Import only what you need
- 🔄 **Automatic Retries** - Built-in retry logic for reliability
- 🎯 **Modular Design** - Use unified client or specialized modules
- 📦 **Universal** - Works in Node.js and browsers
- ⚡ **Lightweight** - Minimal dependencies

## Installation

```bash
npm install engivault
```

```bash
yarn add engivault
```

```bash
pnpm add engivault
```

## Quick Start

### Simplified API (New! ⭐)

The easiest way to use EngiVault - just initialize and call functions:

```javascript
const ev = require('engivault');

// Initialize once
ev.init('your-api-key-here');

// Call functions directly!
const result = await ev.pressureDrop({
  flowRate: 0.01,
  pipeDiameter: 0.1,
  pipeLength: 100,
  fluidDensity: 1000,
  fluidViscosity: 0.001
});

console.log(`Pressure drop: ${result.pressureDrop} Pa`);
```

More simple examples:
```javascript
// Pump power
const pump = await ev.pumpPower({ flowRate: 0.05, head: 50, efficiency: 0.8 });
console.log(`Power: ${pump.shaftPower/1000} kW`);

// LMTD
const lmtd = await ev.lmtd({ tHotIn: 373, tHotOut: 323, tColdIn: 293, tColdOut: 333 });
console.log(`LMTD: ${lmtd.lmtd} K`);

// Open channel flow
const channel = await ev.openChannelFlow({
  flowRate: 10,
  channelWidth: 5,
  channelSlope: 0.001,
  manningSCoeff: 0.03
});
console.log(`Normal depth: ${channel.normalDepth} m`);
```

### TypeScript with Simplified API

```typescript
import * as ev from 'engivault';

ev.init(process.env.ENGIVAULT_API_KEY!);

const result = await ev.pressureDrop({
  flowRate: 0.01,
  pipeDiameter: 0.1,
  pipeLength: 100,
  fluidDensity: 1000,
  fluidViscosity: 0.001
});
// Full type safety and IntelliSense!
```

### Traditional API (Still Supported)

For more control and modularity:

```javascript
const { EngiVault } = require('engivault');

const client = new EngiVault({
  apiKey: 'your-api-key-here'
});

// Fluid mechanics calculation
const result = await client.fluidMechanics.openChannelFlow({
  flowRate: 10.0,
  channelWidth: 5.0,
  channelSlope: 0.001,
  manningSCoeff: 0.03,
  channelShape: 'rectangular'
});

console.log(`Normal Depth: ${result.normalDepth} m`);
```

### TypeScript with Traditional API

```typescript
import { EngiVault, CompressibleFlowInput } from 'engivault';

const client = new EngiVault({
  apiKey: process.env.ENGIVAULT_API_KEY,
  timeout: 10000
});

const input: CompressibleFlowInput = {
  machNumber: 2.0,
  temperature: 288,
  pressure: 101325,
  gasProperties: {
    gamma: 1.4,
    gasConstant: 287,
    molecularWeight: 28.97
  }
};

const result = await client.fluidMechanics.compressibleFlow(input);
```

### Tree-Shakeable Imports

```typescript
import { FluidMechanics } from 'engivault/fluid-mechanics';
import { HeatTransfer } from 'engivault/heat-transfer';

const fluidMechanics = new FluidMechanics({ apiKey: 'your-key' });
const heatTransfer = new HeatTransfer({ apiKey: 'your-key' });
```

## Configuration

### Environment Variables

```bash
ENGIVAULT_API_KEY=your-api-key-here
ENGIVAULT_BASE_URL=https://engivault-api.railway.app  # optional
```

### Client Options

```typescript
const client = new EngiVault({
  apiKey: 'your-api-key',           // API key (required)
  baseURL: 'https://api.custom.com', // Custom API base URL
  timeout: 30000,                   // Request timeout in ms (default: 30000)
  retries: 3                        // Number of retries (default: 3)
});
```

## API Reference

### Fluid Mechanics

#### Open Channel Flow
```typescript
await client.fluidMechanics.openChannelFlow({
  flowRate: number;           // m³/s
  channelWidth: number;       // m
  channelSlope: number;       // dimensionless
  manningSCoeff: number;      // Manning's roughness coefficient
  channelShape?: 'rectangular' | 'trapezoidal' | 'circular';
  sideSlope?: number;         // m:1 for trapezoidal
});
```

#### Compressible Flow
```typescript
await client.fluidMechanics.compressibleFlow({
  machNumber?: number;        // Mach number
  velocity?: number;          // m/s (if Mach unknown)
  temperature: number;        // K
  pressure: number;           // Pa
  gasProperties: {
    gamma: number;            // Specific heat ratio
    gasConstant: number;      // J/kg·K
    molecularWeight: number;  // kg/kmol
  };
  flowType?: 'isentropic' | 'fanno' | 'rayleigh';
});
```

#### Boundary Layer Analysis
```typescript
await client.fluidMechanics.boundaryLayer({
  velocity: number;           // m/s
  distance: number;           // m
  fluidProperties: {
    density: number;          // kg/m³
    viscosity: number;        // Pa·s
    kinematicViscosity: number; // m²/s
  };
  surfaceRoughness?: number;  // m
  plateLength?: number;       // m
});
```

#### External Flow
```typescript
await client.fluidMechanics.externalFlow({
  velocity: number;           // m/s
  characteristicLength: number; // m
  fluidProperties: {
    density: number;          // kg/m³
    viscosity: number;        // Pa·s
  };
  geometry: 'sphere' | 'cylinder' | 'flat_plate' | 'airfoil';
  angleOfAttack?: number;     // degrees (for airfoil)
});
```

### Heat Transfer

#### Heat Exchanger Area
```typescript
await client.heatTransfer.heatExchangerArea({
  heatDuty: number;           // W
  overallU: number;           // W/m²·K
  tHotIn: number;             // K
  tHotOut: number;            // K
  tColdIn: number;            // K
  tColdOut: number;           // K
  flowArrangement?: 'counterflow' | 'parallel' | 'crossflow';
});
```

#### LMTD Calculation
```typescript
await client.heatTransfer.lmtd({
  tHotIn: number;             // K
  tHotOut: number;            // K
  tColdIn: number;            // K
  tColdOut: number;           // K
  flowArrangement?: 'counterflow' | 'parallel';
});
```

#### Convective Heat Transfer
```typescript
await client.heatTransfer.convection({
  fluidVelocity: number;      // m/s
  characteristicLength: number; // m
  fluidProperties: {
    density: number;          // kg/m³
    viscosity: number;        // Pa·s
    thermalConductivity: number; // W/m·K
    specificHeat: number;     // J/kg·K
  };
  surfaceTemperature: number; // K
  fluidTemperature: number;   // K
  geometry: 'flat_plate' | 'cylinder' | 'sphere' | 'tube_internal' | 'tube_external';
});
```

#### Fin Analysis
```typescript
await client.heatTransfer.finAnalysis({
  finLength: number;          // m
  finThickness: number;       // m
  finWidth: number;           // m
  thermalConductivity: number; // W/m·K
  heatTransferCoefficient: number; // W/m²·K
  baseTemperature: number;    // K
  ambientTemperature: number; // K
});
```

## Error Handling

```typescript
import { EngiVaultError } from 'engivault';

try {
  const result = await client.fluidMechanics.openChannelFlow(input);
} catch (error) {
  if (error instanceof EngiVaultError) {
    console.error(`API Error [${error.code}]:`, error.message);
    console.error(`Status Code: ${error.statusCode}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Examples

See the [examples](./examples) directory for complete usage examples:

- [Basic Usage](./examples/basic-usage.js) - Simple JavaScript example
- [TypeScript Example](./examples/typescript-example.ts) - Advanced TypeScript usage
- [Browser Example](./examples/browser-example.html) - Usage in browsers

## Browser Support

The SDK works in modern browsers with ES2018+ support. For older browsers, use a transpiler like Babel.

```html
<script type="module">
  import { EngiVault } from 'https://unpkg.com/engivault/dist/index.esm.js';
  
  const client = new EngiVault({ apiKey: 'your-key' });
  // Use the client...
</script>
```

## Development

```bash
# Clone the repository
git clone https://github.com/Luqman-Ismat/engivault-api.git
cd engivault-api/packages/engivault-js

# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Watch for changes
npm run dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

## Support

- 📧 Email: support@engivault.com
- 🐛 Issues: [GitHub Issues](https://github.com/Luqman-Ismat/engivault-api/issues)
- 📖 Documentation: [EngiVault Docs](https://docs.engivault.com)
- 💬 Discord: [EngiVault Community](https://discord.gg/engivault)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a list of changes.
