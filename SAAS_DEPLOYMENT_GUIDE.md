# EngiVault SaaS Deployment Guide

This guide walks you through deploying your EngiVault API as a SaaS platform with authentication and hosting.

## 🚀 Quick Start (Railway - Recommended)

Railway is the easiest way to get your SaaS API running in production.

### Step 1: Setup Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize Railway Project**:
   ```bash
   railway init
   ```

3. **Add PostgreSQL Database**:
   ```bash
   railway add postgresql
   ```

4. **Set Environment Variables**:
   ```bash
   # Get database URL
   railway variables
   
   # Set additional environment variables
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your-super-secret-jwt-key-here
   railway variables set JWT_EXPIRES_IN=7d
   railway variables set BCRYPT_ROUNDS=12
   railway variables set API_KEY_LENGTH=32
   
   # Optional email configuration
   railway variables set EMAIL_HOST=smtp.gmail.com
   railway variables set EMAIL_PORT=587
   railway variables set EMAIL_USER=your-email@gmail.com
   railway variables set EMAIL_PASS=your-app-password
   ```

### Step 2: Deploy

```bash
# Deploy to Railway
railway up
```

Railway will automatically:
- Build your Docker container
- Start your API server
- Provide HTTPS endpoint

**Important**: You need to run database migrations and seeding manually:
```bash
# Connect to your Railway project
railway connect

# Run database migrations
railway run npm run db:migrate

# Seed initial data (subscription plans)
railway run npm run db:seed
```

### Step 3: Initialize Database

After deployment, run the database initialization:

```bash
# Connect to your Railway deployment
railway shell

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed initial data (subscription plans and materials)
npm run db:seed
```

This will create all necessary tables:
- Users and authentication
- API keys and usage tracking
- Projects and tasks
- User calculations tracking
- Materials database
- Subscription plans

## 🌐 Alternative Hosting Options

### Option 1: Render (Free Tier Available)

1. **Connect GitHub Repository**:
   - Go to [render.com](https://render.com)
   - Connect your GitHub repository
   - Create a new Web Service

2. **Configure Service**:
   ```yaml
   Build Command: npm install && npm run build
   Start Command: npm run db:deploy && npm start
   Environment: Node
   ```

3. **Add Database**:
   - Create PostgreSQL database in Render
   - Set `DATABASE_URL` environment variable

4. **Environment Variables**:
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret-key
   BCRYPT_ROUNDS=12
   API_KEY_LENGTH=32
   ```

### Option 2: DigitalOcean App Platform

1. **Create App**:
   - Go to DigitalOcean App Platform
   - Connect GitHub repository
   - Select Node.js environment

2. **Add Database**:
   - Add PostgreSQL database component
   - Set connection string

3. **Configure Build**:
   ```yaml
   Build Command: npm install && npm run build
   Run Command: npm run db:deploy && npm start
   ```

### Option 3: AWS (Enterprise Scale)

1. **Setup ECS/Fargate**:
   ```bash
   # Create ECS cluster
   aws ecs create-cluster --cluster-name engivault-api
   
   # Create task definition
   aws ecs register-task-definition --cli-input-json file://task-definition.json
   ```

2. **Setup RDS PostgreSQL**:
   ```bash
   # Create RDS instance
   aws rds create-db-instance \
     --db-instance-identifier engivault-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username admin \
     --master-user-password your-password
   ```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
API_KEY_LENGTH=32

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Logging
LOG_LEVEL=info
LOG_PRETTY_PRINT=false
REDACT_PII=true

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000

# Performance
ENABLE_COMPRESSION=true
ENABLE_CACHING=true
ENABLE_METRICS=true
```

### Optional Environment Variables

```bash
# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment (Stripe integration)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📊 Database Setup

### Local Development

```bash
# 1. Copy environment file
cp env.example .env

# 2. Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/engivault"

# 3. Generate Prisma client
npm run db:generate

# 4. Run migrations
npm run db:migrate

# 5. Seed initial data
npm run db:seed

# 6. Start development server
npm run dev
```

### Production Deployment

```bash
# 1. Generate Prisma client
npm run db:generate

# 2. Run production migrations
npm run db:deploy

# 3. Seed subscription plans
npm run db:seed

# 4. Start production server
npm start
```

## 🔐 Security Checklist

### Before Going Live

- [ ] **Change JWT Secret**: Use a cryptographically secure random string
- [ ] **Database Security**: Use strong passwords and restrict access
- [ ] **HTTPS Only**: Ensure all traffic uses HTTPS
- [ ] **Environment Variables**: Never commit secrets to git
- [ ] **Rate Limiting**: Configure appropriate limits for your use case
- [ ] **Logging**: Enable structured logging for monitoring
- [ ] **Backup Strategy**: Set up regular database backups

### Security Headers

Your API automatically includes:
- CORS protection
- Rate limiting per API key
- Request/response logging
- PII data redaction
- Input validation with Zod

## 📈 Monitoring & Analytics

### Built-in Monitoring

Your SaaS API includes:
- **Request Metrics**: Response times, status codes, usage patterns
- **User Analytics**: Per-user usage statistics
- **API Key Tracking**: Individual key performance
- **Rate Limit Monitoring**: Usage against limits

### Access Analytics

```bash
# Get usage statistics
GET /analytics/usage?days=30&groupBy=day
Authorization: Bearer your-api-key

# Get API key statistics
GET /analytics/api-keys
Authorization: Bearer your-api-key

# Get subscription limits
GET /analytics/limits
Authorization: Bearer your-api-key
```

### External Monitoring

Consider adding:
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, Bugsnag
- **Performance Monitoring**: New Relic, DataDog
- **Log Aggregation**: LogRocket, Papertrail

## 💰 Pricing Strategy Implementation

### Subscription Tiers

Your API includes 4 subscription tiers:

| Tier | Price | Requests/Month | Requests/Day | Features |
|------|-------|----------------|--------------|----------|
| Free | $0 | 1,000 | 100 | Basic calculations |
| Basic | $29 | 10,000 | 500 | All calculations, email support |
| Pro | $99 | 100,000 | 2,000 | Advanced analytics, webhooks |
| Enterprise | $299 | 1,000,000 | 10,000 | Custom features, SLA |

### Rate Limiting by Tier

Rate limits are automatically enforced:
- **Per-minute limits**: Based on subscription tier
- **Daily limits**: Reset at midnight UTC
- **Monthly limits**: Reset on the 1st of each month

## 🚀 Testing Your Deployment

### 1. Health Check

```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "version": "1.0.0",
  "memory": { ... }
}
```

### 2. User Registration

```bash
curl -X POST https://your-domain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123",
    "companyName": "Test Company"
  }'
```

### 3. API Key Usage

```bash
curl -X POST https://your-domain.com/api/v1/hydraulics/pressure-drop \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "Q": 0.1,
    "L": 100,
    "D": 0.1,
    "roughness": 0.000045,
    "fluid": "water",
    "units": "SI"
  }'
```

### 4. Analytics Check

```bash
curl https://your-domain.com/analytics/usage \
  -H "X-API-Key: your-api-key-here"
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Railway
        uses: railway-app/railway-deploy@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
```

## 🗄️ Database Schema Overview

### Core Tables

#### Users & Authentication
- **users**: User accounts with subscription tiers
- **api_keys**: API access keys with rate limiting
- **subscription_plans**: Available subscription tiers

#### Project Management (Pro/Enterprise)
- **projects**: Project lifecycle and team management
- **tasks**: Task management with phases and sprints
- **user_calculations**: Calculation tracking and analytics

#### Materials Database
- Materials data is stored in-memory (50+ materials)
- Accessible via `/materials` endpoints
- Categories: Metal, Polymer, Ceramic, Composite, Wood, Other

### Database Migrations
```bash
# Generate new migration after schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Reset database (development only)
npm run db:reset
```

### Seeding Data
```bash
# Seed subscription plans and initial data
npm run db:seed
```

## 📋 Post-Deployment Checklist

### ✅ Essential Steps
- [ ] Database migrations completed
- [ ] Subscription plans seeded
- [ ] Environment variables configured
- [ ] HTTPS endpoint working
- [ ] API documentation accessible
- [ ] Health check endpoint responding

### ✅ Feature Testing
- [ ] User registration working
- [ ] API key generation working
- [ ] Rate limiting functioning
- [ ] Project management (Pro/Enterprise)
- [ ] Materials database accessible
- [ ] Calculation endpoints responding

### ✅ Monitoring Setup
- [ ] Application logs accessible
- [ ] Database connection stable
- [ ] Performance metrics tracked
- [ ] Error monitoring configured

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**:
   ```bash
   # Check DATABASE_URL format
   echo $DATABASE_URL
   # Should be: postgresql://user:password@host:port/database
   ```

2. **API Key Not Working**:
   ```bash
   # Check if API key is active
   GET /auth/api-keys
   # Verify X-API-Key header format
   ```

3. **Rate Limit Exceeded**:
   ```bash
   # Check current usage
   GET /analytics/limits
   # Upgrade subscription or wait for reset
   ```

4. **Migration Failed**:
   ```bash
   # Reset and re-run migrations
   npm run db:reset
   npm run db:migrate
   npm run db:seed
   ```

### Logs and Debugging

```bash
# Check application logs
railway logs

# Check database logs
railway logs --service postgresql

# Local debugging
npm run dev
# Check console output for errors
```

## 📞 Support

### Getting Help

1. **Check Documentation**: `/documentation` endpoint
2. **Review Logs**: Application and database logs
3. **Test Health**: `/health` endpoint
4. **Verify Environment**: All required variables set

### Emergency Procedures

1. **Rollback Deployment**: Use Railway/Render rollback features
2. **Database Backup**: Restore from latest backup
3. **Disable Authentication**: Temporarily disable auth middleware
4. **Scale Resources**: Increase memory/CPU if needed

---

## 🎉 You're Ready!

Your EngiVault API is now a fully functional SaaS platform with:
- ✅ User authentication and API key management
- ✅ Usage tracking and analytics
- ✅ Subscription-based rate limiting
- ✅ Production-ready hosting
- ✅ Comprehensive monitoring
- ✅ Security best practices

**Next Steps:**
1. Set up payment processing (Stripe)
2. Add email notifications
3. Implement advanced analytics dashboard
4. Add customer support features
5. Scale based on usage patterns

Your engineering calculation API is now ready to serve customers worldwide! 🌍
