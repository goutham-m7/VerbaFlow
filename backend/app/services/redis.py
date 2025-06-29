import redis.asyncio as redis
from app.config.settings import settings

# Mock Redis client for testing
class MockRedis:
    async def ping(self):
        return True
    
    async def get(self, key: str):
        return None
    
    async def set(self, key: str, value: str, ex: int = None):
        return True
    
    async def delete(self, key: str):
        return 1

# Global Redis client
redis_client = None

def get_redis_client():
    """Get Redis client"""
    global redis_client
    redis_client = redis.from_url(settings.redis_url)
    return redis_client

async def connect_redis():
    """Connect to Redis"""
    global redis_client
    try:
        # In production, this would connect to Redis
        # redis_client = redis.from_url(settings.redis_url)
        # For testing, use mock
        redis_client = MockRedis()
        return redis_client
    except Exception as e:
        print(f"Failed to connect to Redis: {e}")
        raise

async def close_redis():
    """Close Redis connection"""
    global redis_client
    if redis_client:
        # In production, this would close the Redis connection
        redis_client = None 