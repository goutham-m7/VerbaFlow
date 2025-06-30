from fastapi import APIRouter

router = APIRouter()

@router.get("/profile")
def get_user_profile():
    raise NotImplementedError("User profile endpoint must be implemented with real user data.") 