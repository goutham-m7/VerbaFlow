from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Application settings
    app_name: str = "VerbaFlow"
    debug: bool = True  # Set to True for development
    version: str = "1.0.0"
    
    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    
    # Security settings
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    
    # CORS settings
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://verbaflow-frontend.azurewebsites.net"
    ]
    allowed_hosts: List[str] = ["*"]
    
    
    # Database settings
    mongodb_uri: str = "mongodb://localhost:27017/verbaflow"
    mongodb_database: str = "verbaflow"
    
    # MongoDB Atlas specific settings for Azure Web Apps
    mongodb_use_atlas: bool = False
    mongodb_atlas_cluster: str = ""
    mongodb_atlas_username: str = ""
    mongodb_atlas_password: str = ""
    mongodb_atlas_database: str = "verbaflow"
    
    # Redis settings
    redis_url: str = "redis://localhost:6379"
    redis_db: int = 0
    
    # Google Cloud settings
    google_cloud_project: str = "your-google-project-id"
    google_application_credentials: Optional[str] = None
    
    # 100ms settings
    hms_template_id: str = "your-100ms-template-id"
    hms_management_token: str = "your-100ms-management-token"
    hms_app_group_id: str = "your-100ms-app-group-id"
    hms_app_id: str = "your-100ms-app-id"
    hms_app_secret: str = "your-100ms-app-secret"
    
    # Sentry settings
    sentry_dsn: Optional[str] = None
    sentry_environment: str = "development"
    
    # Azure settings
    azure_application_insights_connection_string: Optional[str] = None
    
    # File upload settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_audio_formats: List[str] = ["wav", "mp3", "m4a", "ogg"]
    
    # Rate limiting
    rate_limit_requests: int = 1000
    rate_limit_window: int = 3600  # 1 hour
    
    # WebSocket settings
    websocket_ping_interval: int = 20
    websocket_ping_timeout: int = 20
    
    # Translation settings
    default_source_language: str = "en"
    default_target_language: str = "es"
    supported_languages: List[str] = [
        "en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh"
    ]
    
    # Meeting settings
    max_meeting_participants: int = 50
    meeting_timeout_minutes: int = 120
    auto_cleanup_meetings: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        env_prefix = ""  # No prefix for environment variables

# Create settings instance
settings = Settings()

# Load environment variables
if os.path.exists(".env"):
    from dotenv import load_dotenv
    load_dotenv() 