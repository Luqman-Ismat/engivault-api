# EngiVault API Connection Guide

This comprehensive guide explains how to connect to and use the EngiVault API for engineering calculations, project management, and user analytics.

## 🚀 Quick Start

### API Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com` (when deployed)

### Health Check
Before connecting, verify the API is running:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "version": "1.0.0",
  "memory": {
    "rss": 45678912,
    "heapTotal": 25165824,
    "heapUsed": 18874368,
    "external": 1234567
  }
}
```

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: `http://localhost:3000/documentation`
- **OpenAPI JSON**: `http://localhost:3000/documentation/json`

### Available Endpoints

#### 🔑 Authentication & User Management
- `POST /auth/register` - Register new user account
- `POST /auth/login` - User authentication
- `GET/POST /auth/api-keys` - API key management
- `DELETE /auth/api-keys/:id` - Revoke API key
- `GET /analytics/usage` - Usage statistics and analytics

#### 📊 Project Management (Pro/Enterprise)
- `GET/POST /projects` - Project lifecycle management
- `GET /projects/:id` - Project details and team info
- `GET/POST /projects/:id/tasks` - Task management
- `GET /projects/:id/metrics` - Project analytics
- `GET/PUT/DELETE /tasks/:id` - Individual task operations
- `PUT /tasks/bulk-update` - Bulk task operations

#### 🗃️ Materials Database
- `GET /materials` - List materials with filtering
- `GET /materials/:id` - Get specific material properties
- `GET /materials/categories` - Get material categories
- `GET /materials/search` - Advanced material search

#### 📚 Knowledge Base
- `GET /knowledge` - List all knowledge articles with filtering
- `GET /knowledge/:id` - Get specific knowledge article
- `GET /knowledge/categories` - Get knowledge categories with article counts
- `GET /knowledge/search` - Search knowledge articles by content
- `GET /knowledge/:id/related` - Get related articles

#### 🔧 Engineering Calculations
- `POST /hydraulics/pressure-drop` - Calculate pressure drop using Darcy-Weisbach equation
- `POST /hydraulics/minor-losses` - Calculate minor losses in piping systems
- `POST /hydraulics/pipe-sizing` - Size pipes for target velocity or pressure drop
- `POST /pumps/npsh` - Calculate Net Positive Suction Head
- `POST /pumps/bep` - Check Best Efficiency Point
- `POST /pumps/operating-point` - Determine pump operating point

#### 🚰 Valves
- `POST /valves/flow-coefficient` - Calculate valve flow coefficient (Cv)
- `POST /valves/pressure-drop` - Calculate pressure drop across valves

#### 🌐 Networks
- `POST /networks/solve` - Solve pipe networks using Hardy Cross method

#### ⛽ Gas Flow
- `POST /gas/flow` - Calculate compressible gas flow (isothermal/adiabatic)
- `POST /gas/fanno-line` - Calculate Fanno line for gas flow
- `POST /gas/rayleigh-line` - Calculate Rayleigh line for gas flow

#### 🌡️ Thermal
- `POST /thermal/viscosity-adjusted-drop` - Calculate viscosity-adjusted pressure drop
- `POST /thermal/hx-pressure-drop` - Calculate heat exchanger pressure drop

#### 🔄 Operations
- `POST /operations/fill-drain-time` - Calculate tank fill/drain times
- `POST /operations/batch-processing` - Process multiple calculations

## 🔐 Authentication & Security

### SaaS Authentication System
The API now includes a complete SaaS authentication system with user management and API keys:

#### User Registration & Login
```bash
# Register a new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "companyName": "Engineering Corp"
  }'

# Login to get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

#### API Key Authentication
```bash
# Create an API key
curl -X POST http://localhost:3000/auth/api-keys \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keyName": "Production API Key",
    "expiresAt": "2024-12-31T23:59:59Z"
  }'

# Use API key for requests
curl -H "X-API-Key: YOUR_API_KEY" \
     http://localhost:3000/api/v1/pumps/energy
```

#### Subscription Tiers & Rate Limiting
- **Free**: 100 requests/month, 10/day, 5/minute
- **Basic**: 1,000 requests/month, 50/day, 10/minute  
- **Pro**: 10,000 requests/month, 500/day, 50/minute
- **Enterprise**: 100,000 requests/month, 5,000/day, 200/minute

#### Security Features
- **JWT Authentication**: Secure token-based authentication
- **API Key Management**: Generate, revoke, and track API keys
- **Rate Limiting**: Per-user and per-API-key limits based on subscription
- **Request Logging**: All requests logged with performance metrics
- **PII Protection**: Automatic redaction of sensitive data

## 📊 Project Management (Pro/Enterprise)

### Creating Projects
```bash
# Create a new project (Pro/Enterprise only)
curl -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pump System Design",
    "description": "Design new pump system for facility",
    "startDate": "2024-01-01T00:00:00Z",
    "teamMembers": ["user2@example.com", "user3@example.com"]
  }'
```

### Task Management
```bash
# Create a task
curl -X POST http://localhost:3000/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Calculate pump energy consumption",
    "description": "Determine annual energy costs for pump system",
    "priority": "high",
    "assignee": "engineer@example.com",
    "phase": "implementation",
    "sprint": 1,
    "estimatedHours": 8
  }'

# Update task status
curl -X PUT http://localhost:3000/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-progress",
    "actualHours": 6
  }'
```

### Project Analytics
```bash
# Get project metrics (Pro/Enterprise)
curl -X GET http://localhost:3000/projects/PROJECT_ID/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response includes:
# - Task completion statistics
# - User calculation tracking
# - Performance metrics
# - Usage analytics
```

## 🗃️ Materials Database

### Search Materials
```bash
# Get all materials
curl http://localhost:3000/materials

# Filter by category
curl "http://localhost:3000/materials?category=Metal"

# Search by name
curl "http://localhost:3000/materials?search=aluminum"

# Filter by properties
curl "http://localhost:3000/materials?minDensity=2000&maxDensity=3000"
```

### Get Specific Material
```bash
# Get material by ID
curl http://localhost:3000/materials/2

# Response includes:
# - Material name and category
# - Density, elastic modulus, Poisson's ratio
# - Tensile strength, thermal conductivity
```

## 📚 Knowledge Base

### Browse Knowledge Articles
```bash
# Get all knowledge articles
curl http://localhost:3000/knowledge

# Filter by category
curl "http://localhost:3000/knowledge?category=physics"

# Filter by difficulty
curl "http://localhost:3000/knowledge?difficulty=beginner"

# Search articles
curl "http://localhost:3000/knowledge?search=pump"

# Pagination
curl "http://localhost:3000/knowledge?limit=10&offset=0"
```

### Get Specific Article
```bash
# Get article by ID
curl http://localhost:3000/knowledge/gravity-newtons-second-law

# Response includes:
# - Article title, category, and difficulty
# - Read time and author information
# - Tags and related calculators
# - Full article content
# - Last updated date
```

### Search Knowledge Base
```bash
# Search with query
curl "http://localhost:3000/knowledge/search?q=heat transfer"

# Filter search results
curl "http://localhost:3000/knowledge/search?q=valve&category=fluid&limit=5"

# Response includes:
# - Relevance scores
# - Matched fields (title, summary, tags)
# - Total results count
```

### Get Related Articles
```bash
# Get articles related to a specific article
curl http://localhost:3000/knowledge/gravity-newtons-second-law/related

# Response includes:
# - Related articles based on:
#   - Same category
#   - Shared tags
#   - Related calculators
# - Sorted by relevance score
```

### Knowledge Categories
```bash
# Get all knowledge categories
curl http://localhost:3000/knowledge/categories

# Response includes:
# - Category names and descriptions
# - Article counts per category
# - Available categories:
#   - Physics (2 articles)
#   - Thermal Engineering (3 articles)
#   - Fluid Mechanics (5 articles)
#   - Mechanical Engineering (2 articles)
#   - Structural Engineering (1 article)
#   - Materials Engineering (1 article)
```

## 💻 SDK Usage

### TypeScript SDK

#### Installation
```bash
npm install @engivault/ts-sdk
```

#### Basic Usage
```typescript
import { EngiVaultClient } from '@engivault/ts-sdk';

// Create client instance
const client = new EngiVaultClient({
  BASE: 'http://localhost:3000',
});

// Calculate pressure drop
const result = await client.hydraulics.calculatePressureDrop({
  Q: 0.1,           // Flow rate (m³/s)
  L: 100,           // Pipe length (m)
  D: 0.1,           // Pipe diameter (m)
  roughness: 0.000045, // Pipe roughness (m)
  fluid: 'water',   // Fluid type
  units: 'SI'       // Unit system
});

console.log('Pressure drop:', result.data.pressureDrop, 'Pa');
```

#### Advanced Usage with Error Handling
```typescript
import { EngiVaultClient } from '@engivault/ts-sdk';

const client = new EngiVaultClient({
  BASE: 'http://localhost:3000',
});

try {
  // Calculate NPSH
  const npshResult = await client.pumps.calculateNpsh({
    elevation: 100,      // Elevation above sea level (m)
    atmosphericPressure: 101325, // Atmospheric pressure (Pa)
    vaporPressure: 2300, // Fluid vapor pressure (Pa)
    velocityHead: 5.2,   // Velocity head (m)
    frictionLosses: 2.1  // Friction losses (m)
  });

  console.log('NPSH Available:', npshResult.data.npshAvailable, 'm');
  
  // Check if NPSH is sufficient
  if (npshResult.data.npshAvailable > npshResult.data.npshRequired) {
    console.log('✅ NPSH is sufficient');
  } else {
    console.log('⚠️ NPSH may be insufficient');
  }
} catch (error) {
  if (error.response?.status === 429) {
    console.log('Rate limit exceeded, please wait');
  } else {
    console.error('Calculation error:', error.message);
  }
}
```

### Python SDK

#### Installation
```bash
pip install -e .
```

#### Basic Usage
```python
from engivault_py_sdk import EngiVaultClient

# Create client
client = EngiVaultClient(base_url="http://localhost:3000")

# Calculate pressure drop
result = client.calculate_pressure_drop({
    "Q": 0.1,
    "L": 100,
    "D": 0.1,
    "roughness": 0.000045,
    "fluid": "water",
    "units": "SI"
})

print(f"Pressure drop: {result['pressureDrop']} Pa")
```

#### Advanced Usage
```python
from engivault_py_sdk import EngiVaultClient
import requests

client = EngiVaultClient(base_url="http://localhost:3000")

try:
    # Solve pipe network
    network_result = client.solve_network({
        "nodes": [
            {"id": "A", "elevation": 100, "demand": 0.05},
            {"id": "B", "elevation": 95, "demand": 0.03},
            {"id": "C", "elevation": 90, "demand": 0.02}
        ],
        "pipes": [
            {"from": "A", "to": "B", "length": 500, "diameter": 0.2, "roughness": 0.000045},
            {"from": "B", "to": "C", "length": 300, "diameter": 0.15, "roughness": 0.000045}
        ],
        "tolerance": 0.001,
        "maxIterations": 100
    })
    
    print("Network solution:")
    for pipe in network_result['pipes']:
        print(f"Pipe {pipe['id']}: Flow = {pipe['flow']:.4f} m³/s")
        
except requests.exceptions.RequestException as e:
    if e.response and e.response.status_code == 429:
        print("Rate limit exceeded")
    else:
        print(f"Request failed: {e}")
```

## 🌐 Direct HTTP API Usage

### Using cURL

#### Basic Request
```bash
curl -X POST http://localhost:3000/hydraulics/pressure-drop \
  -H "Content-Type: application/json" \
  -d '{
    "Q": 0.1,
    "L": 100,
    "D": 0.1,
    "roughness": 0.000045,
    "fluid": "water",
    "units": "SI"
  }'
```

#### With Error Handling
```bash
# Check rate limit headers
curl -I http://localhost:3000/health

# Example response headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1642248600
```

### Using JavaScript (Fetch API)

```javascript
// Basic calculation
async function calculatePressureDrop() {
  try {
    const response = await fetch('http://localhost:3000/hydraulics/pressure-drop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Q: 0.1,
        L: 100,
        D: 0.1,
        roughness: 0.000045,
        fluid: 'water',
        units: 'SI'
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Pressure drop:', result.pressureDrop, 'Pa');
    return result;
  } catch (error) {
    console.error('Calculation failed:', error.message);
    throw error;
  }
}

// Batch processing
async function processMultipleCalculations() {
  const calculations = [
    { Q: 0.1, L: 100, D: 0.1, roughness: 0.000045, fluid: 'water', units: 'SI' },
    { Q: 0.2, L: 150, D: 0.15, roughness: 0.000045, fluid: 'water', units: 'SI' },
    { Q: 0.05, L: 75, D: 0.08, roughness: 0.000045, fluid: 'water', units: 'SI' }
  ];

  try {
    const response = await fetch('http://localhost:3000/operations/batch-processing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint: '/hydraulics/pressure-drop',
        requests: calculations
      })
    });

    const results = await response.json();
    console.log('Batch results:', results);
    return results;
  } catch (error) {
    console.error('Batch processing failed:', error.message);
    throw error;
  }
}
```

### Using Python (requests)

```python
import requests
import json

# Basic calculation
def calculate_pressure_drop():
    url = "http://localhost:3000/hydraulics/pressure-drop"
    data = {
        "Q": 0.1,
        "L": 100,
        "D": 0.1,
        "roughness": 0.000045,
        "fluid": "water",
        "units": "SI"
    }
    
    try:
        response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        print(f"Pressure drop: {result['pressureDrop']} Pa")
        return result
        
    except requests.exceptions.HTTPError as e:
        if response.status_code == 429:
            print("Rate limit exceeded")
        else:
            print(f"HTTP error: {e}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

# Check rate limit status
def check_rate_limit():
    response = requests.get("http://localhost:3000/health")
    headers = response.headers
    
    print(f"Rate limit: {headers.get('X-RateLimit-Limit', 'N/A')}")
    print(f"Remaining: {headers.get('X-RateLimit-Remaining', 'N/A')}")
    print(f"Reset time: {headers.get('X-RateLimit-Reset', 'N/A')}")
```

## 📊 Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation error",
  "details": [
    {
      "field": "Q",
      "message": "Flow rate must be greater than 0"
    }
  ]
}
```

#### 429 Too Many Requests
```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded, retry in 45 seconds",
  "expiresIn": 45000
}
```

#### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Calculation failed",
  "requestId": "req-1642248600000-abc123def"
}
```

### Error Handling Best Practices

1. **Always check response status codes**
2. **Handle rate limiting gracefully** (implement backoff)
3. **Parse error details** for validation errors
4. **Log request IDs** for debugging
5. **Implement retry logic** for transient failures

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Logging
LOG_LEVEL=info
LOG_PRETTY_PRINT=true
REDACT_PII=true

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000

# Caching
CACHE_TTL=600000

# Performance Settings
ENABLE_COMPRESSION=true
ENABLE_CACHING=true

# Monitoring
ENABLE_METRICS=true
```

### Docker Configuration

```bash
# Using Docker Compose
docker-compose up -d

# Using Docker directly
docker build -t engivault-api .
docker run -p 3000:3000 engivault-api
```

## 🚀 Performance Tips

### 1. Use Batch Processing
For multiple calculations, use the batch processing endpoint:
```json
POST /operations/batch-processing
{
  "endpoint": "/hydraulics/pressure-drop",
  "requests": [
    { "Q": 0.1, "L": 100, "D": 0.1, "roughness": 0.000045, "fluid": "water", "units": "SI" },
    { "Q": 0.2, "L": 150, "D": 0.15, "roughness": 0.000045, "fluid": "water", "units": "SI" }
  ]
}
```

### 2. Implement Connection Pooling
```javascript
// Node.js example with keep-alive
const agent = new https.Agent({
  keepAlive: true,
  maxSockets: 10
});

fetch(url, { agent });
```

### 3. Use Appropriate Timeouts
```javascript
// Set reasonable timeouts
const controller = new AbortController();
setTimeout(() => controller.abort(), 30000); // 30 second timeout

fetch(url, { signal: controller.signal });
```

### 4. Cache Results When Possible
```javascript
// Simple in-memory cache
const cache = new Map();

async function getCachedResult(key, calculation) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await calculate(calculation);
  cache.set(key, result);
  return result;
}
```

## 🔍 Monitoring & Debugging

### Request Tracing
Every request includes a unique request ID:
```bash
curl -v http://localhost:3000/health
# Look for: X-Request-Id: req-1642248600000-abc123def
```

### Metrics Endpoint
```bash
# Prometheus metrics
curl http://localhost:3000/metrics
```

### Logging
Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

## 📞 Support

### Getting Help
1. **Check the Swagger UI**: `http://localhost:3000/documentation`
2. **Review error messages**: Include request IDs in bug reports
3. **Test with simple requests**: Start with the health endpoint
4. **Check rate limits**: Monitor remaining requests

### Common Issues

#### Connection Refused
- Verify the server is running: `curl http://localhost:3000/health`
- Check the port: Default is 3000
- Ensure no firewall blocking

#### Rate Limit Exceeded
- Implement exponential backoff
- Check rate limit headers
- Consider batch processing for multiple requests

#### Validation Errors
- Review the OpenAPI schema in Swagger UI
- Check required fields and data types
- Ensure proper units are specified

---

**🎉 You're ready to connect to the EngiVault API!** Start with the health check and explore the interactive documentation to understand all available endpoints.
