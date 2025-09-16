# EngiVault API v2.0 - Railway Deployment Guide

## 🚀 Quick Deploy to Railway

### Prerequisites
- Railway account
- PostgreSQL database (Railway provides this)

### Step 1: Connect to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link your project
railway link
```

### Step 2: Add PostgreSQL Database
```bash
# Add PostgreSQL service
railway add postgresql
```

### Step 3: Set Environment Variables
```bash
# Set required environment variables
railway variables set JWT_SECRET=your-super-secret-jwt-key-change-this
railway variables set NODE_ENV=production
railway variables set LOG_LEVEL=info
```

### Step 4: Deploy
```bash
# Deploy to Railway
railway up
```

### Step 5: Setup Database
```bash
# Run database migrations
railway run npm run db:migrate

# Seed initial data
railway run npm run db:seed
```

## 🔧 Environment Variables

### Required Variables
- `DATABASE_URL` - Automatically set by Railway PostgreSQL
- `JWT_SECRET` - Your secret key for JWT tokens
- `NODE_ENV` - Set to `production`

### Optional Variables
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)
- `LOG_LEVEL` - Logging level (default: info)
- `RATE_LIMIT_MAX` - Rate limit per window (default: 100)
- `RATE_LIMIT_TIME_WINDOW` - Rate limit window in ms (default: 60000)

## 📊 Monitoring

### Health Check
- **Endpoint**: `https://your-app.railway.app/health`
- **Railway Health Check**: Automatically configured

### API Documentation
- **Swagger UI**: `https://your-app.railway.app/documentation`
- **OpenAPI JSON**: `https://your-app.railway.app/documentation/json`

## 🔒 Security

### Production Checklist
- [ ] Change `JWT_SECRET` to a secure random string
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins if needed
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy for PostgreSQL

### JWT Secret Generation
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📈 Performance

### Railway Optimizations
- **Auto-Detection**: Railway automatically detects Node.js project
- **Cold Start**: Optimized for Railway's cold start requirements
- **Memory**: Minimal memory footprint (~50MB)
- **CPU**: Efficient calculations with minimal CPU usage
- **Database**: Connection pooling with Prisma

### Scaling
- **Horizontal**: Railway automatically scales based on traffic
- **Vertical**: Upgrade Railway plan for more resources
- **Database**: Railway PostgreSQL scales automatically

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database URL
railway variables

# Test database connection
railway run npm run db:generate
```

#### Build Failed
```bash
# Check build logs
railway logs

# Test build locally
npm run build

# If Nixpacks issues, Railway will auto-detect Node.js
# No custom nixpacks.toml needed
```

#### Authentication Issues
```bash
# Verify JWT secret is set
railway variables get JWT_SECRET

# Check logs for auth errors
railway logs --follow
```

### Logs and Debugging
```bash
# View real-time logs
railway logs --follow

# View specific service logs
railway logs --service your-service-name
```

## 🔄 Updates and Maintenance

### Deploy Updates
```bash
# Deploy latest changes
railway up

# Run database migrations if needed
railway run npm run db:migrate
```

### Database Maintenance
```bash
# Access database
railway connect postgresql

# Backup database
railway run pg_dump $DATABASE_URL > backup.sql
```

## 📞 Support

### Railway Support
- **Documentation**: https://docs.railway.app
- **Community**: https://discord.gg/railway
- **Status**: https://status.railway.app

### EngiVault API Support
- **Documentation**: `/documentation` endpoint
- **Health Check**: `/health` endpoint
- **GitHub Issues**: Create an issue in the repository

---

**🎉 Your EngiVault API is now deployed and ready to serve engineering calculations!**
