from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from database import get_session
from models import User, Calendar
from schemas import UserRegister, UserResponse, ProfileUpdate, TokenResponse
from auth import (
    hash_password, verify_password, create_access_token, get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", response_model=TokenResponse)
def register_user(user_data: UserRegister, session: Session = Depends(get_session)):
    existing = session.exec(select(User).where(User.username == user_data.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    user_count = len(session.exec(select(User)).all())
    is_first_user = (user_count == 0)
    
    d_name = user_data.display_name.strip() if user_data.display_name else user_data.username
    
    new_user = User(
        username=user_data.username,
        display_name=d_name,
        hashed_password=hash_password(user_data.password),
        is_admin=is_first_user,
        theme="auto",
        date_format="YYYY-MM-DD"
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    default_cal = Calendar(name="Personal", color="#2196F3", owner_id=new_user.id, is_default=True)
    session.add(default_cal)
    session.commit()
    
    token = create_access_token({"sub": new_user.username})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=TokenResponse)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    user = session.exec(select(User).where(User.username == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "display_name": current_user.display_name or current_user.username,
        "is_admin": current_user.is_admin,
        "theme": current_user.theme or "auto",
        "date_format": current_user.date_format or "YYYY-MM-DD"
    }

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if profile_data.display_name is not None:
        clean_name = profile_data.display_name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Display name cannot be empty")
        current_user.display_name = clean_name
        
    if profile_data.theme is not None:
        current_user.theme = profile_data.theme
        
    if profile_data.date_format is not None:
        current_user.date_format = profile_data.date_format
        
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "display_name": current_user.display_name,
        "is_admin": current_user.is_admin,
        "theme": current_user.theme,
        "date_format": current_user.date_format
    }

@router.put("/change-password")
def change_password(
    password_data: dict,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    curr_pw = password_data.get("current_password")
    new_pw = password_data.get("new_password")
    
    if not verify_password(curr_pw, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    if not new_pw or len(new_pw) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters long")
        
    current_user.hashed_password = hash_password(new_pw)
    session.add(current_user)
    session.commit()
    return {"message": "Password updated successfully"}