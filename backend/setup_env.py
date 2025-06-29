#!/usr/bin/env python3
"""
Setup script to create .env file for VerbaFlow backend
"""

import os

def create_env_file():
    """Create .env file with default development values"""
    
    env_content = """# VerbaFlow Backend Environment Variables

# Application settings
APP_NAME=VerbaFlow
DEBUG=true
VERSION=1.0.0

# Server settings
HOST=0.0.0.0
PORT=8000

# Security settings
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS settings
CORS_ORIGINS=["http://localhost:3000","http://localhost:3001","https://verbaflow-frontend.azurewebsites.net"]
ALLOWED_HOSTS=["*"]

# Database settings (MongoDB)
MONGODB_URI=mongodb://localhost:27017/verbaflow
MONGODB_DATABASE=verbaflow

# Redis settings
REDIS_URL=redis://localhost:6379
REDIS_DB=0

# Google Cloud settings
GOOGLE_CLOUD_PROJECT=your-google-project-id
GOOGLE_APPLICATION_CREDENTIALS=

# 100ms settings
HMS_TEMPLATE_ID=your-100ms-template-id
HMS_MANAGEMENT_TOKEN=your-100ms-management-token

# Sentry settings
SENTRY_DSN=
SENTRY_ENVIRONMENT=development

# Azure settings
AZURE_APPLICATION_INSIGHTS_CONNECTION_STRING=

# File upload settings
MAX_FILE_SIZE=10485760
ALLOWED_AUDIO_FORMATS=["wav","mp3","m4a","ogg"]

# Rate limiting
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=3600

# WebSocket settings
WEBSOCKET_PING_INTERVAL=20
WEBSOCKET_PING_TIMEOUT=20

# Translation settings
DEFAULT_SOURCE_LANGUAGE=en
DEFAULT_TARGET_LANGUAGE=es
SUPPORTED_LANGUAGES=["en","es","fr","de","it","pt","ru","ja","ko","zh"]

# Meeting settings
MAX_MEETING_PARTICIPANTS=50
MEETING_TIMEOUT_MINUTES=120
AUTO_CLEANUP_MEETINGS=true
"""
    
    env_file_path = os.path.join(os.path.dirname(__file__), '.env')
    
    if os.path.exists(env_file_path):
        print(f"⚠️  .env file already exists at {env_file_path}")
        response = input("Do you want to overwrite it? (y/N): ")
        if response.lower() != 'y':
            print("Setup cancelled.")
            return
    
    try:
        with open(env_file_path, 'w') as f:
            f.write(env_content)
        print(f"✅ .env file created successfully at {env_file_path}")
        print("📝 Please update the values in the .env file as needed for your environment.")
        print("🔑 Important: Change the SECRET_KEY to a secure value in production!")
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")

if __name__ == "__main__":
    create_env_file() 