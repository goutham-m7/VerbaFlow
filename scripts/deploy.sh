#!/bin/bash

# LinguaLive Deployment Script
# Usage: ./deploy.sh [environment] [platform]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-staging}
PLATFORM=${2:-docker}
VERSION=$(git describe --tags --always --dirty)

# Configuration
case $ENVIRONMENT in
  "local")
    BACKEND_URL="http://localhost:8000"
    FRONTEND_URL="http://localhost:3000"
    ;;
  "staging")
    BACKEND_URL="https://api-staging.lingualive.com"
    FRONTEND_URL="https://staging.lingualive.com"
    ;;
  "production")
    BACKEND_URL="https://api.lingualive.com"
    FRONTEND_URL="https://www.lingualive.com"
    ;;
  *)
    echo -e "${RED}Invalid environment: $ENVIRONMENT${NC}"
    echo "Usage: $0 [local|staging|production] [docker|azure|kubernetes|vercel]"
    exit 1
    ;;
esac

echo -e "${BLUE}🚀 Deploying LinguaLive to $ENVIRONMENT on $PLATFORM${NC}"
echo -e "${BLUE}Version: $VERSION${NC}"
echo -e "${BLUE}Backend URL: $BACKEND_URL${NC}"
echo -e "${BLUE}Frontend URL: $FRONTEND_URL${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed${NC}"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed${NC}"
        exit 1
    fi
    
    # Check if required files exist
    if [ ! -f "backend/requirements.txt" ]; then
        echo -e "${RED}backend/requirements.txt not found${NC}"
        exit 1
    fi
    
    if [ ! -f "frontend/package.json" ]; then
        echo -e "${RED}frontend/package.json not found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Prerequisites check passed${NC}"
}

# Function to build Docker images
build_images() {
    echo -e "${YELLOW}Building Docker images...${NC}"
    
    # Build backend image
    echo -e "${BLUE}Building backend image...${NC}"
    docker build -t lingualive-backend:$VERSION ./backend
    docker tag lingualive-backend:$VERSION lingualive-backend:latest
    
    # Build frontend image
    echo -e "${BLUE}Building frontend image...${NC}"
    docker build -t lingualive-frontend:$VERSION ./frontend
    docker tag lingualive-frontend:$VERSION lingualive-frontend:latest
    
    echo -e "${GREEN}✓ Docker images built successfully${NC}"
}

# Function to run tests
run_tests() {
    echo -e "${YELLOW}Running tests...${NC}"
    
    # Backend tests
    echo -e "${BLUE}Running backend tests...${NC}"
    cd backend
    python -m pytest tests/ -v --cov=app --cov-report=term-missing
    cd ..
    
    # Frontend tests
    echo -e "${BLUE}Running frontend tests...${NC}"
    cd frontend
    npm test -- --coverage --watchAll=false
    cd ..
    
    echo -e "${GREEN}✓ Tests passed${NC}"
}

# Function to deploy with Docker Compose
deploy_docker() {
    echo -e "${YELLOW}Deploying with Docker Compose...${NC}"
    
    # Stop existing containers
    docker-compose down
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    echo -e "${BLUE}Waiting for services to be healthy...${NC}"
    sleep 30
    
    # Check health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
    else
        echo -e "${RED}✗ Backend health check failed${NC}"
        exit 1
    fi
    
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is healthy${NC}"
    else
        echo -e "${RED}✗ Frontend health check failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker deployment completed${NC}"
}

# Function to deploy to Azure
deploy_azure() {
    echo -e "${YELLOW}Deploying to Azure...${NC}"
    
    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        echo -e "${RED}Azure CLI is not installed${NC}"
        exit 1
    fi
    
    # Login to Azure
    echo -e "${BLUE}Logging in to Azure...${NC}"
    az login
    
    # Deploy backend
    echo -e "${BLUE}Deploying backend to Azure App Service...${NC}"
    az webapp config container set \
        --name lingualive-$ENVIRONMENT \
        --resource-group lingualive-rg \
        --docker-custom-image-name lingualive-backend:$VERSION
    
    # Deploy frontend
    echo -e "${BLUE}Deploying frontend to Azure Static Web Apps...${NC}"
    cd frontend
    npm run build
    az staticwebapp create \
        --name lingualive-$ENVIRONMENT-frontend \
        --resource-group lingualive-rg \
        --source . \
        --location eastus
    
    cd ..
    
    echo -e "${GREEN}✓ Azure deployment completed${NC}"
}

# Function to deploy to Kubernetes
deploy_kubernetes() {
    echo -e "${YELLOW}Deploying to Kubernetes...${NC}"
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}kubectl is not installed${NC}"
        exit 1
    fi
    
    # Apply Kubernetes manifests
    echo -e "${BLUE}Applying Kubernetes manifests...${NC}"
    kubectl apply -f deployment/kubernetes/k8s-deployment.yaml
    
    # Wait for deployment to be ready
    echo -e "${BLUE}Waiting for deployment to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=300s deployment/backend-deployment -n lingualive
    kubectl wait --for=condition=available --timeout=300s deployment/frontend-deployment -n lingualive
    
    echo -e "${GREEN}✓ Kubernetes deployment completed${NC}"
}

# Function to deploy to Vercel
deploy_vercel() {
    echo -e "${YELLOW}Deploying to Vercel...${NC}"
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}Vercel CLI is not installed${NC}"
        exit 1
    fi
    
    # Deploy frontend to Vercel
    echo -e "${BLUE}Deploying frontend to Vercel...${NC}"
    cd frontend
    
    # Set environment variables
    export REACT_APP_API_URL=$BACKEND_URL
    export REACT_APP_WS_URL=${BACKEND_URL/http/ws}
    
    # Deploy
    vercel --prod
    
    cd ..
    
    echo -e "${GREEN}✓ Vercel deployment completed${NC}"
}

# Function to run security scan
security_scan() {
    echo -e "${YELLOW}Running security scan...${NC}"
    
    # Run Trivy vulnerability scanner
    if command -v trivy &> /dev/null; then
        echo -e "${BLUE}Running Trivy vulnerability scan...${NC}"
        trivy fs --severity HIGH,CRITICAL .
    else
        echo -e "${YELLOW}Trivy not installed, skipping security scan${NC}"
    fi
    
    echo -e "${GREEN}✓ Security scan completed${NC}"
}

# Function to run performance test
performance_test() {
    echo -e "${YELLOW}Running performance test...${NC}"
    
    # Run Lighthouse CI
    if command -v lhci &> /dev/null; then
        echo -e "${BLUE}Running Lighthouse CI...${NC}"
        lhci autorun
    else
        echo -e "${YELLOW}Lighthouse CI not installed, skipping performance test${NC}"
    fi
    
    echo -e "${GREEN}✓ Performance test completed${NC}"
}

# Function to create deployment summary
create_summary() {
    echo ""
    echo -e "${GREEN}🎉 Deployment Summary${NC}"
    echo "=================="
    echo -e "Environment: ${BLUE}$ENVIRONMENT${NC}"
    echo -e "Platform: ${BLUE}$PLATFORM${NC}"
    echo -e "Version: ${BLUE}$VERSION${NC}"
    echo -e "Backend URL: ${BLUE}$BACKEND_URL${NC}"
    echo -e "Frontend URL: ${BLUE}$FRONTEND_URL${NC}"
    echo -e "Deployment Time: ${BLUE}$(date)${NC}"
    echo ""
    
    # Save deployment info
    cat > deployment-info.txt << EOF
Environment: $ENVIRONMENT
Platform: $PLATFORM
Version: $VERSION
Backend URL: $BACKEND_URL
Frontend URL: $FRONTEND_URL
Deployment Time: $(date)
EOF
    
    echo -e "${GREEN}Deployment info saved to deployment-info.txt${NC}"
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting LinguaLive deployment...${NC}"
    
    # Check prerequisites
    check_prerequisites
    
    # Run tests
    run_tests
    
    # Build images
    build_images
    
    # Run security scan
    security_scan
    
    # Deploy based on platform
    case $PLATFORM in
        "docker")
            deploy_docker
            ;;
        "azure")
            deploy_azure
            ;;
        "kubernetes")
            deploy_kubernetes
            ;;
        "vercel")
            deploy_vercel
            ;;
        *)
            echo -e "${RED}Invalid platform: $PLATFORM${NC}"
            echo "Usage: $0 [local|staging|production] [docker|azure|kubernetes|vercel]"
            exit 1
            ;;
    esac
    
    # Run performance test
    performance_test
    
    # Create summary
    create_summary
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
}

# Run main function
main "$@" 