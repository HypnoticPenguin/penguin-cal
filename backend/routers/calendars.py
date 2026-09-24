from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from database import get_session
from models import User, Calendar, CalendarShare
from schemas import CalendarCreate, CalendarUpdate, ShareToggleRequest
from auth import get_current_user

router = APIRouter(prefix="/api/calendars", tags=["Calendars"])

@router.get("/")
def get_user_calendars(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    owned = session.exec(select(Calendar).where(Calendar.owner_id == current_user.id)).all()
    shares = session.exec(select(CalendarShare).where(CalendarShare.shared_with_user_id == current_user.id)).all()
    shared_cal_ids = [s.calendar_id for s in shares]
    
    shared = session.exec(select(Calendar).where(Calendar.id.in_(shared_cal_ids))).all() if shared_cal_ids else []
    
    output = []
    for c in owned:
        output.append({
            "id": c.id,
            "name": c.name,
            "color": c.color,
            "is_owner": True,
            "is_default": c.is_default,
            "owner_id": c.owner_id
        })
    for c in shared:
        owner = session.get(User, c.owner_id)
        owner_name = (owner.display_name or owner.username) if owner else "Unknown"
        output.append({
            "id": c.id,
            "name": f"{c.name} ({owner_name})",
            "color": c.color,
            "is_owner": False,
            "is_default": False,
            "owner_id": c.owner_id
        })
    return output

@router.post("/")
def create_calendar(
    cal_data: CalendarCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    new_cal = Calendar(name=cal_data.name, color=cal_data.color, owner_id=current_user.id, is_default=False)
    session.add(new_cal)
    session.commit()
    session.refresh(new_cal)
    return new_cal

@router.put("/{calendar_id}")
def update_calendar(
    calendar_id: int,
    cal_data: CalendarUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    cal = session.get(Calendar, calendar_id)
    if not cal or cal.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only calendar owners can edit calendar settings")
    cal.name = cal_data.name
    cal.color = cal_data.color
    session.add(cal)
    session.commit()
    session.refresh(cal)
    return cal

@router.get("/{calendar_id}/shares")
def get_calendar_shares(
    calendar_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    cal = session.get(Calendar, calendar_id)
    if not cal or cal.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only calendar owners can view share status")
    if cal.is_default:
        raise HTTPException(status_code=400, detail="Personal default calendar cannot be shared")
        
    all_users = session.exec(select(User).where(User.id != current_user.id)).all()
    existing_shares = session.exec(select(CalendarShare).where(CalendarShare.calendar_id == calendar_id)).all()
    shared_user_ids = {s.shared_with_user_id for s in existing_shares}
    
    return [
        {
            "user_id": u.id,
            "username": u.username,
            "display_name": u.display_name or u.username,
            "has_access": u.id in shared_user_ids
        }
        for u in all_users
    ]

@router.post("/{calendar_id}/shares/toggle")
def toggle_calendar_share(
    calendar_id: int,
    share_req: ShareToggleRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    cal = session.get(Calendar, calendar_id)
    if not cal or cal.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only calendar owners can manage shares")
    if cal.is_default:
        raise HTTPException(status_code=400, detail="Personal default calendar cannot be shared")
        
    existing_share = session.exec(
        select(CalendarShare).where(
            CalendarShare.calendar_id == calendar_id,
            CalendarShare.shared_with_user_id == share_req.user_id
        )
    ).first()
    
    if share_req.has_access and not existing_share:
        new_share = CalendarShare(calendar_id=calendar_id, shared_with_user_id=share_req.user_id)
        session.add(new_share)
        session.commit()
    elif not share_req.has_access and existing_share:
        session.delete(existing_share)
        session.commit()
        
    return {"status": "ok"}