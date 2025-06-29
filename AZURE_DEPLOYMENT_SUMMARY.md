# 🚀 **Azure Web Services Deployment Summary for LinguaLive**

## 🚀 **Quick Start**

Deploy LinguaLive to Azure using your existing MongoDB and Redis infrastructure:

```bash
# Quick deployment (~$15-20/month)
./scripts/azure-deploy.sh

# Comprehensive setup (~$85/month)
./scripts/azure-setup.sh
```

## 📋 **Infrastructure Overview**

### **Core Services**
- **Backend**: Azure App Service (Python 3.11)
- **Frontend**: Azure Static Web Apps (React)
- **Database**: Your existing MongoDB
- **Cache**: Your existing Redis
- **Monitoring**: Sentry (configured)

### **GitHub Integration**
- **Repository**: `goutham-m7/verbaflow`
- **Branch**: `main`
- **Deployment**: Continuous deployment from GitHub

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   External      │
│   (Static Web   │◄──►│   (App Service) │◄──►│   Services      │
│    Apps)        │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Your MongoDB  │    │  Google Cloud   │
                       │   Database      │    │  Translation    │
                       └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Your Redis    │
                       │     Cache       │
                       └─────────────────┘
```

## 💰 **Cost Breakdown**

### **Quick Deployment**
- App Service Plan (B1): ~$13/month
- Static Web App: ~$2/month
- **Total**: ~$15-20/month

### **Production Setup**
- App Service Plan (P1v2): ~$75/month
- Static Web App: ~$10/month
- **Total**: ~$85/month

### **Cost Optimization**
- Use Basic plan for development
- Upgrade to Standard for production
- Monitor usage and set spending limits

## 🔧 **Configuration**

### **Required Environment Variables**
```bash
# Database connections
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string

# Core settings
DEBUG=false
HOST=0.0.0.0
PORT=8000
```

### **Optional Environment Variables**
```bash
# Monitoring
SENTRY_DSN=your_sentry_dsn
SENTRY_ENVIRONMENT=production

# Google Cloud (translation)
GOOGLE_APPLICATION_CREDENTIALS_JSON=your_google_credentials

# 100ms (video conferencing)
HMS_APP_GROUP_ID=your_100ms_app_group_id
HMS_APP_ID=your_100ms_app_id
HMS_APP_SECRET=your_100ms_app_secret
```

## 🌐 **Application URLs**

After deployment, your applications will be available at:

- **Frontend**: `https://lingualive-frontend.azurestaticapps.net`
- **Backend API**: `https://lingualive-backend.azurewebsites.net`
- **API Documentation**: `https://lingualive-backend.azurewebsites.net/docs`
- **Health Check**: `https://lingualive-backend.azurewebsites.net/health`

## 🔍 **Monitoring & Debugging**

### **Health Check Endpoints**
- `/health` - Basic health check
- `/debug/mongodb` - MongoDB connection test
- `/debug/redis` - Redis connection test
- `/debug/gcp` - Google Cloud integration test
- `/debug/100ms` - 100ms integration test
- `/debug/all` - All services health check

### **Logging**
- Backend logs: Azure App Service logs
- Frontend errors: Sentry
- Application monitoring: Sentry performance tracking

### **Debug Commands**
```bash
# Check backend health
curl https://lingualive-backend.azurewebsites.net/health

# Test all services
curl https://lingualive-backend.azurewebsites.net/debug/all

# View backend logs
az webapp log tail --name lingualive-backend --resource-group lingualive-rg
```

## 🔒 **Security Features**

- **HTTPS Only**: All traffic encrypted by default
- **CORS Configuration**: Restricted to your domains
- **Environment Variables**: Secrets stored securely
- **No Key Vault**: Using your existing secure database setup

## 🚀 **Deployment Options**

### **Option 1: Quick Deployment**
```bash
./scripts/azure-deploy.sh
```
- Basic infrastructure
- Minimal configuration
- Lower cost (~$15-20/month)
- Good for development/testing

### **Option 2: Production Setup**
```bash
./scripts/azure-setup.sh
```
- Production-grade infrastructure
- Full configuration options
- Custom domain support
- Higher cost (~$85/month)
- Good for production

## 🔄 **Continuous Deployment**

The setup configures automatic deployment from GitHub:

1. Push changes to `main` branch
2. Azure automatically builds and deploys
3. Monitor deployment in Azure portal

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **Backend Not Starting**
   - Check App Service logs
   - Verify environment variables
   - Ensure Python 3.11 runtime

2. **Database Connection Issues**
   - Verify connection strings
   - Check network connectivity
   - Test with debug endpoints

3. **Frontend Not Loading**
   - Check Static Web App build logs
   - Verify environment variables
   - Check CORS configuration

4. **Translation Not Working**
   - Verify Google Cloud credentials
   - Check API quotas
   - Test with `/debug/gcp` endpoint

### **Scaling Issues**
```bash
# Upgrade App Service Plan
az appservice plan update \
    --name lingualive-plan \
    --resource-group lingualive-rg \
    --sku P2v2

# Enable auto-scaling
az monitor autoscale create \
    --resource-group lingualive-rg \
    --resource lingualive-backend \
    --resource-type Microsoft.Web/sites \
    --name lingualive-autoscale \
    --min-count 1 \
    --max-count 10 \
    --count 2
```

## 📈 **Performance Optimization**

### **Backend Optimization**
- Use connection pooling for databases
- Implement caching strategies
- Monitor API response times
- Optimize database queries

### **Frontend Optimization**
- Enable CDN for static assets
- Implement lazy loading
- Optimize bundle size
- Use service workers for caching

## 🔧 **Customization**

### **Custom Domains**
```bash
# Backend custom domain
az webapp config hostname add \
    --webapp-name lingualive-backend \
    --resource-group lingualive-rg \
    --hostname api.yourdomain.com

# Frontend custom domain
az staticwebapp hostname set \
    --name lingualive-frontend \
    --resource-group lingualive-rg \
    --hostname yourdomain.com
```

### **Environment-Specific Configurations**
- Development: Basic plan, debug enabled
- Staging: Standard plan, limited features
- Production: Premium plan, full features

## 📚 **Documentation & Resources**

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Google Cloud Translation API](https://cloud.google.com/translate/docs)

## 🎯 **Next Steps**

1. **Test Deployment**: Verify all features work correctly
2. **Configure Monitoring**: Set up Sentry alerts
3. **Custom Domains**: Add your domain names
4. **SSL Certificates**: Azure handles this automatically
5. **Performance Monitoring**: Track usage and optimize
6. **Scaling Planning**: Plan for growth

## 📞 **Support**

For issues or questions:
1. Check the troubleshooting section
2. Review Azure App Service logs
3. Check Sentry for error reports
4. Use debug endpoints for diagnostics

---

**Note**: This deployment uses your existing MongoDB and Redis services, eliminating the need for Azure Key Vault and Azure Monitor while maintaining security and observability through Sentry. 