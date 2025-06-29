from fastapi import APIRouter
from app.models.user import User

router = APIRouter()

@router.get("/profile", response_model=User)
async def get_user_profile():
    """Mock user profile endpoint for testing"""
    return {
        "id": "507f1f77bcf86cd799439011",
        "email": "test@example.com",
        "name": "Test User",
        "avatar": None,
        "preferences": {
            "defaultSourceLanguage": "en",
            "defaultTargetLanguage": "es",
            "theme": "light",
            "notifications": True
        },
        "is_active": True,
        "is_verified": True,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
        "last_login": "2024-01-15T10:30:00Z"
    } 