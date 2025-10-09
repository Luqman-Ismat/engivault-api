# EngiVault API v2.0

A simplified, high-performance engineering calculations API optimized for Railway deployment.

## 🚀 Features

- **Core Engineering Calculations**: Pressure drop, pump performance, NPSH, flow rate
- **SaaS Authentication**: User registration, login, API key management
- **Subscription Tiers**: Free, Basic, Pro, Enterprise with usage limits
- **Analytics**: Usage tracking and performance monitoring
- **Python SDK**: Official Python SDK for easy integration
- **Excel Integration**: VBA modules for Excel integration
- **Railway Ready**: Optimized for Railway deployment
- **Type Safe**: Full TypeScript with Zod validation
- **Fast**: Built with Fastify for high performance

## 📊 Pricing Plans

| Plan | Price | Monthly Requests | Daily Requests | Per-Minute |
|------|-------|------------------|----------------|------------|
| **Free** | $0 | 100 | 10 | 5 |
| **Basic** | $29/month | 1,000 | 50 | 10 |
| **Pro** | $99/month | 10,000 | 500 | 50 |
| **Enterprise** | $299/month | 100,000 | 5,000 | 200 |

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Railway account (for deployment)

### Local Development

```bash
# Clone and install
git clone <repository-url>
cd engivault-api
npm install

# Setup environment
cp env.example .env
# Edit .env with your database URL and JWT secret

# Setup database
npm run setup

# Start development server
npm run dev
```

### Railway Deployment

1. **Connect to Railway**:
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   ```

2. **Add PostgreSQL**:
   ```bash
   railway add postgresql
   ```

3. **Set Environment Variables**:
   ```bash
   railway variables set JWT_SECRET=your-super-secret-jwt-key
   railway variables set NODE_ENV=production
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

## 📚 API Documentation

Once deployed, visit:
- **Swagger UI**: `https://your-app.railway.app/documentation`
- **Health Check**: `https://your-app.railway.app/health`

## 🐍 Python SDK (Simplified!)

The official Python SDK provides the simplest way to integrate engineering calculations.

### Installation
```bash
pip install engivault
```

### Quick Start - Just 3 Lines!
```python
import engivault as ev

ev.init('your-api-key')  # Initialize once

# Direct function calls!
result = ev.pressure_drop(flow_rate=0.01, pipe_diameter=0.1, pipe_length=100, 
                         fluid_density=1000, fluid_viscosity=0.001)
print(f"Pressure drop: {result['pressure_drop']} Pa")

# More examples
pump = ev.pump_power(flow_rate=0.05, head=50, efficiency=0.8)
lmtd = ev.lmtd(t_hot_in=373, t_hot_out=323, t_cold_in=293, t_cold_out=333)
```

See `python-sdk/README.md` for complete documentation.

## 📦 JavaScript/TypeScript SDK (Simplified!)

Modern JavaScript SDK with full TypeScript support.

### Installation
```bash
npm install engivault
```

### Quick Start
```javascript
const ev = require('engivault');

ev.init('your-api-key');  // Initialize once

// Direct function calls!
const result = await ev.pressureDrop({
  flowRate: 0.01,
  pipeDiameter: 0.1,
  pipeLength: 100,
  fluidDensity: 1000,
  fluidViscosity: 0.001
});

console.log(`Pressure drop: ${result.pressureDrop} Pa`);
```

See `packages/engivault-js/README.md` for complete documentation.

## 📊 Excel Office Add-in (New! Plugin-Based)

Modern Office Add-in that works across all Excel platforms - no VBA import needed!

### Features
- ✅ Works on Excel for Windows, Mac, Web, and iPad
- ✅ One-click installation (no VBA import)
- ✅ Built-in UI for configuration
- ✅ Auto-updating
- ✅ Sandboxed and secure

### Installation
1. Download `excel-addin/manifest.xml`
2. In Excel: Insert → My Add-ins → Upload My Add-in
3. Select the manifest file
4. Configure your API key in the task pane

### Usage in Excel
```excel
=ENGIVAULT.PRESSUREDROP(0.01, 0.1, 100, 1000, 0.001)
=ENGIVAULT.PUMPPOWER(0.05, 50, 0.8)
=ENGIVAULT.LMTD(373, 323, 293, 333, "counterflow")
=ENGIVAULT.VELOCITY(0.01, 0.1)
=ENGIVAULT.CONVERTFLOW(100, "gpm", "m3/s")
```

See `excel-addin/README.md` for complete documentation.

### Legacy VBA Integration (Still Available)

For users who prefer VBA macros, the traditional VBA modules are still available in `excel-integration/vba-modules/`. However, we recommend the new Office Add-in for better cross-platform compatibility.

See `excel-integration/README.md` for VBA documentation.

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET/POST /auth/api-keys` - API key management
- `DELETE /auth/api-keys/:id` - Revoke API key

### Calculation Endpoints
- `POST /api/v1/hydraulics/pressure-drop` - Pressure drop calculation
- `POST /api/v1/hydraulics/flow-rate` - Flow rate calculation
- `POST /api/v1/pumps/performance` - Pump performance calculation
- `POST /api/v1/pumps/npsh` - NPSH calculation

### Analytics Endpoints
- `GET /analytics/usage` - Usage statistics
- `GET /analytics/api-keys` - API key performance
- `GET /analytics/limits` - Subscription limits

## 🔧 Configuration

### Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000

# Logging
LOG_LEVEL=info
```

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📦 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run setup        # Setup database and seed data
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with initial data
```

## 🏗️ Architecture

### Core Components
- **Fastify**: High-performance web framework
- **TypeScript**: Type-safe development
- **Zod**: Runtime schema validation
- **Prisma**: Database ORM with PostgreSQL
- **JWT**: Secure authentication
- **bcrypt**: Password hashing

### Client Libraries
- **Python SDK**: Official Python client library (`python-sdk/`)
- **Excel Integration**: VBA modules for Excel integration (`excel-integration/`)

### Database Schema
- **Users**: Authentication and subscription management
- **API Keys**: API access control and rate limiting
- **API Usage**: Analytics and performance tracking
- **Subscription Plans**: Tier-based feature access

## 🚀 Performance

- **Fast Startup**: Optimized for Railway's cold start requirements
- **Low Memory**: Minimal memory footprint
- **High Throughput**: Fastify-based for maximum performance
- **Efficient Database**: Prisma with connection pooling

## 🔒 Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Per-user and per-API-key limits
- **Input Validation**: Zod schema validation
- **Error Handling**: Secure error responses

## 📈 Monitoring

- **Health Checks**: Built-in health monitoring
- **Usage Analytics**: Comprehensive usage tracking
- **Performance Metrics**: Response time monitoring
- **Error Logging**: Structured error logging with Pino

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Ensure build passes: `npm run build`
6. Submit a pull request

## 📄 License

ISC License

---

**🎉 EngiVault API v2.0**: Simplified, fast, and Railway-ready engineering calculations API with comprehensive SaaS features.