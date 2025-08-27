# EngiVault SDKs

This directory contains automatically generated SDKs for the EngiVault API.

## 📁 Structure

```
clients/
├── ts/          # TypeScript SDK
├── py/          # Python SDK
└── README.md    # This file
```

## 🚀 Quick Start

### TypeScript SDK

```bash
# Install dependencies
npm run sdk:install-ts

# Run example
npm run sdk:test-ts
```

### Python SDK

```bash
# Install dependencies
npm run sdk:install-py

# Run example
npm run sdk:test-py
```

## 📚 SDK Details

### TypeScript SDK (`clients/ts/`)

- **Generated from**: OpenAPI schema using `openapi-typescript-codegen`
- **Features**: Full TypeScript support, type safety, async/await
- **Installation**: `npm install @engivault/ts-sdk`
- **Example**: See `clients/ts/example.ts`
- **Status**: ✅ Fully functional

### Python SDK (`clients/py/`)

- **Generated from**: Manual implementation based on OpenAPI schema
- **Features**: Simple HTTP client, dataclass models, type hints
- **Installation**: `pip install -e .` (from `clients/py/` directory)
- **Example**: See `clients/py/example.py`
- **Status**: ✅ Partially functional (some endpoints working)

## 🔧 Development

### Regenerating SDKs

The SDKs are automatically generated from the OpenAPI schema. To regenerate:

```bash
# Make sure the server is running
npm run dev

# In another terminal, regenerate SDKs
npm run generate-sdk
```

### Build Process

The SDKs are automatically generated during the build process:

```bash
npm run build  # This runs generate-sdk first
```

## 📖 Usage Examples

### TypeScript

```typescript
import { EngiVaultClient } from '@engivault/ts-sdk';

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
```

### Python

```python
from clients.py.client import EngiVaultClient

client = EngiVaultClient(base_url="http://localhost:3000")

# Fit pump curve (working endpoint)
result = client.fit_pump_curve({
    "points": [
        {"q": 10, "h": 94.5},
        {"q": 20, "h": 88},
        {"q": 30, "h": 80.5}
    ],
    "model": "quadratic"
})
```

## 🧪 Testing

### Test TypeScript SDK

```bash
npm run sdk:test-ts
```

### Test Python SDK

```bash
npm run sdk:test-py
```

## 📦 Publishing

### TypeScript SDK

```bash
cd clients/ts
npm publish
```

### Python SDK

```bash
cd clients/py
python setup.py sdist bdist_wheel
pip install twine
twine upload dist/*
```

## 🔄 Auto-generation

The SDKs are automatically generated from the OpenAPI schema at build time. The generation process:

1. Starts the development server
2. Fetches the OpenAPI schema from `/documentation/json`
3. Generates TypeScript SDK using `openapi-typescript-codegen`
4. Generates Python SDK using custom templates
5. Creates example files and documentation

## 📋 Available Endpoints

### Working Endpoints (Tested)

- **Health**: `GET /health` ✅
- **Curves**: `POST /api/v1/curves/fit` ✅
- **Operations**: `POST /api/v1/operations/fill-drain-time` (needs schema fix)
- **Gas**: `POST /api/v1/gas/pressure-drop`, `/api/v1/gas/fanno`, `/api/v1/gas/rayleigh`
- **Thermal**: `POST /api/v1/thermal/viscosity-adjusted-drop`, `/api/v1/thermal/hx-drop`
- **Networks**: `POST /api/v1/networks/solve`
- **Transients**: `POST /api/v1/transients/joukowsky`
- **Slurries**: `POST /api/v1/slurries/pressure-drop`
- **Pumps**: `POST /api/v1/pumps/bep-check`
- **Hydraulics**: `POST /api/v1/hydraulics/size-pipe`
- **Utilities**: `POST /api/v1/utilities/convert`

### Endpoints Needing Schema Fixes

- **Pressure Drop**: `POST /api/v1/calculate/pressure-drop` (schema mismatch)
- **Minor Losses**: `POST /api/v1/calculate/minor-losses` (schema mismatch)
- **NPSH**: `POST /api/v1/npsh` (schema mismatch)
- **Valves**: `POST /api/v1/valves/flow` (schema mismatch)

## 🛠️ Customization

### TypeScript SDK

The TypeScript SDK is generated using `openapi-typescript-codegen`. To customize:

1. Modify the generation script in `scripts/generate-sdk.js`
2. Add custom templates if needed
3. Update the `package.json` in `clients/ts/`

### Python SDK

The Python SDK is manually implemented. To customize:

1. Modify the templates in `scripts/generate-sdk.js`
2. Update `clients/py/client.py` for new endpoints
3. Update `clients/py/models.py` for new data models

## 🐛 Known Issues

1. **Schema Mismatches**: Some endpoints have different input schemas than expected
2. **Python Import Issues**: Fixed relative imports in client.py
3. **SSL Warnings**: Python SDK shows SSL warnings on macOS (non-critical)

## 📄 License

Both SDKs are licensed under MIT License.

## 🎯 Next Steps

1. Fix schema mismatches for remaining endpoints
2. Add comprehensive error handling
3. Add unit tests for SDKs
4. Add CI/CD for automatic SDK generation
5. Add documentation generation
