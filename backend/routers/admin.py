from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from models import User
from schemas import UserResponse, AdminPasswordReset
from auth import require_admin, hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.get("/users", response_model=List[UserResponse])
def list_users(
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session)
):
    users = session.exec(select(User)).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "display_name": u.display_name or u.username,
            "is_admin": u.is_admin,
            "theme": u.theme or "auto",
            "date_format": u.date_format or "YYYY-MM-DD",
            "time_format": u.time_format or "12h",
            "day_start_time": u.day_start_time or "06:00:00",
            "timezone": u.timezone or "Europe/London"
        }
        for u in users
    ]

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
     admin: User = Depends(require_admin),
    session: Session = Depends(get_session)
):
    target_user = session.get(User, user_id)
    if not target_user or target_user.id == admin.id:
        raise HTTPException(status_code=400, detail="Invalid user deletion target")
        
    session.delete(target_user)
    session.commit()
    return {"message": f"User '{target_user.username}' deleted."}

@router.patch("/users/{user_id}/toggle-admin")
def toggle_admin_status(
    user_id: int,
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session)
):
    target_user = session.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if target_user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own admin privileges")
        
    target_user.is_admin = not target_user.is_admin
    session.add(target_user)
    session.commit()
    session.refresh(target_user)
    return {"message": f"Admin status updated for '{target_user.username}'.", "is_admin": target_user.is_admin}

@router.put("/users/{user_id}/password")
def admin_reset_password(
    user_id: int,
    payload: AdminPasswordReset,
    admin: User = Depends(require_admin),
    session: Session = Depends(get_session)
):
    target_user = session.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not payload.new_password or len(payload.new_password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters long")
        
    target_user.hashed_password = hash_password(payload.new_password)
    session.add(target_user)
    session.commit()
    return {"message": f"Password updated successfully for '{target_user.username}'."}