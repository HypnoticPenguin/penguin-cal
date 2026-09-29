from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from database import get_session
from models import User, Calendar, CalendarShare
from auth import get_current_user

router = APIRouter(prefix="/api/calendars", tags=["Calendars"])

class CalendarCreate(BaseModel):
    name: str
    color: Optional[str] = "#2196F3"

class CalendarUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class ShareToggleRequest(BaseModel):
    user_id: int
    has_access: bool

@router.get("/")
def get_user_calendars(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Find owned calendars
    owned = session.exec(select(Calendar).where(Calendar.owner_id == current_user.id)).all()
    
    # Find shared calendars
    shares = session.exec(select(CalendarShare).where(CalendarShare.shared_with_user_id == current_user.id)).all()
    shared_cal_ids = [s.calendar_id for s in shares]
    shared_cals = []
    if shared_cal_ids:
        shared_cals = session.exec(select(Calendar).where(Calendar.id.in_(shared_cal_ids))).all()
        
    all_cals = owned + shared_cals
    
    output = []
    for cal in all_cals:
        output.append({
            "id": cal.id,
            "name": cal.name,
            "color": cal.color,
            "owner_id": cal.owner_id,
            "is_default": cal.is_default,
            "is_owner": cal.owner_id == current_user.id
        })
    return output

@router.post("/")
def create_calendar(
    cal_data: CalendarCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    new_cal = Calendar(
        name=cal_data.name,
        color=cal_data.color or "#2196F3",
        owner_id=current_user.id,
        is_default=False
    )
    session.add(new_cal)
    session.commit()
    session.refresh(new_cal)
    
    return {
        "id": new_cal.id,
        "name": new_cal.name,
        "color": new_cal.color,
        "owner_id": new_cal.owner_id,
        "is_default": new_cal.is_default,
        "is_owner": True
    }

@router.put("/{calendar_id}")
def update_calendar(
    calendar_id: int,
    calendar_data: CalendarUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    cal = session.get(Calendar, calendar_id)
    if not cal:
        raise HTTPException(status_code=404, detail="Calendar not found")
        
    if cal.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the calendar owner can update its settings.")
        
    if calendar_data.name is not None:
        cal.name = calendar_data.name
    if calendar_data.color is not None:
        cal.color = calendar_data.color
        
    session.add(cal)
    session.commit()
    session.refresh(cal)
    
    return {
        "id": cal.id,
        "name": cal.name,
        "color": cal.color,
        "owner_id": cal.owner_id,
        "is_default": cal.is_default,
        "is_owner": True
    }

@router.delete("/{calendar_id}")
def delete_calendar(
    calendar_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    cal = session.get(Calendar, calendar_id)
    if not cal:
        raise HTTPException(status_code=404, detail="Calendar not found")
        
    if cal.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the owner can delete this calendar")
        
    if cal.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default personal calendar")
        
    # Remove shares
    shares = session.exec(select(CalendarShare).where(CalendarShare.calendar_id == calendar_id)).all()
    for s in shares:
        session.delete(s)
        
    # Remove event links for this calendar
    from models import EventCalendarLink
    links = session.exec(select(EventCalendarLink).where(EventCalendarLink.calendar_id == calendar_id)).all()
    for l in links:
        session.delete(l)
        
    session.delete(cal)
    session.commit()
    return {"message": "Calendar deleted successfully"}

@router.get("/{calendar_id}/shares")
def get_calendar_shares(
    calendar_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    cal = session.get(Calendar, calendar_id)
    if not cal or cal.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    all_users = session.exec(select(User).where(User.id != current_user.id)).all()
    existing_shares = session.exec(select(CalendarShare).where(CalendarShare.calendar_id == calendar_id)).all()
    shared_user_ids = {s.shared_with_user_id for s in existing_shares}
    
    result = []
    for u in all_users:
        result.append({
            "user_id": u.id,
            "username": u.username,
            "display_name": u.display_name or u.username,
            "has_access": u.id in shared_user_ids
        })
    return result

@router.post("/{calendar_id}/shares/toggle")
def toggle_calendar_share(
    calendar_id: int,
    payload: ShareToggleRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    cal = session.get(Calendar, calendar_id)
    if not cal or cal.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    existing_share = session.exec(
        select(CalendarShare).where(
            CalendarShare.calendar_id == calendar_id,
            CalendarShare.shared_with_user_id == payload.user_id
        )
    ).first()
    
    if payload.has_access and not existing_share:
        new_share = CalendarShare(calendar_id=calendar_id, shared_with_user_id=payload.user_id)
        session.add(new_share)
    elif not payload.has_access and existing_share:
        session.delete(existing_share)
        
    session.commit()
    return {"message": "Share updated successfully"}