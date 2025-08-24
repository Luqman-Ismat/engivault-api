# EngiVault API

A high-performance engineering calculations API for fluid dynamics and pump systems, built with Fastify and TypeScript.

## Features

- **Pressure Drop Calculations**: Darcy-Weisbach equation with Churchill friction factor
- **NPSH Analysis**: Net Positive Suction Head calculations
- **Flow Fittings**: K-factor based pressure drop calculations
- **Pump System Curves**: Operating point analysis
- **Performance Optimized**: Caching, compression, and rate limiting
- **API Documentation**: Auto-generated Swagger/OpenAPI docs
- **Production Ready**: Docker support, health checks, and monitoring

## Quick Start

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

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Pressure Drop Calculation
```http
POST /api/v1/calculate/pressure-drop
Content-Type: application/json

{
  "flowRate": 0.01,
  "pipeDiameter": 0.1,
  "pipeLength": 100,
  "fluidDensity": 1000,
  "fluidViscosity": 0.001,
  "roughness": 0.0001
}
```

### NPSH Calculation
```http
POST /api/v1/calculate/npsh
Content-Type: application/json

{
  "atmosphericPressure": 101325,
  "vaporPressure": 2337,
  "fluidDensity": 1000,
  "staticHead": 2,
  "frictionLosses": 5000,
  "flowRate": 0.01,
  "pipeDiameter": 0.1
}
```

### Flow Fittings
```http
POST /api/v1/calculate/flow-fittings
Content-Type: application/json

{
  "kFactor": 0.5,
  "fluidDensity": 1000,
  "velocity": 2.5
}
```

### Pump System Curve
```http
POST /api/v1/calculate/pump-system-curve
Content-Type: application/json

{
  "pumpCurve": [
    {"flow": 0, "head": 30},
    {"flow": 0.01, "head": 25},
    {"flow": 0.02, "head": 15}
  ],
  "systemCurve": {
    "staticHead": 10,
    "resistanceCoefficient": 1000
  }
}
```

### NPSH Required
```http
POST /api/v1/calculate/npsh-required
Content-Type: application/json

{
  "flowRate": 0.01,
  "npshrCurve": [
    {"flow": 0, "npshr": 2},
    {"flow": 0.01, "npshr": 3},
    {"flow": 0.02, "npshr": 5}
  ]
}
```

## Performance Features

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

## Configuration

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

## Health Check

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

## API Documentation

Interactive API documentation is available at `/documentation` when the server is running.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Docker

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

## Architecture

```
src/
├── config/           # Environment configuration
├── logic/           # Core calculation logic
├── routes/          # API route handlers
├── schemas/         # Input validation schemas
├── utils/           # Utility functions (cache, error handling)
└── index.ts         # Application entry point
```

## Performance Optimizations

1. **Mathematical Caching**: Expensive calculations are cached with configurable TTL
2. **Response Compression**: Automatic compression for large responses
3. **Rate Limiting**: Protection against abuse
4. **Type Safety**: Full TypeScript coverage for better performance
5. **Error Handling**: Centralized error handling with proper HTTP status codes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

ISC License
