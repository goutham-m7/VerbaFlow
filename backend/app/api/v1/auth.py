from fastapi import APIRouter, HTTPException, Depends
from app.models.user import UserLogin, UserLoginResponse, UserRegistration, User
from datetime import datetime

router = APIRouter()

# In-memory user store: {email: {user_data}}
user_store = {
    "test@example.com": {
        "email": "test@example.com",
        "name": "Test User",
        "password": "password123",
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
}

@router.post("/register", response_model=UserLoginResponse)
async def register(user_data: UserRegistration):
    """Register a new user and return auth tokens"""
    if user_data.email in user_store:
        raise HTTPException(status_code=400, detail="User already exists")
    now = datetime.utcnow().isoformat()
    user_store[user_data.email] = {
        "email": user_data.email,
        "name": user_data.name,
        "password": user_data.password,  # Plain text for demo only
        "avatar": None,
        "preferences": {
            "defaultSourceLanguage": "en",
            "defaultTargetLanguage": "es",
            "theme": "light",
            "notifications": True
        },
        "is_active": True,
        "is_verified": False,
        "created_at": now,
        "updated_at": now,
        "last_login": None
    }
    return UserLoginResponse(
        access_token="mock_token_123",
        refresh_token="mock_refresh_token_123",
        token_type="bearer",
        expires_in=3600,
        user=User(
            id="user-" + user_data.email,
            email=user_data.email,
            name=user_data.name,
            avatar=None,
            preferences={
                "default_source_language": "en",
                "default_target_language": "es",
                "theme": "light",
                "notifications": True
            },
            is_active=True,
            is_verified=False,
            created_at=now,
            updated_at=now,
            last_login=None
        )
    )

@router.post("/login", response_model=UserLoginResponse)
async def login(user_data: UserLogin):
    """Login endpoint for any registered user"""
    user = user_store.get(user_data.email)
    if user and user["password"] == user_data.password:
        now = datetime.utcnow().isoformat()
        user["last_login"] = now
        return UserLoginResponse(
            access_token="mock_token_123",
            refresh_token="mock_refresh_token_123",
            token_type="bearer",
            expires_in=3600,
            user=User(
                id="user-" + user["email"],
                email=user["email"],
                name=user["name"],
                avatar=user["avatar"],
                preferences={
                    "default_source_language": "en",
                    "default_target_language": "es",
                    "theme": "light",
                    "notifications": True
                },
                is_active=user["is_active"],
                is_verified=user["is_verified"],
                created_at=user["created_at"],
                updated_at=user["updated_at"],
                last_login=user["last_login"]
            )
        )
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/profile")
async def get_profile():
    """Mock profile endpoint for testing"""
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
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": "2024-01-15T10:30:00Z"
    } 