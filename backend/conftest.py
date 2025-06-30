import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Add the parent directory to Python path for imports
parent_dir = backend_dir.parent
sys.path.insert(0, str(parent_dir))

import pytest
from unittest.mock import Mock, patch

@pytest.fixture
def mock_google_translate():
    """Mock Google Translate client"""
    with patch('app.services.translation.translate_v2.Client') as mock_client:
        mock_instance = Mock()
        mock_client.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    with patch('app.services.redis.redis.Redis') as mock_redis:
        mock_instance = Mock()
        mock_redis.return_value = mock_instance
        yield mock_instance

@pytest.fixture
def mock_mongodb():
    """Mock MongoDB client"""
    with patch('app.services.database.motor.motor_asyncio.AsyncIOMotorClient') as mock_client:
        mock_instance = Mock()
        mock_client.return_value = mock_instance
        yield mock_instance 