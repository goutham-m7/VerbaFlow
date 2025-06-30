import redis.asyncio as redis
from app.config.settings import settings

redis_client = None

def get_redis_client():
    """Get Redis client"""
    global redis_client
    if not redis_client:
        redis_client = redis.from_url(settings.redis_url, db=settings.redis_db)
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