from fastapi import Request
import time
import logging

logger = logging.getLogger(__name__)

class LoggingMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            start_time = time.time()
            
            # Log request
            logger.info(f"Request: {request.method} {request.url}")
            
            # Process request
            await self.app(scope, receive, send)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Log response
            logger.info(f"Response: {duration:.3f}s")
        else:
            await self.app(scope, receive, send) 