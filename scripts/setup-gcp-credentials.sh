#!/bin/bash

# GCP Credentials Setup Script for Azure Web App
# This script helps you set up Google Cloud Platform credentials in Azure Web App

set -e

echo "🔧 GCP Credentials Setup for Azure Web App"
echo "=========================================="

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
echo "📋 Instructions for setting up GCP credentials:"
echo "1. Go to Google Cloud Console: https://console.cloud.google.com/"
echo "2. Navigate to IAM & Admin > Service Accounts"
echo "3. Create a new service account or select existing one"
echo "4. Create a new key (JSON format)"
echo "5. Download the JSON file"
echo "6. Copy the entire JSON content"
echo ""

read -p "Do you have the GCP service account JSON file? (y/n): " has_json

if [[ $has_json == "y" || $has_json == "Y" ]]; then
    echo ""
    echo "Please paste the entire JSON content from your GCP service account key file:"
    echo "(Press Enter, paste the JSON, then press Ctrl+D when done)"
    echo ""
    
    # Read the JSON content
    gcp_credentials=$(cat)
    
    # Validate JSON
    if echo "$gcp_credentials" | python3 -m json.tool > /dev/null 2>&1; then
        print_status "JSON validation successful"
    else
        print_error "Invalid JSON format. Please check your credentials."
        exit 1
    fi
    
    print_status "Setting GCP credentials in Azure Web App..."
    
    # Set the credentials in Azure Web App
    az webapp config appsettings set \
        --name $WEB_APP_NAME \
        --resource-group $RESOURCE_GROUP \
        --settings GOOGLE_APPLICATION_CREDENTIALS="$gcp_credentials"
    
    print_status "GCP credentials set successfully!"
    
    # Also set the project ID if available
    project_id=$(echo "$gcp_credentials" | python3 -c "import sys, json; print(json.load(sys.stdin).get('project_id', ''))" 2>/dev/null)
    
    if [[ -n "$project_id" ]]; then
        print_status "Setting Google Cloud Project ID: $project_id"
        az webapp config appsettings set \
            --name $WEB_APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --settings GOOGLE_CLOUD_PROJECT="$project_id"
    fi
    
    echo ""
    print_status "✅ GCP credentials configured successfully!"
    echo ""
    echo "🌐 Your Azure Web App should now be able to use Google Cloud services."
    echo "📝 You can test it by visiting: https://$WEB_APP_NAME.azurewebsites.net/health"
    echo ""
    echo "🔧 To verify the configuration, check the Azure Portal:"
    echo "   https://portal.azure.com/#@/resource/subscriptions/*/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/sites/$WEB_APP_NAME/configuration"
    
else
    echo ""
    print_warning "Please follow these steps to get GCP credentials:"
    echo ""
    echo "1. Go to Google Cloud Console: https://console.cloud.google.com/"
    echo "2. Create a new project or select existing one"
    echo "3. Enable the following APIs:"
    echo "   - Cloud Translation API"
    echo "   - Cloud Text-to-Speech API"
    echo "   - Cloud Speech-to-Text API"
    echo "4. Go to IAM & Admin > Service Accounts"
    echo "5. Create a new service account"
    echo "6. Assign the following roles:"
    echo "   - Cloud Translation API User"
    echo "   - Cloud Text-to-Speech API User"
    echo "   - Cloud Speech-to-Text API User"
    echo "7. Create a new key (JSON format)"
    echo "8. Download the JSON file"
    echo ""
    echo "Then run this script again with the JSON content."
fi 