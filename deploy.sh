#!/bin/bash

# Loyalty Application Deployment Script
# Usage: ./deploy.sh [target] [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TARGET=${1:-"vercel"}
ENVIRONMENT=${2:-"production"}

echo -e "${BLUE}🚀 Loyalty Application Deployment${NC}"
echo -e "${YELLOW}Target: ${TARGET}${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install frontend dependencies
    npm ci --legacy-peer-deps
    
    # Install backend dependencies
    cd server
    npm ci --only=production
    cd ..
    
    print_status "Dependencies installed"
}

# Build application
build_application() {
    print_status "Building application..."
    
    # Set environment variables based on target
    case $TARGET in
        "vercel")
            export REACT_APP_API_URL="https://your-api-domain.com/api"
            ;;
        "netlify")
            export REACT_APP_API_URL="https://your-api-domain.com/api"
            ;;
        "firebase")
            export REACT_APP_API_URL="https://your-api-domain.com/api"
            ;;
        "docker")
            export REACT_APP_API_URL="http://backend:3001/api"
            ;;
        *)
            export REACT_APP_API_URL="http://localhost:3001/api"
            ;;
    esac
    
    # Build frontend
    npm run build:prod
    
    print_status "Application built successfully"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Copy vercel config
    cp deploy/vercel.json .
    
    # Deploy
    vercel --prod --yes
    
    print_status "Deployed to Vercel successfully"
}

# Deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        print_warning "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi
    
    # Copy netlify config
    cp deploy/netlify.toml .
    
    # Deploy
    netlify deploy --prod --dir=apps/dv/dist --yes
    
    print_status "Deployed to Netlify successfully"
}

# Deploy to Firebase
deploy_firebase() {
    print_status "Deploying to Firebase..."
    
    if ! command -v firebase &> /dev/null; then
        print_warning "Firebase CLI not found. Installing..."
        npm install -g firebase-tools
    fi
    
    # Copy firebase config
    cp deploy/firebase.json .
    
    # Deploy
    firebase deploy --only hosting --yes
    
    print_status "Deployed to Firebase successfully"
}

# Deploy with Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Copy docker files
    cp deploy/docker-compose.yml .
    cp deploy/Dockerfile.frontend deploy/
    cp deploy/Dockerfile.backend deploy/
    cp deploy/nginx.conf deploy/
    
    # Build and start containers
    docker-compose -f docker-compose.yml up -d --build
    
    print_status "Deployed with Docker successfully"
    print_status "Frontend: http://localhost"
    print_status "Backend: http://localhost:3001"
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    case $TARGET in
        "docker")
            # Test local deployment
            sleep 10  # Wait for containers to start
            
            # Test frontend
            if curl -f http://localhost/health &> /dev/null; then
                print_status "Frontend health check passed"
            else
                print_warning "Frontend health check failed"
            fi
            
            # Test backend
            if curl -f http://localhost:3001/api/health &> /dev/null; then
                print_status "Backend health check passed"
            else
                print_warning "Backend health check failed"
            fi
            ;;
        *)
            print_warning "Manual testing required for $TARGET deployment"
            ;;
    esac
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    check_prerequisites
    install_dependencies
    build_application
    
    case $TARGET in
        "vercel")
            deploy_vercel
            ;;
        "netlify")
            deploy_netlify
            ;;
        "firebase")
            deploy_firebase
            ;;
        "docker")
            deploy_docker
            test_deployment
            ;;
        *)
            print_error "Unknown deployment target: $TARGET"
            print_warning "Available targets: vercel, netlify, firebase, docker"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Configure environment variables in your deployment platform"
    echo "2. Set up custom domain if needed"
    echo "3. Test authentication flow"
    echo "4. Monitor application performance"
    echo ""
    echo -e "${YELLOW}For detailed instructions, see: DEPLOYMENT_GUIDE.md${NC}"
}

# Handle script arguments
case $1 in
    "help"|"-h"|"--help")
        echo "Usage: ./deploy.sh [target] [environment]"
        echo ""
        echo "Targets:"
        echo "  vercel    - Deploy to Vercel"
        echo "  netlify   - Deploy to Netlify"
        echo "  firebase  - Deploy to Firebase"
        echo "  docker    - Deploy with Docker"
        echo ""
        echo "Environments:"
        echo "  production  - Production deployment (default)"
        echo "  staging     - Staging deployment"
        echo "  development - Development deployment"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh vercel production"
        echo "  ./deploy.sh docker"
        echo "  ./deploy.sh netlify staging"
        exit 0
        ;;
esac

# Run main deployment
main 