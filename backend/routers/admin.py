from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from database import get_session
from models import User
from schemas import UserResponse
from auth import require_admin

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
            "is_admin": u.is_admin
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