from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime

router = APIRouter()

# In-memory transcript store: {user_id: [session, ...]}
user_transcripts: Dict[str, List[Dict[str, Any]]] = {}

class TranscriptItem(BaseModel):
    id: str
    speaker_id: str
    speaker_name: str
    timestamp: str
    original_text: str
    source_language: str
    translations: List[Dict[str, Any]]
    confidence: float
    is_final: bool

class TranscriptResponse(BaseModel):
    meeting_id: str
    transcripts: List[TranscriptItem]
    summary: Dict[str, Any]

@router.get("/{meeting_id}", response_model=TranscriptResponse)
async def get_transcript(meeting_id: str):
    """Mock transcript endpoint for testing"""
    return TranscriptResponse(
        meeting_id=meeting_id,
        transcripts=[
            TranscriptItem(
                id="507f1f77bcf86cd799439014",
                speaker_id="507f1f77bcf86cd799439012",
                speaker_name="John Doe",
                timestamp="2024-01-15T09:10:00Z",
                original_text="Good morning everyone",
                source_language="en",
                translations=[
                    {
                        "target_language": "es",
                        "translated_text": "Buenos días a todos",
                        "confidence": 0.95
                    }
                ],
                confidence=0.98,
                is_final=True
            ),
            TranscriptItem(
                id="507f1f77bcf86cd799439015",
                speaker_id="507f1f77bcf86cd799439013",
                speaker_name="Jane Smith",
                timestamp="2024-01-15T09:11:00Z",
                original_text="Hello, how are you?",
                source_language="en",
                translations=[
                    {
                        "target_language": "es",
                        "translated_text": "Hola, ¿cómo estás?",
                        "confidence": 0.92
                    }
                ],
                confidence=0.95,
                is_final=True
            )
        ],
        summary={
            "total_entries": 2,
            "duration": 60,
            "languages": ["en", "es"],
            "speakers": 2
        }
    )

@router.post("/user/{user_id}/session", status_code=201)
def save_transcript_session(user_id: str, session: Dict[str, Any]):
    """Save a transcript session for a user"""
    if user_id not in user_transcripts:
        user_transcripts[user_id] = []
    session_id = f"session-{len(user_transcripts[user_id]) + 1}-{int(datetime.utcnow().timestamp())}"
    session["session_id"] = session_id
    session["created_at"] = datetime.utcnow().isoformat()
    user_transcripts[user_id].append(session)
    return {"session_id": session_id}

@router.get("/user/{user_id}")
def get_user_transcripts(user_id: str):
    """Get all transcript sessions for a user"""
    return user_transcripts.get(user_id, [])

@router.get("/user/{user_id}/{session_id}")
def get_user_transcript_session(user_id: str, session_id: str):
    """Get a specific transcript session for a user"""
    sessions = user_transcripts.get(user_id, [])
    for session in sessions:
        if session.get("session_id") == session_id:
            return session
    raise HTTPException(status_code=404, detail="Session not found") 