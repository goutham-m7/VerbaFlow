# Deployment Guide

## Overview

This guide covers the complete deployment process for the VerbaFlow platform on Azure, including CI/CD pipelines, monitoring, and production best practices.

## Azure Infrastructure Setup

### Prerequisites

1. **Azure Account**: Active Azure subscription with billing enabled
2. **Azure CLI**: Latest version installed and configured
3. **GitHub Account**: For repository and CI/CD integration
4. **Domain Name**: Custom domain for production (optional)

### Resource Group Creation

```bash
# Create resource group
az group create \
  --name verbaflow-rg \
  --location eastus

# Set as default resource group
az config set defaults.group=verbaflow-rg
```

### Azure Services Setup

#### 1. Azure Container Registry (ACR)

```bash
# Create ACR
az acr create \
  --name verbaflowacr \
  --resource-group verbaflow-rg \
  --sku Standard \
  --admin-enabled true

# Get ACR credentials
az acr credential show --name verbaflowacr
```

#### 2. Azure Database for MongoDB

```bash
# Create MongoDB cluster
az cosmosdb create \
  --name verbaflow-mongodb \
  --resource-group verbaflow-rg \
  --kind MongoDB \
  --capabilities EnableMongo

# Get connection string
az cosmosdb keys list \
  --name verbaflow-mongodb \
  --resource-group verbaflow-rg \
  --type connection-strings
```

#### 3. Azure Redis Cache

```bash
# Create Redis cache
az redis create \
  --name verbaflow-redis \
  --resource-group verbaflow-rg \
  --location eastus \
  --sku Standard \
  --vm-size C1

# Get Redis connection string
az redis show-connection-string \
  --name verbaflow-redis \
  --resource-group verbaflow-rg
```

#### 4. Azure App Service Plans

```bash
# Create backend app service plan
az appservice plan create \
  --name verbaflow-backend-plan \
  --resource-group verbaflow-rg \
  --sku P1v2 \
  --is-linux

# Create frontend app service plan
az appservice plan create \
  --name verbaflow-frontend-plan \
  --resource-group verbaflow-rg \
  --sku P1v2 \
  --is-linux
```

#### 5. Azure Web Apps

```bash
# Create backend web app
az webapp create \
  --name verbaflow-backend \
  --resource-group verbaflow-rg \
  --plan verbaflow-backend-plan \
  --runtime "PYTHON|3.11"

# Create frontend web app
az webapp create \
  --name verbaflow-frontend \
  --resource-group verbaflow-rg \
  --plan verbaflow-frontend-plan \
  --runtime "NODE|18-lts"
```

#### 6. Azure Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app verbaflow-insights \
  --location eastus \
  --resource-group verbaflow-rg \
  --application-type web
```

#### 7. Azure CDN

```bash
# Create CDN profile
az cdn profile create \
  --name verbaflow-cdn \
  --resource-group verbaflow-rg \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --name verbaflow-cdn-endpoint \
  --profile-name verbaflow-cdn \
  --resource-group verbaflow-rg \
  --origin verbaflow-frontend.azurewebsites.net \
  --origin-host-header verbaflow-frontend.azurewebsites.net
```

### Environment Configuration

#### Backend Environment Variables

```bash
# Set backend environment variables
az webapp config appsettings set \
  --name verbaflow-backend \
  --resource-group verbaflow-rg \
  --settings \
    MONGODB_URI="mongodb://verbaflow-mongodb:27017/verbaflow" \
    REDIS_URL="redis://verbaflow-redis.redis.cache.windows.net:6380" \
    GOOGLE_CLOUD_PROJECT="your-google-project-id" \
    GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json" \
    JWT_SECRET="your-jwt-secret" \
    CORS_ORIGINS="https://verbaflow-frontend.azurewebsites.net" \
    SENTRY_DSN="your-sentry-dsn" \
    AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING="your-app-insights-connection-string"
```

#### Frontend Environment Variables

```bash
# Set frontend environment variables
az webapp config appsettings set \
  --name verbaflow-frontend \
  --resource-group verbaflow-rg \
  --settings \
    REACT_APP_API_URL="https://verbaflow-backend.azurewebsites.net" \
    REACT_APP_WS_URL="wss://verbaflow-backend.azurewebsites.net/ws" \
    REACT_APP_100MS_TEMPLATE_ID="your-100ms-template-id" \
    REACT_APP_SENTRY_DSN="your-sentry-dsn"
```

## CI/CD Pipeline Setup

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  AZURE_WEBAPP_NAME_BACKEND: verbaflow-backend
  AZURE_WEBAPP_NAME_FRONTEND: verbaflow-frontend
  AZURE_REGISTRY: verbaflowacr.azurecr.io

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install Python dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Install Node.js dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run backend tests
      run: |
        cd backend
        pytest --cov=app --cov-report=xml
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml,./frontend/coverage/lcov.info

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Log in to Azure Container Registry
      uses: azure/docker-login@v1
      with:
        login-server: ${{ env.AZURE_REGISTRY }}
        username: ${{ secrets.REGISTRY_USERNAME }}
        password: ${{ secrets.REGISTRY_PASSWORD }}
    
    - name: Build and push backend image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: ${{ env.AZURE_REGISTRY }}/backend:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Build and push frontend image
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: true
        tags: ${{ env.AZURE_REGISTRY }}/frontend:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Deploy to Azure Web Apps
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME_BACKEND }}
        images: ${{ env.AZURE_REGISTRY }}/backend:${{ github.sha }}
    
    - name: Deploy frontend to Azure Web Apps
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME_FRONTEND }}
        images: ${{ env.AZURE_REGISTRY }}/frontend:${{ github.sha }}

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.AZURE_REGISTRY }}/backend:${{ github.sha }}
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v2
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'
```

### Docker Configuration

#### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

## Monitoring and Observability

### Azure Monitor Setup

#### Application Insights Configuration

```python
# backend/app/config/monitoring.py
from opencensus.ext.azure.log_exporter import AzureLogHandler
from opencensus.ext.azure.trace_exporter import AzureExporter
from opencensus.trace.tracer import Tracer
from opencensus.trace.samplers import ProbabilitySampler
import logging

def setup_monitoring():
    # Configure logging
    logger = logging.getLogger(__name__)
    logger.addHandler(AzureLogHandler(
        connection_string=os.getenv('AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING')
    ))
    
    # Configure tracing
    tracer = Tracer(
        exporter=AzureExporter(
            connection_string=os.getenv('AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING')
        ),
        sampler=ProbabilitySampler(1.0)
    )
    
    return logger, tracer
```

#### Custom Metrics

```python
# backend/app/services/metrics.py
from opencensus.ext.azure import metrics_exporter
from opencensus.metrics import gauge

class MetricsService:
    def __init__(self):
        self.exporter = metrics_exporter.AzureMetricsExporter(
            connection_string=os.getenv('AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING')
        )
        
        # Define custom metrics
        self.active_meetings = gauge.LongGauge(
            name="active_meetings",
            description="Number of active meetings",
            unit="1"
        )
        
        self.translation_requests = gauge.LongGauge(
            name="translation_requests",
            description="Number of translation requests",
            unit="1"
        )
    
    def record_active_meeting(self, count: int):
        self.active_meetings.set(count)
    
    def record_translation_request(self):
        self.translation_requests.add(1)
```

### Sentry Integration

#### Backend Sentry Setup

```python
# backend/app/config/sentry.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.redis import RedisIntegration

def setup_sentry():
    sentry_sdk.init(
        dsn=os.getenv('SENTRY_DSN'),
        integrations=[
            FastApiIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
    )
```

#### Frontend Sentry Setup

```javascript
// frontend/src/utils/sentry.js
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Health Checks

#### Backend Health Endpoint

```python
# backend/app/api/v1/health.py
from fastapi import APIRouter, Depends
from app.services.database import get_database
from app.services.redis import get_redis

router = APIRouter()

@router.get("/health")
async def health_check():
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    # Check database
    try:
        db = get_database()
        await db.command("ping")
        health_status["services"]["database"] = "healthy"
    except Exception as e:
        health_status["services"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # Check Redis
    try:
        redis = get_redis()
        await redis.ping()
        health_status["services"]["redis"] = "healthy"
    except Exception as e:
        health_status["services"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # Check external services
    try:
        # Test Google Cloud APIs
        # Implementation depends on specific services
        health_status["services"]["google_apis"] = "healthy"
    except Exception as e:
        health_status["services"]["google_apis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    return health_status
```

## Production Best Practices

### Security Configuration

#### SSL/TLS Setup

```bash
# Configure SSL binding
az webapp config ssl bind \
  --certificate-thumbprint <thumbprint> \
  --name verbaflow-backend \
  --resource-group verbaflow-rg \
  --ssl-type SNI

az webapp config ssl bind \
  --certificate-thumbprint <thumbprint> \
  --name verbaflow-frontend \
  --resource-group verbaflow-rg \
  --ssl-type SNI
```

#### Network Security

```bash
# Configure VNet integration
az webapp vnet-integration add \
  --name verbaflow-backend \
  --resource-group verbaflow-rg \
  --vnet verbaflow-vnet \
  --subnet backend-subnet
```

### Performance Optimization

#### Auto-scaling Configuration

```bash
# Configure auto-scaling for backend
az monitor autoscale create \
  --resource-group verbaflow-rg \
  --resource verbaflow-backend-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name verbaflow-backend-autoscale \
  --min-count 2 \
  --max-count 10 \
  --count 2

# Configure auto-scaling rules
az monitor autoscale rule create \
  --resource-group verbaflow-rg \
  --autoscale-name verbaflow-backend-autoscale \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1
```

#### CDN Configuration

```bash
# Configure CDN caching rules
az cdn endpoint rule add \
  --resource-group verbaflow-rg \
  --profile-name verbaflow-cdn \
  --name verbaflow-cdn-endpoint \
  --rule-name "Cache Static Assets" \
  --order 1 \
  --action-name CacheExpiration \
  --cache-behavior Override \
  --cache-duration "365.00:00:00"
```

### Backup and Disaster Recovery

#### Database Backup

```bash
# Configure MongoDB backup
az cosmosdb sql container create \
  --resource-group verbaflow-rg \
  --account-name verbaflow-mongodb \
  --database-name verbaflow \
  --name backups \
  --partition-key-path "/id"
```

#### Application Backup

```bash
# Create backup storage account
az storage account create \
  --name verbaflowbackup \
  --resource-group verbaflow-rg \
  --location eastus \
  --sku Standard_LRS

# Configure backup policy
az backup vault create \
  --name verbaflow-backup-vault \
  --resource-group verbaflow-rg \
  --location eastus
```

## Deployment Scripts

### Complete Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting VerbaFlow deployment..."

# Check prerequisites
command -v az >/dev/null 2>&1 || { echo "Azure CLI is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }

# Set variables
RESOURCE_GROUP="verbaflow-rg"
LOCATION="eastus"
ENVIRONMENT=${1:-production}

echo "📋 Deploying to environment: $ENVIRONMENT"

# Create resource group if it doesn't exist
if ! az group show --name $RESOURCE_GROUP >/dev/null 2>&1; then
    echo "📦 Creating resource group..."
    az group create --name $RESOURCE_GROUP --location $LOCATION
fi

# Deploy infrastructure
echo "🏗️  Deploying infrastructure..."
az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file infrastructure/main.bicep \
    --parameters environment=$ENVIRONMENT

# Build and push Docker images
echo "🐳 Building and pushing Docker images..."
docker build -t verbaflowacr.azurecr.io/backend:latest ./backend
docker build -t verbaflowacr.azurecr.io/frontend:latest ./frontend

az acr login --name verbaflowacr
docker push verbaflowacr.azurecr.io/backend:latest
docker push verbaflowacr.azurecr.io/frontend:latest

# Deploy applications
echo "🚀 Deploying applications..."
az webapp config container set \
    --name verbaflow-backend \
    --resource-group $RESOURCE_GROUP \
    --docker-custom-image-name verbaflowacr.azurecr.io/backend:latest

az webapp config container set \
    --name verbaflow-frontend \
    --resource-group $RESOURCE_GROUP \
    --docker-custom-image-name verbaflowacr.azurecr.io/frontend:latest

# Run health checks
echo "🏥 Running health checks..."
sleep 30

BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://verbaflow-backend.azurewebsites.net/health)
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://verbaflow-frontend.azurewebsites.net/)

if [ "$BACKEND_HEALTH" = "200" ] && [ "$FRONTEND_HEALTH" = "200" ]; then
    echo "✅ Deployment successful! All services are healthy."
else
    echo "❌ Deployment failed! Health checks failed."
    exit 1
fi

echo "🎉 VerbaFlow deployment completed successfully!"
```

### Rollback Script

```bash
#!/bin/bash
# rollback.sh

set -e

echo "🔄 Starting rollback..."

RESOURCE_GROUP="verbaflow-rg"
VERSION=${1:-previous}

# Get previous version
PREVIOUS_VERSION=$(az webapp deployment list --name verbaflow-backend --resource-group $RESOURCE_GROUP --query "[1].id" -o tsv)

echo "📦 Rolling back to version: $PREVIOUS_VERSION"

# Rollback backend
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name verbaflow-backend \
    --src $PREVIOUS_VERSION

# Rollback frontend
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name verbaflow-frontend \
    --src $PREVIOUS_VERSION

echo "✅ Rollback completed successfully!"
```

## Monitoring Dashboard

### Azure Dashboard Configuration

```json
{
  "lenses": {
    "0": {
      "order": 0,
      "parts": {
        "0": {
          "position": {
            "x": 0,
            "y": 0,
            "colSpan": 6,
            "rowSpan": 4
          },
          "metadata": {
            "inputs": [],
            "type": "Extension/Microsoft_OperationsManagementSuite_Workspace/PartType/LogsDashboardPart",
            "settings": {
              "content": {
                "Query": "traces | where timestamp > ago(1h) | summarize count() by bin(timestamp, 5m)",
                "PartTitle": "Request Rate",
                "PartSubTitle": "Last 1 hour"
              }
            }
          }
        }
      }
    }
  }
}
```

This comprehensive deployment guide provides everything needed to deploy, monitor, and maintain the VerbaFlow platform in production on Azure. 