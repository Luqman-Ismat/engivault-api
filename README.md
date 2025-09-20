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

## 🐍 Python SDK

The official Python SDK is located in the `python-sdk/` directory. It provides easy-to-use Python bindings for all API endpoints.

### Installation
```bash
cd python-sdk
pip install -e .
```

### Quick Start
```python
from engivault import EngiVaultClient

client = EngiVaultClient(api_key="your-api-key")
result = client.fluid_mechanics.pressure_drop(
    diameter=0.1,
    length=100,
    flow_rate=0.01,
    fluid_viscosity=0.001
)
print(result.pressure_drop)
```

See `python-sdk/README.md` for complete documentation.

## 📊 Excel Integration

The Excel integration is located in the `excel-integration/` directory and provides VBA modules for seamless Excel integration.

### Features
- Direct API calls from Excel formulas
- Pre-built calculation templates
- Automated data validation
- Chart generation capabilities

### Installation
1. Open Excel
2. Import the VBA modules from `excel-integration/vba-modules/`
3. Configure your API key in the settings

See `excel-integration/README.md` for complete documentation.

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