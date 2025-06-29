from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
import os

from app.config.settings import settings
from app.middleware.logging import LoggingMiddleware
from app.services.websocket_manager import WebSocketManager
from app.api.v1 import auth, meetings, transcripts, translation, users

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Sentry
if settings.sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.asyncio import AsyncioIntegration
    
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        integrations=[
            FastApiIntegration(),
            AsyncioIntegration(),
        ],
        traces_sample_rate=1.0,
    )

app = FastAPI(
    title="LinguaLive API",
    description="Real-time speech translation API",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    debug=settings.debug
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://127.0.0.1:3000",  # React dev server alternative
        "chrome-extension://*",   # Chrome extensions
        "moz-extension://*",      # Firefox extensions
        "safari-extension://*",   # Safari extensions
        "edge-extension://*",     # Edge extensions
        "*"  # Allow all origins for development (remove in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Add custom logging middleware
app.add_middleware(LoggingMiddleware)

# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(meetings.router, prefix="/api/v1/meetings", tags=["Meetings"])
app.include_router(transcripts.router, prefix="/api/v1/transcripts", tags=["Transcripts"])
app.include_router(translation.router, prefix="/api/v1/translation", tags=["Translation"])

@app.get("/")
async def root():
    return {"message": "LinguaLive API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "LinguaLive API"}

# Debug routes
@app.get("/debug/mongodb")
async def debug_mongodb():
    """Debug MongoDB connectivity"""
    try:
        from app.services.database import get_database
        db = get_database()
        
        # Test basic operations
        collections = await db.list_collection_names()
        
        # Test each collection
        results = {}
        for collection_name in ['users', 'meetings', 'transcripts']:
            try:
                collection = db[collection_name]
                count = await collection.count_documents({})
                
                # Get a sample document if collection has data
                sample = None
                if count > 0:
                    sample = await collection.find_one()
                
                results[collection_name] = {
                    "exists": True,
                    "count": count,
                    "sample": sample
                }
            except Exception as e:
                results[collection_name] = {
                    "exists": False,
                    "error": str(e)
                }
        
        return {
            "status": "connected",
            "collections": collections,
            "results": results
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/debug/redis")
async def debug_redis():
    """Debug Redis connectivity"""
    try:
        from app.services.redis import get_redis_client
        redis_client = get_redis_client()
        
        # Test basic operations
        await redis_client.set("test_key", "test_value")
        value = await redis_client.get("test_key")
        await redis_client.delete("test_key")
        
        return {
            "status": "connected",
            "test_result": value == b"test_value"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/debug/gcp")
async def debug_gcp():
    """Debug Google Cloud Platform services"""
    try:
        from app.services.translation import TranslationService
        service = TranslationService()
        
        # Test Google Cloud client initialization
        client_status = "not_initialized"
        if service.client:
            client_status = "initialized"
        
        # Test project ID
        project_id = getattr(service, 'project_id', None)
        
        # Test credentials
        credentials_status = "not_found"
        try:
            if os.path.exists('credentials/google-credentials.json'):
                credentials_status = "found"
            elif os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
                credentials_status = "env_variable"
            else:
                credentials_status = "not_found"
        except Exception:
            credentials_status = "error"
        
        return {
            "translation_service": {
                "client_status": client_status,
                "project_id": project_id,
                "credentials_status": credentials_status
            },
            "environment_variables": {
                "GOOGLE_APPLICATION_CREDENTIALS": bool(os.getenv('GOOGLE_APPLICATION_CREDENTIALS')),
                "GOOGLE_CLOUD_PROJECT": bool(os.getenv('GOOGLE_CLOUD_PROJECT'))
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/debug/100ms")
async def debug_100ms():
    """Debug 100ms SDK configuration"""
    try:
        # Check environment variables
        env_vars = {
            "HMS_APP_GROUP_ID": bool(os.getenv('HMS_APP_GROUP_ID')),
            "HMS_APP_ID": bool(os.getenv('HMS_APP_ID')),
            "HMS_APP_SECRET": bool(os.getenv('HMS_APP_SECRET'))
        }
        
        # Check if all required variables are set
        all_set = all(env_vars.values())
        
        return {
            "status": "configured" if all_set else "incomplete",
            "environment_variables": env_vars,
            "missing_variables": [k for k, v in env_vars.items() if not v]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/debug/all")
async def debug_all():
    """Debug all services"""
    return {
        "mongodb": await debug_mongodb(),
        "redis": await debug_redis(),
        "gcp": await debug_gcp(),
        "100ms": await debug_100ms()
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    ) 