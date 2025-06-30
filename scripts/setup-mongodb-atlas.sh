#!/bin/bash

# MongoDB Atlas Setup Script for Azure Web App
# This script helps you configure MongoDB Atlas connection in Azure Web App

set -e

echo "🗄️ MongoDB Atlas Setup for Azure Web App"
echo "========================================"

# Configuration
RESOURCE_GROUP="verbaflow-rg"
WEB_APP_NAME="verbaflow-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
    print_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    print_warning "Not logged in to Azure. Please login:"
    az login
fi

echo ""
echo "📋 MongoDB Atlas Configuration"
echo "=============================="
echo ""

read -p "Do you have MongoDB Atlas cluster details? (y/n): " has_atlas

if [[ $has_atlas == "y" || $has_atlas == "Y" ]]; then
    echo ""
    echo "Please provide your MongoDB Atlas details:"
    echo ""
    
    read -p "MongoDB Atlas Cluster URL (e.g., democluster.bq49a.mongodb.net): " atlas_cluster
    read -p "MongoDB Atlas Username: " atlas_username
    read -s -p "MongoDB Atlas Password: " atlas_password
    echo ""
    read -p "Database Name (default: verbaflow): " atlas_database
    
    # Set default database name if not provided
    if [[ -z "$atlas_database" ]]; then
        atlas_database="verbaflow"
    fi
    
    print_status "Setting MongoDB Atlas configuration in Azure Web App..."
    
    # Set MongoDB Atlas configuration
    az webapp config appsettings set \
        --name $WEB_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings \
        MONGODB_USE_ATLAS="true" \
        MONGODB_ATLAS_CLUSTER="$atlas_cluster" \
        MONGODB_ATLAS_USERNAME="$atlas_username" \
        MONGODB_ATLAS_PASSWORD="$atlas_password" \
        MONGODB_ATLAS_DATABASE="$atlas_database"
    
    print_status "MongoDB Atlas configuration set successfully!"
    
    echo ""
    echo "🔧 Additional Configuration Steps:"
    echo "1. Make sure your MongoDB Atlas cluster allows connections from Azure IP ranges"
    echo "2. Add your Azure Web App's IP to MongoDB Atlas Network Access:"
    echo "   - Go to MongoDB Atlas Dashboard"
    echo "   - Navigate to Network Access"
    echo "   - Add IP Address: 0.0.0.0/0 (for testing) or specific Azure IP ranges"
    echo ""
    echo "3. Test the connection by visiting:"
    echo "   https://$WEB_APP_NAME.azurewebsites.net/debug/mongodb"
    echo ""
    echo "🌐 MongoDB Atlas Dashboard:"
    echo "   https://cloud.mongodb.com/"
    
else
    echo ""
    print_warning "Please follow these steps to set up MongoDB Atlas:"
    echo ""
    echo "1. Go to MongoDB Atlas: https://cloud.mongodb.com/"
    echo "2. Create a new cluster or use existing one"
    echo "3. Create a database user with read/write permissions"
    echo "4. Get your connection string from the cluster"
    echo "5. Configure Network Access to allow Azure connections"
    echo ""
    echo "Then run this script again with your Atlas details."
    echo ""
    echo "📝 Alternative: Use a direct MongoDB URI"
    echo "You can also set MONGODB_URI directly in Azure Portal with your connection string."
fi 