import ssl
from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from pymongo import MongoClient
import logging
import urllib.parse

logger = logging.getLogger(__name__)

db_client = None

def get_mongodb_connection_string():
    if settings.mongodb_use_atlas and settings.mongodb_atlas_cluster:
        username = urllib.parse.quote_plus(settings.mongodb_atlas_username)
        password = urllib.parse.quote_plus(settings.mongodb_atlas_password)
        cluster = settings.mongodb_atlas_cluster
        database = settings.mongodb_atlas_database
        connection_string = f"mongodb+srv://{username}:{password}@{cluster}/{database}?retryWrites=true&w=majority&tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true&maxPoolSize=10&minPoolSize=1&maxIdleTimeMS=30000&serverSelectionTimeoutMS=30000&connectTimeoutMS=30000&socketTimeoutMS=30000"
        logger.info(f"Using MongoDB Atlas connection: {cluster}")
        return connection_string
    else:
        logger.info("Using direct MongoDB URI")
        return settings.mongodb_uri

def get_database():
    global db_client
    if not db_client:
        try:
            connection_string = get_mongodb_connection_string()
            connection_options = {
                "tls": True,
                "tlsAllowInvalidCertificates": True,
                "tlsAllowInvalidHostnames": True,
                "retryWrites": True,
                "w": "majority",
                "maxPoolSize": 10,
                "minPoolSize": 1,
                "maxIdleTimeMS": 30000,
                "serverSelectionTimeoutMS": 30000,
                "connectTimeoutMS": 30000,
                "socketTimeoutMS": 30000,
            }
            client = AsyncIOMotorClient(
                connection_string,
                **connection_options
            )
            database_name = settings.mongodb_atlas_database if settings.mongodb_use_atlas else settings.mongodb_database
            db_client = client[database_name]
            logger.info(f"MongoDB client initialized with TLS configuration for database: {database_name}")
        except Exception as e:
            logger.error(f"Failed to initialize MongoDB client: {e}")
            raise
    return db_client

async def connect_database():
    global db_client
    try:
        db = get_database()
        await db.command("ping")
        logger.info("MongoDB connection successful")
        return db
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

async def close_database():
    global db_client
    if db_client:
        try:
            db_client.client.close()
            logger.info("MongoDB connection closed")
        except Exception as e:
            logger.error(f"Error closing MongoDB connection: {e}")
    db_client = None 