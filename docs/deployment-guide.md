# 🚀 LinguaLive Deployment Guide

## 📋 **Overview**

This guide covers deploying the LinguaLive application to various platforms and environments. The application consists of:

- **Backend API**: FastAPI application with WebSocket support
- **Frontend**: React application with real-time features
- **Extension**: Chrome browser extension
- **Database**: MongoDB for data persistence
- **Cache**: Redis for session management
- **Monitoring**: Prometheus + Grafana + ELK Stack

## 🎯 **Deployment Options**

### **1. Local Development**
- **Platform**: Docker Compose
- **Use Case**: Development and testing
- **Complexity**: Low

### **2. Staging Environment**
- **Platform**: Azure App Service + Vercel
- **Use Case**: Pre-production testing
- **Complexity**: Medium

### **3. Production Environment**
- **Platform**: Kubernetes + Azure
- **Use Case**: Production deployment
- **Complexity**: High

## 🛠️ **Prerequisites**

### **Required Tools**
```bash
# Docker and Docker Compose
docker --version
docker-compose --version

# Git
git --version

# Node.js (for frontend)
node --version
npm --version

# Python (for backend)
python --version
pip --version
```

### **Cloud Accounts**
- **Azure**: For backend hosting and databases
- **Vercel**: For frontend hosting
- **GitHub**: For CI/CD and container registry
- **MongoDB Atlas**: For managed database
- **Redis Cloud**: For managed cache

## 🚀 **Quick Start - Local Deployment**

### **1. Clone and Setup**
```bash
git clone https://github.com/your-username/VerbaFlow.git
cd VerbaFlow
```

### **2. Environment Configuration**
```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment variables
nano backend/.env
nano frontend/.env
```

### **3. Deploy with Docker Compose**
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy locally
./scripts/deploy.sh local docker
```

### **4. Verify Deployment**
```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend
curl http://localhost:3000

# Check monitoring
curl http://localhost:9090  # Prometheus
curl http://localhost:3001  # Grafana
```

## ☁️ **Cloud Deployment**

### **Azure App Service Deployment**

#### **1. Azure CLI Setup**
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set subscription
az account set --subscription "your-subscription-id"
```

#### **2. Create Azure Resources**
```bash
# Create resource group
az group create --name lingualive-rg --location eastus

# Create App Service Plan
az appservice plan create \
  --name lingualive-plan \
  --resource-group lingualive-rg \
  --sku P1v3 \
  --is-linux

# Create Web App for backend
az webapp create \
  --name lingualive-backend \
  --resource-group lingualive-rg \
  --plan lingualive-plan \
  --deployment-container-image-name ghcr.io/your-username/verbaflow-backend:latest

# Create Static Web App for frontend
az staticwebapp create \
  --name lingualive-frontend \
  --resource-group lingualive-rg \
  --source . \
  --location eastus
```

#### **3. Configure Environment Variables**
```bash
# Backend environment variables
az webapp config appsettings set \
  --name lingualive-backend \
  --resource-group lingualive-rg \
  --settings \
    MONGODB_URI="your-mongodb-connection-string" \
    REDIS_URL="your-redis-connection-string" \
    SENTRY_DSN="your-sentry-dsn"

# Frontend environment variables
az staticwebapp appsettings set \
  --name lingualive-frontend \
  --setting-names \
    REACT_APP_API_URL="https://lingualive-backend.azurewebsites.net" \
    REACT_APP_WS_URL="wss://lingualive-backend.azurewebsites.net"
```

#### **4. Deploy to Azure**
```bash
# Deploy to staging
./scripts/deploy.sh staging azure

# Deploy to production
./scripts/deploy.sh production azure
```

### **Vercel Deployment**

#### **1. Vercel CLI Setup**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

#### **2. Deploy Frontend**
```bash
cd frontend

# Set environment variables
export REACT_APP_API_URL="https://api.lingualive.com"
export REACT_APP_WS_URL="wss://api.lingualive.com"

# Deploy
vercel --prod
```

### **Kubernetes Deployment**

#### **1. Kubernetes Cluster Setup**
```bash
# Create AKS cluster
az aks create \
  --resource-group lingualive-rg \
  --name lingualive-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group lingualive-rg --name lingualive-cluster
```

#### **2. Deploy to Kubernetes**
```bash
# Apply Kubernetes manifests
kubectl apply -f deployment/kubernetes/k8s-deployment.yaml

# Check deployment status
kubectl get pods -n lingualive
kubectl get services -n lingualive
kubectl get ingress -n lingualive
```

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Workflow**

The CI/CD pipeline is configured in `.github/workflows/ci-cd.yml` and includes:

1. **Testing**: Backend and frontend tests
2. **Building**: Docker image creation
3. **Security**: Vulnerability scanning
4. **Deployment**: Multi-environment deployment
5. **Monitoring**: Performance testing

### **Pipeline Triggers**
- **Push to `develop`**: Deploy to staging
- **Push to `main`**: Deploy to production
- **Release**: Deploy extension to Chrome Web Store

### **Required Secrets**
```yaml
# GitHub Secrets
MONGODB_URI: "your-mongodb-connection-string"
REDIS_URL: "your-redis-connection-string"
GOOGLE_CREDENTIALS: "base64-encoded-google-credentials"
SENTRY_DSN: "your-sentry-dsn"
VERCEL_TOKEN: "your-vercel-token"
VERCEL_ORG_ID: "your-vercel-org-id"
VERCEL_PROJECT_ID: "your-vercel-project-id"
```

## 📊 **Monitoring and Observability**

### **Prometheus Configuration**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'lingualive-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
```

### **Grafana Dashboards**
- **Application Metrics**: Request rate, response time, error rate
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Business Metrics**: Translation requests, user sessions

### **Alerting Rules**
```yaml
# monitoring/alert_rules.yml
groups:
  - name: lingualive-alerts
    rules:
      - alert: BackendAPIDown
        expr: up{job="lingualive-backend"} == 0
        for: 1m
        labels:
          severity: critical
```

## 🔒 **Security Configuration**

### **SSL/TLS Setup**
```bash
# Generate SSL certificate with Let's Encrypt
certbot certonly --webroot -w /var/www/html -d api.lingualive.com

# Configure nginx with SSL
cp nginx/ssl/nginx-ssl.conf /etc/nginx/sites-available/lingualive
ln -s /etc/nginx/sites-available/lingualive /etc/nginx/sites-enabled/
```

### **Security Headers**
```nginx
# nginx.conf
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### **Rate Limiting**
```nginx
# Rate limiting configuration
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;
```

## 📈 **Performance Optimization**

### **Backend Optimization**
```python
# uvicorn configuration
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### **Frontend Optimization**
```javascript
// React build optimization
"scripts": {
  "build": "GENERATE_SOURCEMAP=false react-scripts build"
}
```

### **Database Optimization**
```javascript
// MongoDB connection pooling
const client = new MongoClient(uri, {
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000
});
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Backend Health Check Fails**
```bash
# Check logs
docker logs lingualive-backend

# Check environment variables
docker exec lingualive-backend env

# Check database connectivity
docker exec lingualive-backend curl http://localhost:8000/debug/mongodb
```

#### **2. Frontend Build Fails**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### **3. Docker Compose Issues**
```bash
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache
```

### **Debug Commands**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access container shell
docker-compose exec backend bash
docker-compose exec frontend sh

# Check network connectivity
docker-compose exec backend ping mongodb
docker-compose exec backend ping redis
```

## 📚 **Additional Resources**

### **Documentation**
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)

### **Tools**
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/)
- [Vercel CLI](https://vercel.com/docs/cli)
- [kubectl](https://kubernetes.io/docs/reference/kubectl/)
- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)

### **Monitoring**
- [Sentry](https://sentry.io/for/python/)
- [Azure Monitor](https://docs.microsoft.com/en-us/azure/azure-monitor/)
- [Vercel Analytics](https://vercel.com/analytics)

---

**🎉 Congratulations!** Your LinguaLive application is now deployed and ready for production use. Monitor the application using the provided tools and scale as needed based on usage patterns. 