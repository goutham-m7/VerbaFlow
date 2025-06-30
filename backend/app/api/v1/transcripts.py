from fastapi import APIRouter

router = APIRouter()

@router.get("/{meeting_id}")
def get_transcript(meeting_id: str):
    raise NotImplementedError("Transcript endpoint must be implemented with real data.")

@router.post("/user/{user_id}/session")
def save_transcript_session(user_id: str):
    raise NotImplementedError("Save transcript session must be implemented with real logic.")

@router.get("/user/{user_id}")
def get_user_transcripts(user_id: str):
    raise NotImplementedError("Get user transcripts must be implemented with real data.")

@router.get("/user/{user_id}/{session_id}")
def get_user_transcript_session(user_id: str, session_id: str):
    raise NotImplementedError("Get user transcript session must be implemented with real data.") 