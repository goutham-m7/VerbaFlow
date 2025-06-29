# 🚀 **Azure Web Services Deployment Guide for LinguaLive**

## 📋 **Overview**

This guide provides comprehensive instructions for deploying LinguaLive to Azure Web Services using your existing MongoDB and Redis infrastructure.

## 🛠️ **Prerequisites**

### **Required Tools**
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Install Docker (if not already installed)
# macOS: brew install docker
# Ubuntu: sudo apt-get install docker.io

# Install Node.js and npm
# macOS: brew install node
# Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```

### **Required Accounts**
- **Azure Account** with active subscription
- **GitHub Account** for container registry
- **Google Cloud Account** for translation services

## 🚀 **Step 1: Azure CLI Setup**

### **1.1 Install Azure CLI**
```bash
# macOS
brew install azure-cli

# Ubuntu/Debian
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Windows
# Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli-windows
```

### **1.2 Login to Azure**
```bash
az login
```

This will open a browser window for authentication. After successful login, you'll see your subscription information.

### **1.3 Set Subscription (if multiple)**
```bash
# List available subscriptions
az account list --output table

# Set the desired subscription
az account set --subscription "your-subscription-id"
```

## 🏗️ **Step 2: Azure Infrastructure Setup**

### **2.1 Automated Setup (Recommended)**
```bash
# Make the script executable
chmod +x scripts/azure-setup.sh

# Set GitHub credentials (optional, for container registry)
export GITHUB_USERNAME="your-github-username"
export GITHUB_TOKEN="your-github-personal-access-token"

# Run the automated setup
./scripts/azure-setup.sh
```

### **2.2 Manual Setup (Alternative)**

#### **Create Resource Group**
```bash
az group create \
  --name lingualive-rg \
  --location eastus
```

#### **Create App Service Plan**
```bash
az appservice plan create \
  --name lingualive-plan \
  --resource-group lingualive-rg \
  --sku P1v3 \
  --is-linux \
  --location eastus
```

#### **Create Cosmos DB (MongoDB API)**
```bash
# Create Cosmos DB account
az cosmosdb create \
  --name lingualive-cosmos \
  --resource-group lingualive-rg \
  --kind MongoDB \
  --capabilities EnableMongo \
  --locations regionName=eastus failoverPriority=0 isZoneRedundant=false \
  --default-consistency-level Session \
  --enable-multiple-write-locations false

# Create database
az cosmosdb mongodb database create \
  --account-name lingualive-cosmos \
  --resource-group lingualive-rg \
  --name lingualive

# Create collections
az cosmosdb mongodb collection create \
  --account-name lingualive-cosmos \
  --resource-group lingualive-rg \
  --database-name lingualive \
  --name users

az cosmosdb mongodb collection create \
  --account-name lingualive-cosmos \
  --resource-group lingualive-rg \
  --database-name lingualive \
  --name meetings

az cosmosdb mongodb collection create \
  --account-name lingualive-cosmos \
  --resource-group lingualive-rg \
  --database-name lingualive \
  --name transcripts
```

#### **Create Redis Cache**
```bash
az redis create \
  --name lingualive-redis \
  --resource-group lingualive-rg \
  --location eastus \
  --sku Standard \
  --vm-size C1 \
  --enable-non-ssl-port false
```

## 🐳 **Step 3: Backend Deployment**

### **3.1 Create Backend Web App**
```bash
# Create the web app
az webapp create \
  --name lingualive-backend \
  --resource-group lingualive-rg \
  --plan lingualive-plan \
  --deployment-container-image-name ghcr.io/your-username/verbaflow-backend:latest

# Configure container registry (if using GitHub Container Registry)
az webapp config container set \
  --name lingualive-backend \
  --resource-group lingualive-rg \
  --docker-registry-server-url ghcr.io \
  --docker-registry-server-user "$GITHUB_USERNAME" \
  --docker-registry-server-password "$GITHUB_TOKEN"

# Enable continuous deployment
az webapp deployment container config \
  --enable-cd true \
  --name lingualive-backend \
  --resource-group lingualive-rg
```

### **3.2 Configure Backend Environment Variables**
```bash
# Get connection strings
COSMOS_CONNECTION_STRING=$(az cosmosdb keys list \
  --name lingualive-cosmos \
  --resource-group lingualive-rg \
  --type connection-strings \
  --query "connectionStrings[0].connectionString" \
  --output tsv)

REDIS_KEY=$(az redis list-keys \
  --name lingualive-redis \
  --resource-group lingualive-rg \
  --query "primaryKey" \
  --output tsv)

# Store secrets in Key Vault
az keyvault secret set \
  --vault-name lingualive-kv \
  --name cosmos-connection-string \
  --value "$COSMOS_CONNECTION_STRING"

az keyvault secret set \
  --vault-name lingualive-kv \
  --name redis-connection-string \
  --value "redis://:$REDIS_KEY@lingualive-redis.redis.cache.windows.net:6380/0?ssl=true"

# Configure app settings
az webapp config appsettings set \
  --name lingualive-backend \
  --resource-group lingualive-rg \
  --settings \
    MONGODB_URI="@Microsoft.KeyVault(SecretUri=https://lingualive-kv.vault.azure.net/secrets/cosmos-connection-string/)" \
    REDIS_URL="@Microsoft.KeyVault(SecretUri=https://lingualive-kv.vault.azure.net/secrets/redis-connection-string/)" \
    DEBUG="false" \
    HOST="0.0.0.0" \
    PORT="8000" \
    SENTRY_ENVIRONMENT="production" \
    WEBSITES_PORT="8000" \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE="true"
```

### **3.3 Configure CORS**
```bash
az webapp cors add \
  --name lingualive-backend \
  --resource-group lingualive-rg \
  --allowed-origins "https://lingualive-frontend.azurestaticapps.net" "http://localhost:3000"
```

## 🌐 **Step 4: Frontend Deployment**

### **4.1 Create Static Web App**
```bash
# Create Static Web App
az staticwebapp create \
  --name lingualive-frontend \
  --resource-group lingualive-rg \
  --source . \
  --location eastus \
  --branch main \
  --app-location "/frontend" \
  --api-location "/backend" \
  --output-location "build"
```

### **4.2 Configure Frontend Environment Variables**
```bash
# Set frontend environment variables
az staticwebapp appsettings set \
  --name lingualive-frontend \
  --setting-names \
    REACT_APP_API_URL="https://lingualive-backend.azurewebsites.net" \
    REACT_APP_WS_URL="wss://lingualive-backend.azurewebsites.net" \
    REACT_APP_ENVIRONMENT="production"
```

## 📊 **Step 5: Monitoring Setup**

### **5.1 Create Application Insights**
```bash
az monitor app-insights component create \
  --app lingualive-insights \
  --location eastus \
  --resource-group lingualive-rg \
  --application-type web

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app lingualive-insights \
  --resource-group lingualive-rg \
  --query "instrumentationKey" \
  --output tsv)

# Store in Key Vault
az keyvault secret set \
  --vault-name lingualive-kv \
  --name app-insights-key \
  --value "$INSTRUMENTATION_KEY"

# Configure backend to use Application Insights
az webapp config appsettings set \
  --name lingualive-backend \
  --resource-group lingualive-rg \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=$INSTRUMENTATION_KEY" \
    APPLICATIONINSIGHTS_ROLE_NAME="LinguaLive-Backend"
```

## 🔒 **Step 6: Security Configuration**

### **6.1 Configure SSL/TLS**
```bash
# Enable HTTPS only
az webapp update \
  --name lingualive-backend \
  --resource-group lingualive-rg \
  --https-only true
```

### **6.2 Configure Custom Domains (Optional)**
```bash
# Add custom domain for backend
az webapp config hostname add \
  --webapp-name lingualive-backend \
  --resource-group lingualive-rg \
  --hostname "api.yourdomain.com"

# Add custom domain for frontend
az staticwebapp hostname set \
  --name lingualive-frontend \
  --resource-group lingualive-rg \
  --hostname "www.yourdomain.com"
```

## 🚀 **Step 7: Deploy Application**

### **7.1 Build and Push Docker Images**
```bash
# Build backend image
docker build -t ghcr.io/your-username/verbaflow-backend:latest ./backend

# Build frontend image
docker build -t ghcr.io/your-username/verbaflow-frontend:latest ./frontend

# Push to GitHub Container Registry
docker push ghcr.io/your-username/verbaflow-backend:latest
docker push ghcr.io/your-username/verbaflow-frontend:latest
```

### **7.2 Deploy Using Our Script**
```bash
# Deploy to staging
./scripts/deploy.sh staging azure

# Deploy to production
./scripts/deploy.sh production azure
```

## ✅ **Step 8: Verification**

### **8.1 Test Backend**
```bash
# Test health endpoint
curl https://lingualive-backend.azurewebsites.net/health

# Test API documentation
curl https://lingualive-backend.azurewebsites.net/docs

# Test API endpoints
curl https://lingualive-backend.azurewebsites.net/api/v1/health
```

### **8.2 Test Frontend**
```bash
# Open in browser
open https://lingualive-frontend.azurestaticapps.net
```

### **8.3 Test Database Connectivity**
```bash
# Test MongoDB connection
curl https://lingualive-backend.azurewebsites.net/debug/mongodb

# Test Redis connection
curl https://lingualive-backend.azurewebsites.net/debug/redis
```

## 📊 **Step 9: Monitoring and Alerts**

### **9.1 Access Application Insights**
```bash
# Open Application Insights in browser
open "https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id --output tsv)/resourceGroups/lingualive-rg/providers/Microsoft.Insights/components/lingualive-insights"
```

### **9.2 Set Up Alerts**
```bash
# Create alert for high CPU usage
az monitor metrics alert create \
  --name "high-cpu-alert" \
  --resource-group lingualive-rg \
  --scopes "/subscriptions/$(az account show --query id --output tsv)/resourceGroups/lingualive-rg/providers/Microsoft.Web/sites/lingualive-backend" \
  --condition "avg Percentage CPU > 80" \
  --description "Alert when CPU usage is high"
```

## 🔧 **Step 10: CI/CD Configuration**

### **10.1 Configure GitHub Secrets**
Add these secrets to your GitHub repository:

```yaml
# Azure credentials
AZURE_CREDENTIALS: "your-azure-service-principal-credentials"

# Database connection strings
MONGODB_URI: "your-cosmos-db-connection-string"
REDIS_URL: "your-redis-connection-string"

# Google Cloud credentials
GOOGLE_CREDENTIALS: "base64-encoded-google-credentials"

# Sentry DSN
SENTRY_DSN: "your-sentry-dsn"

# Azure resource names
AZURE_RESOURCE_GROUP: "lingualive-rg"
AZURE_WEBAPP_NAME: "lingualive-backend"
AZURE_STATIC_WEBAPP_NAME: "lingualive-frontend"
```

### **10.2 Create Service Principal**
```bash
# Create service principal
az ad sp create-for-rbac \
  --name "lingualive-sp" \
  --role contributor \
  --scopes /subscriptions/$(az account show --query id --output tsv)/resourceGroups/lingualive-rg \
  --sdk-auth
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Backend Not Starting**
```bash
# Check logs
az webapp log tail --name lingualive-backend --resource-group lingualive-rg

# Check app settings
az webapp config appsettings list --name lingualive-backend --resource-group lingualive-rg
```

#### **2. Database Connection Issues**
```bash
# Test Cosmos DB connection
az cosmosdb keys list --name lingualive-cosmos --resource-group lingualive-rg --type connection-strings

# Test Redis connection
az redis list-keys --name lingualive-redis --resource-group lingualive-rg
```

#### **3. Frontend Build Issues**
```bash
# Check build logs
az staticwebapp show --name lingualive-frontend --resource-group lingualive-rg

# Redeploy frontend
az staticwebapp disconnect --name lingualive-frontend --resource-group lingualive-rg
az staticwebapp create --name lingualive-frontend --resource-group lingualive-rg --source . --location eastus
```

### **Debug Commands**
```bash
# List all resources
az resource list --resource-group lingualive-rg --output table

# Check resource health
az resource show --name lingualive-backend --resource-group lingualive-rg --resource-type Microsoft.Web/sites

# Monitor resource usage
az monitor metrics list --resource "/subscriptions/$(az account show --query id --output tsv)/resourceGroups/lingualive-rg/providers/Microsoft.Web/sites/lingualive-backend" --metric "CpuPercentage" --interval PT1M
```

## 📈 **Performance Optimization**

### **Scaling Configuration**
```bash
# Enable auto-scaling for backend
az monitor autoscale create \
  --resource-group lingualive-rg \
  --resource "/subscriptions/$(az account show --query id --output tsv)/resourceGroups/lingualive-rg/providers/Microsoft.Web/sites/lingualive-backend" \
  --resource-type Microsoft.Web/sites \
  --name "lingualive-autoscale" \
  --min-count 1 \
  --max-count 10 \
  --count 2

# Add scale rule
az monitor autoscale rule create \
  --resource-group lingualive-rg \
  --autoscale-name "lingualive-autoscale" \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1
```

### **CDN Configuration**
```bash
# Enable CDN for static web app
az cdn profile create \
  --name lingualive-cdn \
  --resource-group lingualive-rg \
  --sku Standard_Microsoft

az cdn endpoint create \
  --name lingualive-cdn-endpoint \
  --profile-name lingualive-cdn \
  --resource-group lingualive-rg \
  --origin "lingualive-frontend.azurestaticapps.net" \
  --origin-host-header "lingualive-frontend.azurestaticapps.net"
```

## 🎉 **Success Verification**

### **Final Checklist**
- [ ] Backend API responding at `https://lingualive-backend.azurewebsites.net`
- [ ] Frontend accessible at `https://lingualive-frontend.azurestaticapps.net`
- [ ] Database connections working
- [ ] Translation services functional
- [ ] WebSocket connections established
- [ ] Monitoring and alerts configured
- [ ] SSL certificates valid
- [ ] Performance benchmarks met

### **Performance Metrics**
- **Response Time**: < 200ms for API calls
- **Uptime**: 99.9% availability
- **Error Rate**: < 0.1%
- **Load Time**: < 2 seconds for frontend

---

## 📞 **Support Resources**

### **Azure Documentation**
- [Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Azure Cosmos DB](https://docs.microsoft.com/en-us/azure/cosmos-db/)
- [Azure Redis Cache](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/)

### **Monitoring Tools**
- [Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)
- [Azure Monitor](https://docs.microsoft.com/en-us/azure/azure-monitor/)
- [Azure Key Vault](https://docs.microsoft.com/en-us/azure/key-vault/)

---

**🎉 Congratulations!** Your LinguaLive application is now successfully deployed to Azure Web Services with enterprise-grade infrastructure, monitoring, and security. 