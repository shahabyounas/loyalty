# Deployment Guide for Loyalty Application

This guide covers deploying your Nx application with JWT authentication to various platforms.

## 🚀 Quick Deployment Options

### 1. Vercel (Recommended for Frontend)
### 2. Netlify (Alternative Frontend)
### 3. Firebase (Google Cloud)
### 4. Docker (Full Stack)
### 5. AWS/GCP/Azure (Enterprise)

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **Git** repository set up
3. **API Backend** deployed (or use the included server)
4. **Environment Variables** configured

## 🔧 Environment Setup

### Frontend Environment Variables

Create `.env` files for different environments:

```bash
# .env.production
REACT_APP_API_URL=https://your-api-domain.com/api
NODE_ENV=production

# .env.staging
REACT_APP_API_URL=https://your-staging-api.com/api
NODE_ENV=staging

# .env.development
REACT_APP_API_URL=http://localhost:3001/api
NODE_ENV=development
```

### Backend Environment Variables

```bash
# server/.env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=https://your-frontend-domain.com
```

## 🎯 Deployment Methods

### 1. Vercel Deployment

**Best for:** Frontend-only deployment with serverless functions

#### Setup
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
npm run deploy:vercel
```

#### Configuration
- Copy `deploy/vercel.json` to root
- Set environment variables in Vercel dashboard
- Configure custom domain if needed

#### Features
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Automatic deployments
- ✅ Preview deployments

### 2. Netlify Deployment

**Best for:** Static site hosting with form handling

#### Setup
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build the application
npm run build:dv

# Deploy
npm run deploy:netlify
```

#### Configuration
- Copy `deploy/netlify.toml` to root
- Set environment variables in Netlify dashboard
- Configure build settings

#### Features
- ✅ Free tier available
- ✅ Form handling
- ✅ Redirects and rewrites
- ✅ Branch deployments

### 3. Firebase Deployment

**Best for:** Google Cloud integration

#### Setup
```bash
# Install Firebase CLI
npm i -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init

# Deploy
npm run deploy:firebase
```

#### Configuration
- Copy `deploy/firebase.json` to root
- Configure Firebase project
- Set up hosting and functions

#### Features
- ✅ Google Cloud integration
- ✅ Serverless functions
- ✅ Real-time database
- ✅ Authentication services

### 4. Docker Deployment

**Best for:** Full-stack deployment with control

#### Setup
```bash
# Build and start containers
npm run deploy:docker

# Or build only
npm run deploy:docker:build

# Stop containers
npm run deploy:docker:down
```

#### Configuration
- Copy `deploy/docker-compose.yml` to root
- Copy Dockerfiles to `deploy/` directory
- Set environment variables in `.env`

#### Features
- ✅ Full control over infrastructure
- ✅ Easy local development
- ✅ Scalable architecture
- ✅ Database integration ready

### 5. AWS/GCP/Azure Deployment

**Best for:** Enterprise applications

#### AWS Deployment
```bash
# Using AWS Amplify
npm install -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish

# Using AWS S3 + CloudFront
aws s3 sync apps/dv/dist s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### GCP Deployment
```bash
# Using Google Cloud Run
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/loyalty-app
gcloud run deploy --image gcr.io/YOUR_PROJECT_ID/loyalty-app --platform managed
```

## 🔐 Backend API Deployment

### Option 1: Deploy with Frontend (Docker)
```bash
npm run deploy:docker
```

### Option 2: Deploy Separately

#### Vercel Serverless Functions
```javascript
// api/auth/login.js
const { login } = require('../../server/auth');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const result = await login(req.body.email, req.body.password);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

#### Railway/Render/Heroku
```bash
# Deploy to Railway
railway login
railway init
railway up

# Deploy to Render
# Connect GitHub repository and configure build settings

# Deploy to Heroku
heroku create your-app-name
git push heroku main
```

## 🧪 Testing Deployment

### 1. Build Test
```bash
# Test production build
npm run build:dv:prod

# Check build output
ls -la apps/dv/dist/
```

### 2. Local Docker Test
```bash
# Build and test locally
npm run deploy:docker:build
docker-compose -f deploy/docker-compose.yml up

# Test endpoints
curl http://localhost/api/health
curl http://localhost:3001/api/health
```

### 3. Authentication Test
```bash
# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password"}'

# Test protected endpoint
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Production Optimizations

### Frontend Optimizations
```javascript
// rsbuild.config.ts
export default defineConfig({
  output: {
    // Enable code splitting
    splitting: {
      chunks: 'all',
    },
    // Optimize bundle size
    minify: 'terser',
    // Enable gzip compression
    compress: true,
  },
  performance: {
    // Enable chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
});
```

### Backend Optimizations
```javascript
// server/server.js
const compression = require('compression');
const helmet = require('helmet');

app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false,
}));
```

## 📊 Monitoring and Logging

### Frontend Monitoring
```javascript
// Add error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: process.env.NODE_ENV,
});
```

### Backend Monitoring
```javascript
// Add logging middleware
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

## 🔒 Security Checklist

### Frontend Security
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] CSP headers configured
- [ ] XSS protection enabled
- [ ] CORS properly configured

### Backend Security
- [ ] JWT secret is strong and unique
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection protection
- [ ] CORS configured for production domains

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
npx nx reset
npm run build:dv

# Check for missing dependencies
npm install --legacy-peer-deps
```

#### API Connection Issues
```bash
# Check API URL configuration
echo $REACT_APP_API_URL

# Test API endpoint
curl https://your-api-domain.com/api/health
```

#### Docker Issues
```bash
# Clean up Docker
docker system prune -a
docker-compose -f deploy/docker-compose.yml down -v

# Rebuild from scratch
npm run deploy:docker:build
```

## 📈 Scaling Considerations

### Frontend Scaling
- Use CDN for static assets
- Implement service workers for caching
- Enable code splitting
- Optimize bundle size

### Backend Scaling
- Use load balancers
- Implement database connection pooling
- Add Redis for session storage
- Use horizontal scaling

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:dv:prod
      - run: npm run deploy:vercel
```

## 📞 Support

For deployment issues:
1. Check the platform-specific documentation
2. Review environment variable configuration
3. Test locally with Docker first
4. Check network connectivity and CORS settings

## 🎉 Success Checklist

- [ ] Frontend builds successfully
- [ ] Backend API is accessible
- [ ] Authentication works end-to-end
- [ ] HTTPS is enabled
- [ ] Environment variables are set
- [ ] Monitoring is configured
- [ ] Error tracking is active
- [ ] Performance is optimized
- [ ] Security measures are in place 