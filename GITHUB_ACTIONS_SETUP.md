# GitHub Actions CI/CD Setup Guide

This guide covers setting up a complete CI/CD pipeline for your Nx application with JWT authentication using GitHub Actions.

## 🏗️ Pipeline Overview

### Workflow Structure
```
CI/CD Pipeline (Main)
├── Test and Build
├── Security Scan
├── Deploy to Staging (develop branch)
└── Deploy to Production (main branch)

Deployment Workflows (Triggered by main CI/CD)
├── Deploy to AWS
├── Deploy with Docker
├── Deploy to GCP
└── Deploy to Azure
```

## 🔧 Setup Instructions

### 1. Repository Configuration

#### Enable GitHub Actions
1. Go to your repository settings
2. Navigate to "Actions" → "General"
3. Enable "Allow all actions and reusable workflows"
4. Save changes

#### Branch Protection Rules
1. Go to "Branches" in repository settings
2. Add rule for `main` branch:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
   - ✅ Require conversation resolution before merging

### 2. Environment Setup

#### Create Environments
1. Go to "Settings" → "Environments"
2. Create `staging` environment
3. Create `production` environment
4. Add protection rules if needed

#### Required Secrets

##### Global Secrets (Repository level)
```bash
# Application Configuration
REACT_APP_API_URL=https://your-api-domain.com/api
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-frontend-domain.com

# Nx Cloud (Optional)
NX_CLOUD_ACCESS_TOKEN=your-nx-cloud-token
```

##### AWS Deployment Secrets
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-s3-bucket-name
AWS_CLOUDFRONT_DISTRIBUTION_ID=your-cloudfront-distribution-id
AWS_CLOUDFRONT_DOMAIN=your-cloudfront-domain.com
```

##### Docker Deployment Secrets
```bash
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password
SERVER_HOST=your-server-ip
SERVER_USERNAME=your-server-username
SERVER_SSH_KEY=your-private-ssh-key
DOMAIN=your-domain.com
```

##### GCP Deployment Secrets
```bash
GCP_PROJECT_ID=your-gcp-project-id
GCP_SA_KEY=your-service-account-key-json
GCP_REGION=us-central1
```

##### Azure Deployment Secrets
```bash
AZURE_CREDENTIALS=your-azure-credentials-json
AZURE_REGISTRY=your-registry-name
AZURE_REGISTRY_USERNAME=your-registry-username
AZURE_REGISTRY_PASSWORD=your-registry-password
AZURE_RESOURCE_GROUP=your-resource-group
AZURE_LOCATION=eastus
```

### 3. Workflow Configuration

#### Main CI/CD Pipeline
The main pipeline (`ci.yml`) runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
1. **Test and Build** - Runs tests, linting, and builds the application
2. **Security Scan** - Runs security audits
3. **Deploy to Staging** - Deploys to staging environment (develop branch)
4. **Deploy to Production** - Deploys to production environment (main branch)

#### Deployment Workflows
Deployment workflows are triggered by the successful completion of the main CI/CD pipeline:

- `deploy-aws.yml` - Deploy to AWS S3 + CloudFront
- `deploy-docker.yml` - Deploy with Docker to server
- `deploy-gcp.yml` - Deploy to Google Cloud Platform
- `deploy-azure.yml` - Deploy to Microsoft Azure

## 🚀 Deployment Options

### Option 1: AWS S3 + CloudFront (Recommended for Static Sites)

#### Prerequisites
1. AWS Account with S3 and CloudFront access
2. S3 bucket configured for static website hosting
3. CloudFront distribution set up

#### Setup Steps
```bash
# 1. Create S3 bucket
aws s3 mb s3://your-app-bucket-name

# 2. Configure bucket for static hosting
aws s3 website s3://your-app-bucket-name --index-document index.html --error-document index.html

# 3. Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json

# 4. Set up GitHub secrets (see above)
```

#### Benefits
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Cost-effective
- ✅ High availability

### Option 2: Docker Deployment (Full Control)

#### Prerequisites
1. Docker Hub account or private registry
2. Server with Docker and Docker Compose installed
3. SSH access to server

#### Setup Steps
```bash
# 1. Create deployment directory on server
mkdir -p /opt/loyalty

# 2. Copy docker-compose.yml to server
scp deploy/docker-compose.yml user@server:/opt/loyalty/

# 3. Set up SSL certificate (optional)
# 4. Configure nginx reverse proxy (optional)
```

#### Benefits
- ✅ Full control over infrastructure
- ✅ Easy rollback
- ✅ Scalable
- ✅ Database integration ready

### Option 3: Google Cloud Platform

#### Prerequisites
1. GCP project with billing enabled
2. Service account with necessary permissions
3. Cloud Run API enabled

#### Setup Steps
```bash
# 1. Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 2. Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# 3. Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"
```

#### Benefits
- ✅ Serverless
- ✅ Auto-scaling
- ✅ Pay-per-use
- ✅ Google Cloud integration

### Option 4: Microsoft Azure

#### Prerequisites
1. Azure subscription
2. Azure Container Registry
3. Resource group created

#### Setup Steps
```bash
# 1. Create resource group
az group create --name your-resource-group --location eastus

# 2. Create container registry
az acr create --resource-group your-resource-group \
  --name yourregistryname --sku Basic

# 3. Get credentials
az acr credential show --name yourregistryname
```

#### Benefits
- ✅ Enterprise-grade
- ✅ Windows integration
- ✅ Hybrid cloud support
- ✅ Comprehensive monitoring

## 🔄 Workflow Triggers

### Automatic Triggers
- **Push to `main`** → Full CI/CD + Production deployment
- **Push to `develop`** → Full CI/CD + Staging deployment
- **Pull Request** → CI/CD without deployment

### Manual Triggers
You can also trigger workflows manually:

1. Go to "Actions" tab in your repository
2. Select the workflow you want to run
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## 📊 Monitoring and Notifications

### Status Checks
The pipeline includes several status checks:
- ✅ Linting
- ✅ Unit tests
- ✅ Security audit
- ✅ Build success
- ✅ Deployment health

### Notifications
Configure notifications in repository settings:
1. Go to "Settings" → "Notifications"
2. Configure email/webhook notifications
3. Set up Slack/Discord integration if needed

## 🧪 Testing the Pipeline

### Local Testing
```bash
# Test build locally
npm run build:dv:prod

# Test Docker build
docker build -f deploy/Dockerfile.frontend .
docker build -f deploy/Dockerfile.backend .

# Test deployment script
./deploy.sh docker
```

### Pipeline Testing
1. Create a feature branch
2. Make a small change
3. Push to trigger CI
4. Create PR to `develop` for staging test
5. Merge to `main` for production test

## 🔒 Security Considerations

### Secrets Management
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate secrets regularly
- ✅ Use least privilege principle
- ✅ Monitor secret usage

### Pipeline Security
- ✅ Use official GitHub Actions
- ✅ Pin action versions
- ✅ Review third-party actions
- ✅ Enable branch protection

### Deployment Security
- ✅ Use HTTPS everywhere
- ✅ Implement proper CORS
- ✅ Set up security headers
- ✅ Monitor for vulnerabilities

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check Node.js version
node --version

# Clear cache
npx nx reset

# Check dependencies
npm ci --legacy-peer-deps
```

#### Deployment Failures
```bash
# Check secrets configuration
# Verify environment variables
# Test deployment manually
# Check service permissions
```

#### Performance Issues
```bash
# Optimize build
npm run build:dv:prod

# Check bundle size
npx nx build dv --prod --stats-json

# Analyze dependencies
npm audit
```

### Debugging Workflows
1. Go to "Actions" tab
2. Click on failed workflow
3. Click on failed job
4. Review logs for errors
5. Check environment variables

## 📈 Optimization

### Build Optimization
- Enable Nx Cloud for distributed builds
- Use build caching
- Optimize bundle size
- Implement code splitting

### Deployment Optimization
- Use multi-stage Docker builds
- Implement blue-green deployments
- Set up health checks
- Configure auto-scaling

## 🎯 Best Practices

### Code Quality
- ✅ Write comprehensive tests
- ✅ Use TypeScript for type safety
- ✅ Follow linting rules
- ✅ Review code before merging

### Deployment
- ✅ Use semantic versioning
- ✅ Implement rollback strategy
- ✅ Monitor application health
- ✅ Set up alerting

### Security
- ✅ Regular security audits
- ✅ Keep dependencies updated
- ✅ Use secure communication
- ✅ Implement proper authentication

## 📞 Support

For issues with the CI/CD pipeline:
1. Check the workflow logs
2. Verify secrets configuration
3. Test locally first
4. Review GitHub Actions documentation

## 🎉 Success Checklist

- [ ] Repository configured with branch protection
- [ ] Environments created in GitHub
- [ ] All secrets configured
- [ ] Pipeline runs successfully
- [ ] Staging deployment works
- [ ] Production deployment works
- [ ] Monitoring and alerting set up
- [ ] Security measures implemented
- [ ] Documentation updated
- [ ] Team trained on workflow 