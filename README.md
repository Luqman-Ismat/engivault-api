# EngiVault API

A comprehensive high-performance engineering calculations API for fluid dynamics, pump systems, gas flow, thermal calculations, and more. Built with Fastify, TypeScript, and modern engineering standards.

## 🚀 Features

### Core Engineering Calculations
- **Fluid Dynamics**: Pressure drop, flow fittings, minor losses
- **Pump Systems**: Operating point analysis, BEP distance, curve fitting
- **Gas Flow**: Fanno/Rayleigh lines, pressure drop with compressibility
- **Thermal**: Heat exchanger pressure drop, viscosity-adjusted calculations
- **Valve Sizing**: Cv/Kv calculations with trim characteristics
- **Network Analysis**: Complex piping network calculations
- **Safety Systems**: Relief valve sizing and analysis
- **Operations**: Tank fill/drain time calculations
- **Rheology**: Non-Newtonian fluid calculations

### Advanced Features
- **Batch Processing**: Process multiple calculations in a single request
- **Transcript Service**: Capture and retrieve calculation runs with `X-EngiVault-Transcript` header
- **Error Helper**: Intelligent error messages with engineering hints
- **Golden Tests**: Regression testing with fixed inputs and tolerance verification
- **SDK Generation**: Auto-generated TypeScript and Python SDKs
- **Performance Optimized**: Caching, compression, rate limiting, and metrics

### Production Ready
- **API Documentation**: Auto-generated Swagger/OpenAPI docs with examples
- **Monitoring**: Prometheus metrics and structured logging
- **Docker Support**: Containerized deployment
- **Health Checks**: Comprehensive health monitoring
- **Type Safety**: Full TypeScript coverage

## 📊 Current Status

- **40+ API Endpoints** covering comprehensive engineering calculations
- **1,171 Tests** (1,121 passing, 40 failing - see [Repository Review](REPOSITORY_REVIEW.md))
- **Golden Tests** for regression verification
- **TypeScript & Python SDKs** with examples
- **Error Helper** with intelligent engineering hints
- **Batch Processing** for efficient multiple calculations
- **Transcript Service** for calculation tracking

## 🚦 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd engivault-api

# Start with Docker Compose
docker-compose up -d

# API will be available at http://localhost:3000
# Documentation at http://localhost:3000/documentation
```

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run golden tests
npm test tests/golden/

# Build for production
npm run build

# Start production server
npm start
```

## 🔧 API Endpoints

### Core Calculations

#### Pressure Drop
```http
POST /api/v1/calculate/pressure-drop
Content-Type: application/json

{
  "flowRate": {"value": 0.01, "unit": "m3/s"},
  "pipeDiameter": {"value": 0.1, "unit": "m"},
  "pipeLength": {"value": 100, "unit": "m"},
  "fluidDensity": {"value": 1000, "unit": "kg/m3"},
  "fluidViscosity": {"value": 0.001, "unit": "Pa·s"},
  "roughness": {"value": 0.0001, "unit": "m"}
}
```

#### Gas Pressure Drop
```http
POST /api/v1/gas/pressure-drop
Content-Type: application/json

{
  "inletPressure": {"value": 1000000, "unit": "Pa"},
  "flowRate": {"value": 0.1, "unit": "m3/s"},
  "pipeDiameter": {"value": 0.1, "unit": "m"},
  "pipeLength": {"value": 100, "unit": "m"},
  "frictionFactor": 0.02,
  "specificHeatRatio": 1.4
}
```

#### Pump Operating Point
```http
POST /api/v1/pumps/operate
Content-Type: application/json

{
  "pumps": [
    {
      "curve": [
        {"flow": {"value": 0, "unit": "m3/s"}, "head": {"value": 30, "unit": "m"}},
        {"flow": {"value": 0.01, "unit": "m3/s"}, "head": {"value": 25, "unit": "m"}}
      ],
      "efficiency": 0.8
    }
  ],
  "systemCurve": {
    "staticHead": {"value": 10, "unit": "m"},
    "resistanceCoefficient": 1000
  }
}
```

#### Valve Sizing
```http
POST /api/v1/valves/size
Content-Type: application/json

{
  "flow": {"value": 100, "unit": "gpm"},
  "pressureDrop": {"value": 10, "unit": "psi"},
  "specificGravity": 1.0,
  "trimCharacteristic": {
    "type": "linear",
    "description": "Linear characteristic"
  }
}
```

#### Curve Fitting
```http
POST /api/v1/curves/fit
Content-Type: application/json

{
  "points": [
    {"q": 10, "h": 94.5},
    {"q": 20, "h": 88},
    {"q": 30, "h": 80.5}
  ],
  "model": "quadratic"
}
```

### Advanced Features

#### Batch Processing
```http
POST /api/v1/calculate/pressure-drop
Content-Type: application/json

{
  "items": [
    {
      "flowRate": {"value": 0.01, "unit": "m3/s"},
      "pipeDiameter": {"value": 0.1, "unit": "m"}
    },
    {
      "flowRate": {"value": 0.02, "unit": "m3/s"},
      "pipeDiameter": {"value": 0.15, "unit": "m"}
    }
  ]
}
```

#### Transcript Service
```http
POST /api/v1/calculate/pressure-drop
X-EngiVault-Transcript: on
Content-Type: application/json

{
  "flowRate": {"value": 0.01, "unit": "m3/s"},
  "pipeDiameter": {"value": 0.1, "unit": "m"}
}

# Retrieve transcript
GET /api/v1/runs/{transcript-id}
```

## 🛠️ SDK Usage

### TypeScript SDK
```typescript
import { EngiVaultAPI } from './clients/ts';

const client = new EngiVaultAPI('http://localhost:3000');

const result = await client.calculatePressureDrop({
  flowRate: { value: 0.01, unit: 'm3/s' },
  pipeDiameter: { value: 0.1, unit: 'm' }
});
```

### Python SDK
```python
from clients.py.client import EngiVaultAPI

client = EngiVaultAPI('http://localhost:3000')

result = client.calculate_pressure_drop({
    'flowRate': {'value': 0.01, 'unit': 'm3/s'},
    'pipeDiameter': {'value': 0.1, 'unit': 'm'}
})
```

## ⚙️ Configuration

Environment variables:

```bash
NODE_ENV=development          # Environment (development/production/test)
PORT=3000                     # Server port
HOST=0.0.0.0                  # Server host
LOG_LEVEL=info               # Logging level
RATE_LIMIT_MAX=100           # Rate limit requests per window
RATE_LIMIT_WINDOW=1 minute   # Rate limit time window
CACHE_TTL=600000             # Cache TTL in milliseconds
```

## 📈 Performance Features

### Caching
- In-memory caching for expensive mathematical calculations
- Configurable TTL (default: 10 minutes)
- Automatic cache invalidation

### Compression
- Gzip and Deflate compression for responses > 1KB
- Reduced bandwidth usage

### Rate Limiting
- 100 requests per minute per IP
- Configurable limits via environment variables

### Metrics
- Prometheus metrics for monitoring
- Request counts, latency, and error rates
- Available at `/metrics`

## 🏥 Health Check

```http
GET /health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "version": "1.0.0"
}
```

## 📚 API Documentation

Interactive API documentation is available at `/documentation` when the server is running.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run golden tests (regression testing)
npm test tests/golden/

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## 🐳 Docker

### Build Image
```bash
docker build -t engivault-api .
```

### Run Container
```bash
docker run -p 3000:3000 engivault-api
```

### Development with Docker Compose
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🏗️ Architecture

```
src/
├── config/           # Environment configuration
├── logic/           # Core calculation logic
├── routes/          # API route handlers
├── schemas/         # Input validation schemas
├── services/        # Business services (transcript, etc.)
├── utils/           # Utility functions (cache, error handling, etc.)
└── index.ts         # Application entry point

tests/
├── golden/          # Regression tests with fixed inputs
└── ...              # Unit and integration tests

clients/
├── ts/              # TypeScript SDK
└── py/              # Python SDK
```

## 🔍 Error Handling

The API provides intelligent error messages with engineering hints:

```json
{
  "error": "Validation Error",
  "message": "Invalid input parameters",
  "hints": [
    "For Mach > 0.3, consider using /api/v1/gas/pressure-drop endpoint",
    "Check that Reynolds number is within valid range (Re > 2300 for turbulent flow)"
  ]
}
```

## 📊 Performance Optimizations

1. **Mathematical Caching**: Expensive calculations are cached with configurable TTL
2. **Response Compression**: Automatic compression for large responses
3. **Rate Limiting**: Protection against abuse
4. **Type Safety**: Full TypeScript coverage for better performance
5. **Error Handling**: Centralized error handling with proper HTTP status codes
6. **Batch Processing**: Efficient handling of multiple calculations
7. **Transcript Service**: Calculation tracking and debugging

## 🚧 Known Issues

See [Repository Review](REPOSITORY_REVIEW.md) for detailed analysis of current issues and roadmap.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

ISC License
