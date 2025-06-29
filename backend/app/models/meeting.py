from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId

class LanguagePreferences(BaseModel):
    source_language: str = "en"
    target_language: str = "es"

class Participant(BaseModel):
    user_id: Optional[str] = None  # Changed from PyObjectId to str for simplicity
    name: str
    role: str = "participant"  # host, co-host, participant
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    left_at: Optional[datetime] = None
    language_preferences: LanguagePreferences = LanguagePreferences()
    is_muted: bool = False
    is_video_on: bool = True

class MeetingSettings(BaseModel):
    max_participants: int = 50
    recording_enabled: bool = False
    transcription_enabled: bool = True
    auto_translate: bool = True
    allow_guest_access: bool = True
    require_authentication: bool = False

class MeetingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    settings: MeetingSettings = MeetingSettings()

class MeetingCreate(MeetingBase):
    pass

class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    settings: Optional[MeetingSettings] = None

class MeetingInDB(MeetingBase):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "meeting_id": "abc123def456",
                "title": "Team Meeting",
                "description": "Weekly team sync",
                "host_id": "507f1f77bcf86cd799439012",
                "participants": [],
                "status": "scheduled",
                "started_at": None,
                "ended_at": None,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "join_url": "https://meet.verbaflow.com/abc123def456",
                "recording_url": None
            }
        }
    )
    
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    meeting_id: str = Field(..., unique=True)  # Short, shareable ID
    host_id: str  # Changed from PyObjectId to str for simplicity
    participants: List[Participant] = []
    status: str = "scheduled"  # scheduled, active, ended, cancelled
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    join_url: Optional[str] = None
    recording_url: Optional[str] = None

class Meeting(MeetingBase):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "meeting_id": "abc123def456",
                "title": "Team Meeting",
                "description": "Weekly team sync",
                "host_id": "507f1f77bcf86cd799439012",
                "host_name": "John Doe",
                "participants": [],
                "participant_count": 0,
                "status": "scheduled",
                "started_at": None,
                "ended_at": None,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z",
                "join_url": "https://meet.verbaflow.com/abc123def456",
                "recording_url": None
            }
        }
    )
    
    id: str
    meeting_id: str
    host_id: str
    host_name: Optional[str] = None
    participants: List[Participant]
    participant_count: int
    status: str
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    join_url: Optional[str]
    recording_url: Optional[str]

class MeetingJoin(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    language_preferences: Optional[LanguagePreferences] = None

class MeetingJoinResponse(BaseModel):
    meeting_id: str
    participant_id: str
    webrtc_token: str
    websocket_url: str
    meeting_settings: MeetingSettings

class MeetingListResponse(BaseModel):
    meetings: List[Meeting]
    pagination: Dict[str, Any]

class MeetingFilter(BaseModel):
    status: Optional[str] = None
    search: Optional[str] = None
    page: int = 1
    limit: int = 20 