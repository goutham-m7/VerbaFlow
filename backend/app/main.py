from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
import os
from contextlib import asynccontextmanager

from app.config.settings import settings
from app.middleware.logging import LoggingMiddleware
from app.services.websocket_manager import manager
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting LinguaLive API server...")
    yield
    # Shutdown
    logger.info("Shutting down LinguaLive API server...")

app = FastAPI(
    title="LinguaLive API",
    description="Real-time speech translation API for video calls and meetings",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# Add middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Include API routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(meetings.router, prefix="/api/v1/meetings", tags=["Meetings"])
app.include_router(transcripts.router, prefix="/api/v1/transcripts", tags=["Transcripts"])
app.include_router(translation.router, prefix="/api/v1/translation", tags=["Translation"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])

@app.get("/")
async def root():
    return {
        "message": "LinguaLive API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.debug else "Documentation disabled in production"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}

# WebSocket endpoint for real-time translation sharing
@app.websocket("/ws/translations")
async def websocket_translations(websocket: WebSocket):
    """WebSocket endpoint for real-time translation sharing between participants"""
    try:
        await websocket.accept()
        
        # Get initial connection data
        initial_data = await websocket.receive_text()
        import json
        data = json.loads(initial_data)
        
        if data.get("type") == "join_room":
            room_id = data.get("roomId")
            user_id = data.get("userId")
            settings = data.get("settings", {})
            
            if not room_id or not user_id:
                await websocket.close(code=1008, reason="Missing room_id or user_id")
                return
            
            await manager.connect(websocket, room_id, user_id, settings)
            
            # Handle incoming messages
            try:
                while True:
                    message_data = await websocket.receive_text()
                    message = json.loads(message_data)
                    
                    if message.get("type") == "translation":
                        await manager.handle_translation(room_id, user_id, message)
                    elif message.get("type") == "update_settings":
                        await manager.handle_settings_update(room_id, user_id, message.get("settings", {}))
                    elif message.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong"}))
                    else:
                        logger.warning(f"Unknown message type: {message.get('type')}")
                        
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for user {user_id} in room {room_id}")
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
            finally:
                await manager.disconnect(room_id, user_id)
        else:
            await websocket.close(code=1008, reason="Invalid initial message")
            
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
        try:
            await websocket.close(code=1011, reason="Internal error")
        except:
            pass

# Debug endpoints
@app.get("/debug/mongodb")
async def debug_mongodb():
    """Debug endpoint to test MongoDB connectivity"""
    try:
        from app.services.database import get_database
        from app.utils.mongo_serializer import serialize_mongo_response
        db = get_database()
        
        # Test collections
        collections = ["users", "meetings", "transcripts"]
        results = {}
        
        for collection_name in collections:
            try:
                collection = db[collection_name]
                count = await collection.count_documents({})
                
                if count == 0:
                    # Create sample document
                    sample_doc = {
                        "test": True,
                        "timestamp": "2024-01-01T00:00:00Z",
                        "message": f"Sample document for {collection_name}"
                    }
                    await collection.insert_one(sample_doc)
                    results[collection_name] = {"status": "created_sample", "count": 1}
                else:
                    # Get sample document and serialize it properly
                    sample = await collection.find_one({})
                    serialized_sample = serialize_mongo_response(sample) if sample else None
                    results[collection_name] = {"status": "connected", "count": count, "sample": serialized_sample}
                    
            except Exception as e:
                results[collection_name] = {"status": "error", "error": str(e)}
        
        return {
            "status": "connected",
            "collections": collections,
            "results": results
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/debug/redis")
async def debug_redis():
    """Debug endpoint to test Redis connectivity"""
    try:
        from app.services.redis import get_redis_client
        redis_client = get_redis_client()
        
        # Test basic operations
        await redis_client.set("test_key", "test_value")
        value = await redis_client.get("test_key")
        await redis_client.delete("test_key")
        
        return {
            "status": "connected",
            "test_result": value == b"test_value",
            "message": "Redis operations successful"
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/debug/gcp")
async def debug_gcp():
    """Debug endpoint to test Google Cloud Platform services"""
    try:
        # Check environment variables
        env_vars = {
            "GOOGLE_APPLICATION_CREDENTIALS": os.getenv("GOOGLE_APPLICATION_CREDENTIALS"),
            "GOOGLE_CLOUD_PROJECT": os.getenv("GOOGLE_CLOUD_PROJECT"),
        }
        
        # Check if credentials file exists
        creds_file_exists = os.path.exists(env_vars["GOOGLE_APPLICATION_CREDENTIALS"]) if env_vars["GOOGLE_APPLICATION_CREDENTIALS"] else False
        
        # Test Google Cloud Translate
        translate_status = "not_tested"
        try:
            from google.cloud import translate_v2 as translate
            client = translate.Client()
            result = client.translate("Hello", target_language="es")
            translate_status = "working" if result["translatedText"] == "Hola" else "unexpected_result"
        except ImportError:
            translate_status = "not_installed"
        except Exception as e:
            translate_status = f"error: {str(e)}"
        
        # Test Google Cloud Speech-to-Text
        speech_status = "not_tested"
        try:
            from google.cloud import speech
            client = speech.SpeechClient()
            speech_status = "client_created"
        except ImportError:
            speech_status = "not_installed"
        except Exception as e:
            speech_status = f"error: {str(e)}"
        
        # Test Google Cloud Text-to-Speech
        tts_status = "not_tested"
        try:
            from google.cloud import texttospeech
            client = texttospeech.TextToSpeechClient()
            tts_status = "client_created"
        except ImportError:
            tts_status = "not_installed"
        except Exception as e:
            tts_status = f"error: {str(e)}"
        
        return {
            "status": "checked",
            "environment_variables": env_vars,
            "credentials_file_exists": creds_file_exists,
            "services": {
                "translate": translate_status,
                "speech_to_text": speech_status,
                "text_to_speech": tts_status
            }
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/debug/100ms")
async def debug_100ms():
    """Debug endpoint to test 100ms SDK configuration"""
    try:
        # Check environment variables
        env_vars = {
            "HMS_APP_GROUP_ID": os.getenv("HMS_APP_GROUP_ID"),
            "HMS_APP_ID": os.getenv("HMS_APP_ID"),
            "HMS_APP_SECRET": os.getenv("HMS_APP_SECRET"),
        }
        
        # Check if all required variables are set
        required_vars = ["HMS_APP_GROUP_ID", "HMS_APP_ID", "HMS_APP_SECRET"]
        missing_vars = [var for var in required_vars if not env_vars.get(var)]
        
        # Test 100ms SDK import
        sdk_status = "not_tested"
        try:
            import hms
            sdk_status = "imported"
        except ImportError:
            sdk_status = "not_installed"
        except Exception as e:
            sdk_status = f"error: {str(e)}"
        
        return {
            "status": "checked",
            "environment_variables": env_vars,
            "missing_variables": missing_vars,
            "sdk_status": sdk_status,
            "configured": len(missing_vars) == 0
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/debug/all")
async def debug_all():
    """Debug endpoint to test all services"""
    try:
        # Run all debug checks
        mongodb_result = await debug_mongodb()
        redis_result = await debug_redis()
        gcp_result = await debug_gcp()
        hms_result = await debug_100ms()
        
        # Overall status
        all_working = (
            mongodb_result.get("status") == "connected" and
            redis_result.get("status") == "connected" and
            gcp_result.get("status") == "checked" and
            hms_result.get("status") == "checked"
        )
        
        return {
            "status": "all_checked",
            "all_services_working": all_working,
            "services": {
                "mongodb": mongodb_result,
                "redis": redis_result,
                "gcp": gcp_result,
                "100ms": hms_result
            }
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

# WebSocket room statistics endpoint
@app.get("/debug/websocket-stats")
async def websocket_stats():
    """Get WebSocket room statistics"""
    try:
        stats = manager.get_room_stats()
        return {
            "status": "success",
            "stats": stats
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}

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
    uvicorn.run(app, host="0.0.0.0", port=8000) 