from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_meetings():
    raise NotImplementedError("Meetings list endpoint must be implemented with real data.")

@router.post("/")
def create_meeting():
    raise NotImplementedError("Create meeting endpoint must be implemented with real logic.")

@router.post("/join")
def join_meeting():
    raise NotImplementedError("Join meeting endpoint must be implemented with real logic.") 