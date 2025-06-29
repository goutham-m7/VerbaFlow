#!/bin/bash

# LinguaLive Quick Start Script
# This script sets up and runs the entire LinguaLive application locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 LinguaLive Quick Start${NC}"
echo "=========================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    local missing_tools=()
    
    if ! command_exists docker; then
        missing_tools+=("Docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_tools+=("Docker Compose")
    fi
    
    if ! command_exists git; then
        missing_tools+=("Git")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}Missing required tools:${NC}"
        for tool in "${missing_tools[@]}"; do
            echo -e "${RED}  - $tool${NC}"
        done
        echo ""
        echo -e "${YELLOW}Please install the missing tools and run this script again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All prerequisites are installed${NC}"
}

# Function to setup environment
setup_environment() {
    echo -e "${YELLOW}Setting up environment...${NC}"
    
    # Create .env files if they don't exist
    if [ ! -f "backend/.env" ]; then
        echo -e "${BLUE}Creating backend .env file...${NC}"
        cp backend/.env.example backend/.env 2>/dev/null || {
            cat > backend/.env << EOF
# Database Configuration
MONGODB_URI=mongodb://admin:password123@localhost:27017/lingualive?authSource=admin

# Redis Configuration
REDIS_URL=redis://:password123@localhost:6379/0

# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/google-credentials.json

# Application Configuration
DEBUG=true
HOST=0.0.0.0
PORT=8000

# Sentry Configuration (optional)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development

# 100ms Configuration (for video conferencing)
HMS_APP_ID=
HMS_APP_SECRET=
HMS_TEMPLATE_ID=
EOF
        }
    fi
    
    if [ ! -f "frontend/.env" ]; then
        echo -e "${BLUE}Creating frontend .env file...${NC}"
        cat > frontend/.env << EOF
# API Configuration
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000

# Sentry Configuration (optional)
REACT_APP_SENTRY_DSN=

# Feature Flags
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG=true
EOF
    fi
    
    # Create credentials directory
    mkdir -p backend/credentials
    
    echo -e "${GREEN}✓ Environment setup completed${NC}"
}

# Function to build and start services
start_services() {
    echo -e "${YELLOW}Starting LinguaLive services...${NC}"
    
    # Stop any existing containers
    echo -e "${BLUE}Stopping existing containers...${NC}"
    docker-compose down 2>/dev/null || true
    
    # Build and start services
    echo -e "${BLUE}Building and starting services...${NC}"
    docker-compose up -d --build
    
    echo -e "${GREEN}✓ Services started successfully${NC}"
}

# Function to wait for services
wait_for_services() {
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo -e "${BLUE}Attempt $attempt/$max_attempts - Checking services...${NC}"
        
        # Check backend
        if curl -f http://localhost:8000/health >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend is ready${NC}"
        else
            echo -e "${YELLOW}⏳ Backend not ready yet...${NC}"
            sleep 10
            attempt=$((attempt + 1))
            continue
        fi
        
        # Check frontend
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Frontend is ready${NC}"
        else
            echo -e "${YELLOW}⏳ Frontend not ready yet...${NC}"
            sleep 10
            attempt=$((attempt + 1))
            continue
        fi
        
        # Check MongoDB
        if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ MongoDB is ready${NC}"
        else
            echo -e "${YELLOW}⏳ MongoDB not ready yet...${NC}"
            sleep 10
            attempt=$((attempt + 1))
            continue
        fi
        
        # Check Redis
        if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Redis is ready${NC}"
        else
            echo -e "${YELLOW}⏳ Redis not ready yet...${NC}"
            sleep 10
            attempt=$((attempt + 1))
            continue
        fi
        
        echo -e "${GREEN}✓ All services are ready!${NC}"
        return 0
    done
    
    echo -e "${RED}✗ Services failed to start within the expected time${NC}"
    echo -e "${YELLOW}Check the logs with: docker-compose logs${NC}"
    return 1
}

# Function to run health checks
run_health_checks() {
    echo -e "${YELLOW}Running health checks...${NC}"
    
    # Backend health check
    echo -e "${BLUE}Checking backend health...${NC}"
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend health check passed${NC}"
    else
        echo -e "${RED}✗ Backend health check failed${NC}"
        return 1
    fi
    
    # Frontend health check
    echo -e "${BLUE}Checking frontend health...${NC}"
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend health check passed${NC}"
    else
        echo -e "${RED}✗ Frontend health check failed${NC}"
        return 1
    fi
    
    # API endpoints check
    echo -e "${BLUE}Checking API endpoints...${NC}"
    if curl -f http://localhost:8000/api/v1/health >/dev/null 2>&1; then
        echo -e "${GREEN}✓ API endpoints working${NC}"
    else
        echo -e "${RED}✗ API endpoints not working${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ All health checks passed${NC}"
}

# Function to show service information
show_service_info() {
    echo ""
    echo -e "${GREEN}🎉 LinguaLive is now running!${NC}"
    echo "================================"
    echo ""
    echo -e "${BLUE}Service URLs:${NC}"
    echo -e "  Frontend: ${GREEN}http://localhost:3000${NC}"
    echo -e "  Backend API: ${GREEN}http://localhost:8000${NC}"
    echo -e "  API Documentation: ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "  Health Check: ${GREEN}http://localhost:8000/health${NC}"
    echo ""
    echo -e "${BLUE}Monitoring:${NC}"
    echo -e "  Prometheus: ${GREEN}http://localhost:9090${NC}"
    echo -e "  Grafana: ${GREEN}http://localhost:3001${NC}"
    echo -e "  Kibana: ${GREEN}http://localhost:5601${NC}"
    echo ""
    echo -e "${BLUE}Database:${NC}"
    echo -e "  MongoDB: ${GREEN}mongodb://localhost:27017${NC}"
    echo -e "  Redis: ${GREEN}redis://localhost:6379${NC}"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  View logs: ${YELLOW}docker-compose logs -f${NC}"
    echo -e "  Stop services: ${YELLOW}docker-compose down${NC}"
    echo -e "  Restart services: ${YELLOW}docker-compose restart${NC}"
    echo -e "  Access backend shell: ${YELLOW}docker-compose exec backend bash${NC}"
    echo -e "  Access frontend shell: ${YELLOW}docker-compose exec frontend sh${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. Open ${GREEN}http://localhost:3000${NC} in your browser"
    echo -e "  2. Try the LinguaLive translation feature"
    echo -e "  3. Test the LinguaLive Meet video conferencing"
    echo -e "  4. Check the API documentation at ${GREEN}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "${YELLOW}Note: For production deployment, see docs/deployment-guide.md${NC}"
}

# Function to handle cleanup
cleanup() {
    echo ""
    echo -e "${YELLOW}Cleaning up...${NC}"
    docker-compose down
    echo -e "${GREEN}✓ Cleanup completed${NC}"
}

# Main function
main() {
    # Set up signal handlers
    trap cleanup EXIT
    trap 'echo -e "\n${RED}Interrupted by user${NC}"; cleanup; exit 1' INT TERM
    
    # Check prerequisites
    check_prerequisites
    
    # Setup environment
    setup_environment
    
    # Start services
    start_services
    
    # Wait for services to be ready
    if ! wait_for_services; then
        echo -e "${RED}Failed to start services${NC}"
        exit 1
    fi
    
    # Run health checks
    if ! run_health_checks; then
        echo -e "${RED}Health checks failed${NC}"
        exit 1
    fi
    
    # Show service information
    show_service_info
    
    # Keep the script running
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    while true; do
        sleep 1
    done
}

# Run main function
main "$@" 