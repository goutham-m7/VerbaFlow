#!/bin/bash

# Azure Backend Deployment Script
# This script deploys the VerbaFlow backend to Azure Web App

set -e

echo "🚀 Starting VerbaFlow Backend Azure Deployment..."

# Configuration
RESOURCE_GROUP="verbaflow-rg"
LOCATION="eastus"
APP_SERVICE_PLAN="verbaflow-plan"
WEB_APP_NAME="verbaflow-backend"
SKU="B1"  # Basic tier for cost efficiency

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first:"
    echo "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    print_warning "Not logged in to Azure. Please login:"
    az login
fi

print_status "Creating resource group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location $LOCATION

print_status "Creating App Service Plan: $APP_SERVICE_PLAN"
az appservice plan create \
    --name $APP_SERVICE_PLAN \
    --resource-group $RESOURCE_GROUP \
    --sku $SKU \
    --is-linux

print_status "Creating Web App: $WEB_APP_NAME"
az webapp create \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --plan $APP_SERVICE_PLAN \
    --runtime "PYTHON:3.11"

print_status "Configuring Web App settings..."
az webapp config set \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --linux-fx-version "PYTHON|3.11"

# Set startup command
print_status "Setting startup command..."
az webapp config set \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --startup-file "uvicorn app.main:app --host 0.0.0.0 --port 8000"

# Enable logging
print_status "Enabling application logging..."
az webapp log config \
    --name $WEB_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --web-server-logging filesystem

print_status "Deployment completed successfully!"
echo ""
echo "🌐 Your backend is now available at:"
echo "   https://$WEB_APP_NAME.azurewebsites.net"
echo ""
echo "📋 Next steps:"
echo "   1. Configure environment variables in Azure Portal"
echo "   2. Set up GitHub deployment (if using CI/CD)"
echo "   3. Test the health endpoint: https://$WEB_APP_NAME.azurewebsites.net/health"
echo ""
echo "🔧 To configure environment variables, run:"
echo "   az webapp config appsettings set --name $WEB_APP_NAME --resource-group $RESOURCE_GROUP --settings KEY=VALUE" 