from fastapi import APIRouter, HTTPException

router = APIRouter()

@router.post("/login")
def login():
    raise NotImplementedError("Login endpoint must be implemented with real authentication logic.")

@router.post("/register")
def register():
    raise NotImplementedError("Register endpoint must be implemented with real registration logic.")

@router.get("/profile")
def get_profile():
    raise NotImplementedError("Profile endpoint must be implemented with real user data.") 