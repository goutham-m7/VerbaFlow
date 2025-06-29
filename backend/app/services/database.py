from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from pymongo import MongoClient
# Mock database client for testing
class MockDatabase:
    async def command(self, command: str):
        if command == "ping":
            return {"ok": 1}
        return {"ok": 1}

# Global database client
db_client = None

def get_database():
    """Get database client"""
    global db_client
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db_client = client.lingualive
    return db_client

async def connect_database():
    """Connect to database"""
    global db_client
    try:
        # In production, this would connect to MongoDB
        # db_client = AsyncIOMotorClient(settings.mongodb_uri)
        # For testing, use mock
        db_client = MockDatabase()
        return db_client
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        raise

async def close_database():
    """Close database connection"""
    global db_client
    if db_client:
        # In production, this would close the MongoDB connection
        db_client = None 