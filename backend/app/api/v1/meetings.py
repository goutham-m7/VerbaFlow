from fastapi import APIRouter, HTTPException
from app.models.meeting import MeetingCreate, Meeting, MeetingJoin, MeetingJoinResponse

router = APIRouter()

@router.get("/", response_model=list[Meeting])
async def get_meetings():
    """Mock meetings list endpoint for testing"""
    return [
        {
            "id": "507f1f77bcf86cd799439011",
            "meeting_id": "abc123def456",
            "title": "Test Meeting",
            "description": "A test meeting",
            "host_id": "507f1f77bcf86cd799439012",
            "host_name": "Test Host",
            "participants": [],
            "participant_count": 0,
            "status": "scheduled",
            "started_at": None,
            "ended_at": None,
            "created_at": "2024-01-15T09:00:00Z",
            "updated_at": "2024-01-15T09:00:00Z",
            "join_url": "https://meet.verbaflow.com/abc123def456",
            "recording_url": None,
            "scheduled_at": "2024-01-15T10:00:00Z",
            "settings": {
                "max_participants": 20,
                "recording_enabled": True,
                "transcription_enabled": True,
                "auto_translate": True,
                "allow_guest_access": True,
                "require_authentication": False
            }
        }
    ]

@router.post("/", response_model=Meeting)
async def create_meeting(meeting_data: MeetingCreate):
    """Mock create meeting endpoint for testing"""
    return {
        "id": "507f1f77bcf86cd799439011",
        "meeting_id": "abc123def456",
        "title": meeting_data.title,
        "description": meeting_data.description,
        "host_id": "507f1f77bcf86cd799439012",
        "host_name": "Test Host",
        "participants": [],
        "participant_count": 0,
        "status": "scheduled",
        "started_at": None,
        "ended_at": None,
        "created_at": "2024-01-15T09:00:00Z",
        "updated_at": "2024-01-15T09:00:00Z",
        "join_url": "https://meet.verbaflow.com/abc123def456",
        "recording_url": None,
        "scheduled_at": meeting_data.scheduled_at,
        "settings": meeting_data.settings.dict()
    }

@router.post("/{meeting_id}/join", response_model=MeetingJoinResponse)
async def join_meeting(meeting_id: str, join_data: MeetingJoin):
    """Mock join meeting endpoint for testing"""
    return {
        "meeting_id": meeting_id,
        "participant_id": "507f1f77bcf86cd799439013",
        "webrtc_token": "mock_webrtc_token_123",
        "websocket_url": "wss://api.verbaflow.com/ws",
        "meeting_settings": {
            "max_participants": 20,
            "recording_enabled": True,
            "transcription_enabled": True,
            "auto_translate": True,
            "allow_guest_access": True,
            "require_authentication": False
        }
    } 