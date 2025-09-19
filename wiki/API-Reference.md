# EngiVault API - Complete Reference

## 🌐 **API Overview**

The EngiVault API provides RESTful endpoints for comprehensive engineering calculations across hydraulics, pumps, heat transfer, and fluid mechanics. All endpoints use JSON for request/response and require authentication.

**Base URL**: `https://engivault-api-production.up.railway.app`

## 🔐 **Authentication**

### **JWT Token Authentication**
```http
Authorization: Bearer {jwt_token}
```

### **API Key Authentication** (Future)
```http
X-API-Key: {api_key}
```

### **Authentication Endpoints**

#### **User Registration**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "engineer@company.com",
  "password": "SecurePassword123!",
  "companyName": "Engineering Corp"
}
```

#### **User Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "engineer@company.com", 
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "engineer@company.com",
      "companyName": "Engineering Corp",
      "subscriptionTier": "free"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

---

## 🔧 **Hydraulics Endpoints**

### **Pressure Drop Calculation**
```http
POST /api/v1/hydraulics/pressure-drop
Content-Type: application/json
Authorization: Bearer {token}

{
  "flowRate": 0.1,
  "pipeDiameter": 0.1,
  "pipeLength": 100,
  "fluidDensity": 1000,
  "fluidViscosity": 0.001,
  "pipeRoughness": 0.00015
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pressureDrop": 762517.4635588892,
    "reynoldsNumber": 1273239.5447351628,
    "frictionFactor": 0.009407182142810387,
    "velocity": 12.732395447351626
  },
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

### **Flow Rate Calculation**
```http
POST /api/v1/hydraulics/flow-rate
Content-Type: application/json
Authorization: Bearer {token}

{
  "pressureDrop": 10000,
  "pipeDiameter": 0.1,
  "pipeLength": 100,
  "fluidDensity": 1000,
  "fluidViscosity": 0.001,
  "pipeRoughness": 0.00015
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "flowRate": 0.03558,
    "velocity": 4.537,
    "reynoldsNumber": 453700
  },
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

---

## ⚙️ **Pumps Endpoints**

### **Pump Performance Analysis**
```http
POST /api/v1/pumps/performance
Content-Type: application/json
Authorization: Bearer {token}

{
  "flowRate": 0.05,
  "head": 50,
  "efficiency": 0.8,
  "power": 5000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hydraulicPower": 0.024525,
    "brakePower": 0.03065625,
    "specificSpeed": 0.013295739742362473,
    "efficiency": 0.8
  },
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

### **NPSH Analysis**
```http
POST /api/v1/pumps/npsh
Content-Type: application/json
Authorization: Bearer {token}

{
  "suctionPressure": 101325,
  "vaporPressure": 2337,
  "fluidDensity": 1000,
  "suctionVelocity": 2.0,
  "suctionLosses": 1.5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "npshAvailable": 8.45,
    "npshRequired": 4.0,
    "margin": 4.45,
    "isCavitationRisk": false
  },
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

---

## 🌡️ **Heat Transfer Endpoints**

### **Heat Exchanger Area Sizing**
```http
POST /api/v1/heat-transfer/heat-exchanger-area
Content-Type: application/json
Authorization: Bearer {token}

{
  "heatDuty": 50000,
  "overallU": 500,
  "tHotIn": 353,
  "tHotOut": 333,
  "tColdIn": 293,
  "tColdOut": 313,
  "flowArrangement": "counterflow"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "area": 2.5,
    "lmtd": 40,
    "effectiveness": 0.3333333333333333,
    "ntu": 0.5,
    "capacityRatio": 1
  },
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

### **LMTD Calculation**
```http
POST /api/v1/heat-transfer/lmtd
Content-Type: application/json
Authorization: Bearer {token}

{
  "tHotIn": 353,
  "tHotOut": 333,
  "tColdIn": 293,
  "tColdOut": 313,
  "flowArrangement": "counterflow"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lmtd": 40
  },
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

### **Effectiveness-NTU Method**
```http
POST /api/v1/heat-transfer/effectiveness-ntu
Content-Type: application/json
Authorization: Bearer {token}

{
  "ntu": 2.5,
  "capacityRatio": 0.6,
  "flowArrangement": "counterflow"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "effectiveness": 0.811,
    "maxHeatTransfer": 0.811
  },
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

---

## 💨 **Fluid Mechanics Endpoints**

### **Open Channel Flow**
```http
POST /api/v1/fluid-mechanics/open-channel-flow
Content-Type: application/json
Authorization: Bearer {token}

{
  "flowRate": 5.0,
  "channelWidth": 3.0,
  "channelSlope": 0.001,
  "manningSCoeff": 0.03,
  "channelShape": "rectangular"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "normalDepth": 1.8057280825869035,
    "criticalDepth": 0.6566634296821354,
    "velocity": 0.9229887283355442,
    "froudeNumber": 0.21929852851830675,
    "flowRegime": "subcritical",
    "hydraulicRadius": 0.8193632556010902,
    "wettedPerimeter": 6.6114561651738075,
    "topWidth": 3
  },
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

### **Compressible Flow Analysis**
```http
POST /api/v1/fluid-mechanics/compressible-flow
Content-Type: application/json
Authorization: Bearer {token}

{
  "temperature": 288,
  "pressure": 101325,
  "velocity": 200,
  "gasProperties": {
    "gamma": 1.4,
    "gasConstant": 287,
    "molecularWeight": 28.97
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "machNumber": 0.5879342837199938,
    "velocity": 200,
    "speedOfSound": 340.17407308611865,
    "stagnationTemperature": 307.9104031856645,
    "stagnationPressure": 128034.84311482335,
    "density": 1.2258638211382114,
    "flowRegime": "subsonic",
    "pressureRatio": 0.7913861378275786,
    "temperatureRatio": 0.9353370234338627,
    "densityRatio": 0.8460973082431791
  },
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

### **Boundary Layer Analysis**
```http
POST /api/v1/fluid-mechanics/boundary-layer
Content-Type: application/json
Authorization: Bearer {token}

{
  "velocity": 10,
  "distance": 0.5,
  "fluidProperties": {
    "density": 1.225,
    "viscosity": 1.81e-5,
    "kinematicViscosity": 1.48e-5
  }
}
```

### **External Flow Analysis**
```http
POST /api/v1/fluid-mechanics/external-flow
Content-Type: application/json
Authorization: Bearer {token}

{
  "velocity": 20,
  "characteristicLength": 0.1,
  "fluidProperties": {
    "density": 1.225,
    "viscosity": 1.81e-5
  },
  "geometry": "sphere"
}
```

### **Normal Shock Analysis**
```http
POST /api/v1/fluid-mechanics/normal-shock
Content-Type: application/json
Authorization: Bearer {token}

{
  "machNumber1": 2.0,
  "gamma": 1.4
}
```

### **Choked Flow Analysis**
```http
POST /api/v1/fluid-mechanics/choked-flow
Content-Type: application/json
Authorization: Bearer {token}

{
  "stagnationTemperature": 300,
  "stagnationPressure": 200000,
  "gamma": 1.4,
  "gasConstant": 287
}
```

---

## 📊 **Analytics Endpoints**

### **Usage Statistics**
```http
GET /analytics/usage?days=30
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 150,
    "requestsToday": 12,
    "requestsThisMonth": 89,
    "averageResponseTime": 245.6,
    "topEndpoints": [
      {"endpoint": "/api/v1/hydraulics/pressure-drop", "count": 45},
      {"endpoint": "/api/v1/pumps/performance", "count": 32},
      {"endpoint": "/api/v1/heat-transfer/lmtd", "count": 28}
    ],
    "dailyUsage": [...]
  },
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

---

## ⚡ **System Endpoints**

### **Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-09-18T19:51:39.027Z",
  "uptime": 123456.789,
  "version": "2.0.0",
  "memory": {
    "rss": 93143040,
    "heapTotal": 20025344,
    "heapUsed": 17263856,
    "external": 2370223
  }
}
```

### **API Information**
```http
GET /
```

**Response:**
```json
{
  "status": "ok",
  "message": "EngiVault API v2.0 is running",
  "documentation": "/documentation",
  "health": "/health",
  "version": "2.0.0"
}
```

### **API Documentation**
```http
GET /documentation
```
Interactive Swagger/OpenAPI documentation interface.

---

## 🚨 **Error Handling**

### **Standard Error Response**
```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

### **HTTP Status Codes**

| Code | Meaning | Description |
|------|---------|-------------|
| **200** | OK | Request successful |
| **400** | Bad Request | Invalid input parameters |
| **401** | Unauthorized | Invalid or missing authentication |
| **404** | Not Found | Endpoint does not exist |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server-side error |

### **Common Error Messages**

#### **Validation Errors**
```json
{
  "success": false,
  "error": "body must have required property 'flowRate'",
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

#### **Authentication Errors**
```json
{
  "success": false,
  "error": "Invalid or expired JWT token",
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

#### **Rate Limit Errors**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "timestamp": "2025-09-18T19:51:39.027Z"
}
```

---

## 📊 **Rate Limits**

### **Subscription Tiers**

| Tier | Monthly Requests | Daily Requests | Per-Minute | Price |
|------|------------------|----------------|------------|-------|
| **Free** | 100 | 10 | 5 | $0 |
| **Basic** | 1,000 | 50 | 10 | $29/month |
| **Pro** | 10,000 | 500 | 50 | $99/month |
| **Enterprise** | 100,000 | 5,000 | 250 | $299/month |

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

---

## 🔧 **Request/Response Patterns**

### **Standard Request Format**
```json
{
  "parameter1": value1,
  "parameter2": value2,
  "optionalParameter": value3
}
```

### **Standard Response Format**
```json
{
  "success": true,
  "data": {
    "result1": value1,
    "result2": value2,
    "result3": value3
  },
  "timestamp": "ISO 8601 timestamp"
}
```

### **Parameter Validation**
- **Required parameters**: Must be present and valid
- **Optional parameters**: Use defaults if not provided
- **Type validation**: Numbers, strings, objects as specified
- **Range validation**: Physical limits enforced
- **Unit consistency**: All parameters in SI units

---

## 🌐 **CORS & Security**

### **CORS Headers**
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### **Security Features**
- **HTTPS only**: All communication encrypted
- **JWT authentication**: Secure token-based auth
- **Rate limiting**: Prevent abuse
- **Input validation**: Prevent injection attacks
- **Error sanitization**: No sensitive data in error messages

---

## 🚀 **Performance**

### **Response Times**
- **Simple calculations**: < 100ms (pressure drop, Reynolds number)
- **Iterative calculations**: < 500ms (flow rate, normal depth)
- **Complex calculations**: < 1000ms (heat exchanger sizing)
- **Batch operations**: Linear scaling with request count

### **Reliability**
- **Uptime**: 99.9% target
- **Error rate**: < 0.1% for valid requests
- **Timeout**: 30 seconds maximum
- **Retry logic**: Exponential backoff recommended

---

## 📚 **SDK Integration**

### **Python SDK**
```python
import engivault

client = engivault.EngiVault(jwt_token="your-token")

# All API endpoints available as Python methods
result = client.hydraulics.pressure_drop(...)
result = client.pumps.performance(...)
result = client.heat_transfer.lmtd(...)
result = client.fluid_mechanics.open_channel_flow(...)
```

### **JavaScript/TypeScript SDK** (Future)
```javascript
import { EngiVault } from 'engivault-js';

const client = new EngiVault({ apiKey: 'your-key' });

const result = await client.hydraulics.pressureDrop({
  flowRate: 0.1,
  pipeDiameter: 0.1,
  // ...
});
```

---

## 🔍 **Testing & Validation**

### **API Testing**
```bash
# Health check
curl https://engivault-api-production.up.railway.app/health

# Pressure drop calculation
curl -X POST https://engivault-api-production.up.railway.app/api/v1/hydraulics/pressure-drop \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"flowRate": 0.1, "pipeDiameter": 0.1, "pipeLength": 100, "fluidDensity": 1000, "fluidViscosity": 0.001}'
```

### **Validation Data**
All calculations validated against:
- **Experimental data** from literature
- **Commercial software** (PIPEFLO, AFT Fathom, HTRI)
- **Hand calculations** using standard methods
- **Industry benchmarks** and best practices

---

## 📖 **OpenAPI Specification**

### **Interactive Documentation**
Visit: `https://engivault-api-production.up.railway.app/documentation`

### **OpenAPI Schema**
```yaml
openapi: 3.0.0
info:
  title: EngiVault Engineering Calculations API
  version: 2.0.0
  description: Comprehensive engineering calculations for hydraulics, pumps, heat transfer, and fluid mechanics
  
servers:
  - url: https://engivault-api-production.up.railway.app
    description: Production server

paths:
  /api/v1/hydraulics/pressure-drop:
    post:
      tags: [Hydraulics]
      summary: Calculate pressure drop
      description: Calculate pressure drop using Darcy-Weisbach equation
      # ... detailed schema
```

---

## 🔄 **Versioning**

### **API Versioning**
- **Current version**: v1
- **URL format**: `/api/v1/module/endpoint`
- **Backward compatibility**: Maintained for major versions
- **Deprecation policy**: 12 months notice for breaking changes

### **Version History**
- **v1.0**: Initial release (hydraulics, pumps)
- **v1.1**: Added heat transfer module
- **v1.2**: Added fluid mechanics module
- **v2.0**: Simplified architecture, Railway deployment

---

## 🤝 **Support & Community**

### **Getting Help**
- **Documentation**: This wiki and inline API docs
- **GitHub Issues**: [Report bugs and feature requests](https://github.com/Luqman-Ismat/engivault-api/issues)
- **Email Support**: support@engivault.com
- **Community Forum**: [GitHub Discussions](https://github.com/Luqman-Ismat/engivault-api/discussions)

### **Contributing**
- **Bug reports**: Use GitHub Issues with detailed reproduction steps
- **Feature requests**: Describe use case and proposed implementation
- **Code contributions**: Fork repository and submit pull requests
- **Documentation**: Help improve and expand documentation

---

**🌐 The EngiVault API provides a comprehensive, well-documented, and professionally implemented interface for engineering calculations, designed for reliability, performance, and ease of use.**
