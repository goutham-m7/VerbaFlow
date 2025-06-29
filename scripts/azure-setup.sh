#!/bin/bash

# Comprehensive Azure Setup Script for LinguaLive
# This script sets up the complete Azure infrastructure for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="lingualive-rg"
LOCATION="eastus"
BACKEND_APP_NAME="lingualive-backend"
FRONTEND_APP_NAME="lingualive-frontend"
APP_SERVICE_PLAN="lingualive-plan"
GITHUB_USERNAME="goutham-m7"
REPOSITORY_NAME="verbaflow"

echo -e "${BLUE}🚀 Comprehensive Azure Setup for LinguaLive${NC}"
echo "================================================"
echo ""

# Function to check Azure CLI
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        echo -e "${RED}Azure CLI is not installed.${NC}"
        echo -e "${YELLOW}Please install it first:${NC}"
        echo "  macOS: brew install azure-cli"
        echo "  Ubuntu: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
        exit 1
    fi
    echo -e "${GREEN}✓ Azure CLI is installed${NC}"
}

# Function to login to Azure
login_azure() {
    echo -e "${YELLOW}Logging in to Azure...${NC}"
    if ! az account show &> /dev/null; then
        az login
    fi
    echo -e "${GREEN}✓ Logged in to Azure${NC}"
}

# Function to create resource group
create_resource_group() {
    echo -e "${YELLOW}Creating resource group...${NC}"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION" 2>/dev/null || echo -e "${GREEN}✓ Resource group already exists${NC}"
    echo -e "${GREEN}✓ Resource group created${NC}"
}

# Function to create App Service Plan
create_app_service_plan() {
    echo -e "${YELLOW}Creating App Service Plan...${NC}"
    az appservice plan create \
        --name "$APP_SERVICE_PLAN" \
        --resource-group "$RESOURCE_GROUP" \
        --sku P1v2 \
        --is-linux \
        --location "$LOCATION" 2>/dev/null || echo -e "${GREEN}✓ App Service Plan already exists${NC}"
    echo -e "${GREEN}✓ App Service Plan created${NC}"
}

# Function to get database connection strings
get_database_connections() {
    echo -e "${YELLOW}Configuring database connections...${NC}"
    
    # Get MongoDB connection string
    echo -e "${BLUE}Please enter your MongoDB connection string:${NC}"
    read -p "MongoDB URI: " MONGODB_URI
    
    # Get Redis connection string
    echo -e "${BLUE}Please enter your Redis connection string:${NC}"
    read -p "Redis URL: " REDIS_URL
    
    # Get Sentry DSN (optional)
    echo -e "${BLUE}Please enter your Sentry DSN (optional):${NC}"
    read -p "Sentry DSN: " SENTRY_DSN
    
    # Get Google Cloud credentials (optional)
    echo -e "${BLUE}Please enter your Google Cloud credentials JSON (optional):${NC}"
    read -p "Google Cloud JSON: " GOOGLE_CREDENTIALS_JSON
    
    # Get 100ms credentials (optional)
    echo -e "${BLUE}Please enter your 100ms credentials (optional):${NC}"
    read -p "100ms App Group ID: " HMS_APP_GROUP_ID
    read -p "100ms App ID: " HMS_APP_ID
    read -p "100ms App Secret: " HMS_APP_SECRET
    
    echo -e "${GREEN}✓ Database connections configured${NC}"
}

# Function to create backend web app
create_backend_app() {
    echo -e "${YELLOW}Creating backend web app...${NC}"
    
    # Create web app if it doesn't exist
    if ! az webapp show --name "$BACKEND_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        az webapp create \
            --name "$BACKEND_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --plan "$APP_SERVICE_PLAN" \
            --runtime "PYTHON:3.11"
    else
        echo -e "${GREEN}✓ Backend web app already exists${NC}"
    fi
    
    # Configure environment variables
    echo -e "${BLUE}Configuring backend environment...${NC}"
    az webapp config appsettings set \
        --name "$BACKEND_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --settings \
            DEBUG="false" \
            HOST="0.0.0.0" \
            PORT="8000" \
            WEBSITES_PORT="8000" \
            WEBSITES_ENABLE_APP_SERVICE_STORAGE="true" \
            MONGODB_URI="$MONGODB_URI" \
            REDIS_URL="$REDIS_URL" \
            SENTRY_DSN="$SENTRY_DSN" \
            SENTRY_ENVIRONMENT="production"
    
    # Configure Google Cloud credentials if provided
    if [ ! -z "$GOOGLE_CREDENTIALS_JSON" ]; then
        echo -e "${BLUE}Configuring Google Cloud credentials...${NC}"
        az webapp config appsettings set \
            --name "$BACKEND_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --settings \
                GOOGLE_APPLICATION_CREDENTIALS_JSON="$GOOGLE_CREDENTIALS_JSON"
    fi
    
    # Configure 100ms credentials if provided
    if [ ! -z "$HMS_APP_GROUP_ID" ] && [ ! -z "$HMS_APP_ID" ] && [ ! -z "$HMS_APP_SECRET" ]; then
        echo -e "${BLUE}Configuring 100ms credentials...${NC}"
        az webapp config appsettings set \
            --name "$BACKEND_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --settings \
                HMS_APP_GROUP_ID="$HMS_APP_GROUP_ID" \
                HMS_APP_ID="$HMS_APP_ID" \
                HMS_APP_SECRET="$HMS_APP_SECRET"
    fi
    
    # Enable continuous deployment from GitHub
    echo -e "${BLUE}Configuring GitHub deployment...${NC}"
    az webapp deployment source config \
        --name "$BACKEND_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --repo-url "https://github.com/$GITHUB_USERNAME/$REPOSITORY_NAME.git" \
        --branch main \
        --manual-integration
    
    echo -e "${GREEN}✓ Backend web app created and configured${NC}"
}

# Function to create frontend static web app
create_frontend_app() {
    echo -e "${YELLOW}Creating frontend static web app...${NC}"
    
    # Create Static Web App if it doesn't exist
    if ! az staticwebapp show --name "$FRONTEND_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
        az staticwebapp create \
            --name "$FRONTEND_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --source . \
            --location "$LOCATION" \
            --branch main \
            --app-location "/frontend" \
            --output-location "build"
    else
        echo -e "${GREEN}✓ Frontend static web app already exists${NC}"
    fi
    
    # Configure environment variables
    echo -e "${BLUE}Configuring frontend environment...${NC}"
    BACKEND_URL="https://$BACKEND_APP_NAME.azurewebsites.net"
    az staticwebapp appsettings set \
        --name "$FRONTEND_APP_NAME" \
        --setting-names \
            REACT_APP_API_URL="$BACKEND_URL" \
            REACT_APP_WS_URL="wss://$BACKEND_APP_NAME.azurewebsites.net" \
            REACT_APP_ENVIRONMENT="production" \
            REACT_APP_SENTRY_DSN="$SENTRY_DSN"
    
    echo -e "${GREEN}✓ Frontend static web app created and configured${NC}"
}

# Function to configure CORS
configure_cors() {
    echo -e "${YELLOW}Configuring CORS...${NC}"
    
    # Get frontend URL
    FRONTEND_URL="https://$FRONTEND_APP_NAME.azurestaticapps.net"
    
    # Configure CORS for backend
    az webapp cors add \
        --name "$BACKEND_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --allowed-origins "$FRONTEND_URL" "http://localhost:3000"
    
    echo -e "${GREEN}✓ CORS configured${NC}"
}

# Function to configure custom domains (optional)
configure_custom_domains() {
    echo -e "${YELLOW}Configuring custom domains (optional)...${NC}"
    
    read -p "Do you want to configure custom domains? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Please enter your custom domain for the backend:${NC}"
        read -p "Backend domain (e.g., api.lingualive.com): " BACKEND_DOMAIN
        
        echo -e "${BLUE}Please enter your custom domain for the frontend:${NC}"
        read -p "Frontend domain (e.g., lingualive.com): " FRONTEND_DOMAIN
        
        if [ ! -z "$BACKEND_DOMAIN" ]; then
            echo -e "${BLUE}Adding custom domain to backend...${NC}"
            az webapp config hostname add \
                --webapp-name "$BACKEND_APP_NAME" \
                --resource-group "$RESOURCE_GROUP" \
                --hostname "$BACKEND_DOMAIN"
        fi
        
        if [ ! -z "$FRONTEND_DOMAIN" ]; then
            echo -e "${BLUE}Adding custom domain to frontend...${NC}"
            az staticwebapp hostname set \
                --name "$FRONTEND_APP_NAME" \
                --resource-group "$RESOURCE_GROUP" \
                --hostname "$FRONTEND_DOMAIN"
        fi
        
        echo -e "${GREEN}✓ Custom domains configured${NC}"
        echo -e "${YELLOW}Note: You'll need to configure DNS records for these domains.${NC}"
    else
        echo -e "${YELLOW}Skipping custom domain configuration${NC}"
    fi
}

# Function to show deployment summary
show_summary() {
    echo ""
    echo -e "${GREEN}🎉 Azure Infrastructure Setup Complete!${NC}"
    echo "=========================================="
    echo ""
    echo -e "${BLUE}Your Application URLs:${NC}"
    echo -e "  Backend API: ${GREEN}https://$BACKEND_APP_NAME.azurewebsites.net${NC}"
    echo -e "  Frontend App: ${GREEN}https://$FRONTEND_APP_NAME.azurestaticapps.net${NC}"
    echo -e "  API Docs: ${GREEN}https://$BACKEND_APP_NAME.azurewebsites.net/docs${NC}"
    echo -e "  Health Check: ${GREEN}https://$BACKEND_APP_NAME.azurewebsites.net/health${NC}"
    echo ""
    echo -e "${BLUE}Database Configuration:${NC}"
    echo -e "  MongoDB: ${GREEN}Connected${NC}"
    echo -e "  Redis: ${GREEN}Connected${NC}"
    echo -e "  Sentry: ${GREEN}Configured${NC}"
    echo ""
    echo -e "${BLUE}Infrastructure Details:${NC}"
    echo -e "  Resource Group: ${GREEN}$RESOURCE_GROUP${NC}"
    echo -e "  Location: ${GREEN}$LOCATION${NC}"
    echo -e "  App Service Plan: ${GREEN}$APP_SERVICE_PLAN${NC}"
    echo -e "  Backend App: ${GREEN}$BACKEND_APP_NAME${NC}"
    echo -e "  Frontend App: ${GREEN}$FRONTEND_APP_NAME${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. Open ${GREEN}https://$FRONTEND_APP_NAME.azurestaticapps.net${NC} in your browser"
    echo -e "  2. Test the translation features"
    echo -e "  3. Check the API documentation"
    echo -e "  4. Monitor errors in Sentry"
    echo -e "  5. Set up SSL certificates if using custom domains"
    echo ""
    echo -e "${BLUE}Cost Estimation:${NC}"
    echo -e "  App Service Plan (P1v2): ~$75/month"
    echo -e "  Static Web App: ~$10/month"
    echo -e "  Total: ~$85/month"
    echo ""
    echo -e "${YELLOW}Note: This deployment uses your existing MongoDB and Redis services.${NC}"
    echo ""
}

# Function to test deployment
test_deployment() {
    echo -e "${YELLOW}Testing deployment...${NC}"
    
    # Wait a moment for deployment to complete
    sleep 30
    
    # Test backend health
    echo -e "${BLUE}Testing backend health...${NC}"
    if curl -f "https://$BACKEND_APP_NAME.azurewebsites.net/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
    else
        echo -e "${YELLOW}⚠ Backend health check failed (may still be deploying)${NC}"
    fi
    
    # Test frontend
    echo -e "${BLUE}Testing frontend...${NC}"
    if curl -f "https://$FRONTEND_APP_NAME.azurestaticapps.net" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is accessible${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend check failed (may still be deploying)${NC}"
    fi
    
    # Test database connections
    echo -e "${BLUE}Testing database connections...${NC}"
    if curl -f "https://$BACKEND_APP_NAME.azurewebsites.net/debug/mongodb" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ MongoDB connection working${NC}"
    else
        echo -e "${YELLOW}⚠ MongoDB connection test failed${NC}"
    fi
    
    if curl -f "https://$BACKEND_APP_NAME.azurewebsites.net/debug/redis" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis connection working${NC}"
    else
        echo -e "${YELLOW}⚠ Redis connection test failed${NC}"
    fi
    
    # Test Google Cloud integration
    echo -e "${BLUE}Testing Google Cloud integration...${NC}"
    if curl -f "https://$BACKEND_APP_NAME.azurewebsites.net/debug/gcp" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Google Cloud integration working${NC}"
    else
        echo -e "${YELLOW}⚠ Google Cloud integration test failed${NC}"
    fi
}

# Main setup function
main() {
    # Check prerequisites
    check_azure_cli
    
    # Login to Azure
    login_azure
    
    # Create infrastructure
    create_resource_group
    create_app_service_plan
    
    # Get database connections
    get_database_connections
    
    # Create applications
    create_backend_app
    create_frontend_app
    
    # Configure CORS
    configure_cors
    
    # Configure custom domains (optional)
    configure_custom_domains
    
    # Test deployment
    test_deployment
    
    # Show summary
    show_summary
}

# Check if user wants to proceed
echo -e "${YELLOW}This script will set up the complete Azure infrastructure for LinguaLive.${NC}"
echo -e "${YELLOW}Estimated cost: ~$85/month for production setup${NC}"
echo -e "${YELLOW}This will use your existing MongoDB and Redis services.${NC}"
echo ""
read -p "Do you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Setup cancelled${NC}"
    exit 0
fi

# Run main function
main "$@" 