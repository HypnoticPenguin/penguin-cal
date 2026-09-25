from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import Response
from sqlmodel import Session, select
from icalendar import Calendar as ICalCalendar, Event as ICalEvent
from database import get_session
from models import User, Calendar, CalendarShare, Event, EventCalendarLink
from schemas import EventCreate, EventUpdate
from auth import get_current_user

router = APIRouter(prefix="/api/events", tags=["Events"])

@router.get("/")
def get_events(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    owned = session.exec(select(Calendar).where(Calendar.owner_id == current_user.id)).all()
    shares = session.exec(select(CalendarShare).where(CalendarShare.shared_with_user_id == current_user.id)).all()
    allowed_ids = [c.id for c in owned] + [s.calendar_id for s in shares]
    
    if not allowed_ids:
        return []
        
    cal_map = {c.id: c for c in session.exec(select(Calendar).where(Calendar.id.in_(allowed_ids))).all()}
    links = session.exec(select(EventCalendarLink).where(EventCalendarLink.calendar_id.in_(allowed_ids))).all()
    
    if not links:
        return []
        
    event_cal_map = {}
    for link in links:
        if link.event_id not in event_cal_map:
            event_cal_map[link.event_id] = []
        event_cal_map[link.event_id].append(link.calendar_id)
        
    event_ids = list(event_cal_map.keys())
    user_events = session.exec(select(Event).where(Event.id.in_(event_ids))).all()
    
    output = []
    for event in user_events:
        cal_ids = event_cal_map.get(event.id, [])
        primary_cal = cal_map.get(cal_ids[0]) if cal_ids else None
        color = primary_cal.color if primary_cal else "#2196F3"
        exdates_list = [x.strip() for x in event.exdates.split(",")] if event.exdates else []
        
        output.append({
            "id": event.id,
            "title": event.title,
            "date": event.date,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "notes": event.notes,
            "priority": event.priority or "medium",
            "rrule": event.rrule,
            "exdates": exdates_list,
            "calendar_ids": cal_ids,
            "color": color,
            "is_recurring": bool(event.rrule)
        })
        
    return output

@router.post("/")
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    if not event_data.calendar_ids:
        raise HTTPException(status_code=400, detail="At least one calendar must be selected")
        
    db_event = Event(
        title=event_data.title,
        date=event_data.date,
        start_time=event_data.start_time if event_data.start_time else None,
        end_time=event_data.end_time if event_data.end_time else None,
        notes=event_data.notes if event_data.notes else None,
        priority=event_data.priority if event_data.priority else "medium",
        rrule=event_data.rrule if event_data.rrule else None,
        exdates=None
    )
    session.add(db_event)
    session.commit()
    session.refresh(db_event)
    
    for cal_id in event_data.calendar_ids:
        link = EventCalendarLink(event_id=db_event.id, calendar_id=cal_id)
        session.add(link)
    session.commit()
    
    return db_event

@router.put("/{event_id}")
def update_event(
    event_id: int,
    updated_event: EventUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event.title = updated_event.title
    event.date = updated_event.date
    event.start_time = updated_event.start_time if updated_event.start_time else None
    event.end_time = updated_event.end_time if updated_event.end_time else None
    event.notes = updated_event.notes if updated_event.notes else None
    event.priority = updated_event.priority if updated_event.priority else "medium"
    event.rrule = updated_event.rrule if updated_event.rrule else None
    session.add(event)
    
    if updated_event.calendar_ids is not None:
        existing_links = session.exec(
            select(EventCalendarLink).where(EventCalendarLink.event_id == event_id)
        ).all()
        for link in existing_links:
            session.delete(link)
        for cal_id in updated_event.calendar_ids:
            new_link = EventCalendarLink(event_id=event_id, calendar_id=cal_id)
            session.add(new_link)
            
    session.commit()
    session.refresh(event)
    return event

@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    delete_type: str = Query("all"),
    instance_date: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if delete_type == "single" and instance_date:
        formatted_date = instance_date[:10]
        exdates_list = [x.strip() for x in event.exdates.split(",")] if event.exdates else []
        if formatted_date not in exdates_list:
            exdates_list.append(formatted_date)
            event.exdates = ",".join(exdates_list)
            session.add(event)
            session.commit()
        return {"message": f"Instance on {formatted_date} deleted"}
    else:
        links = session.exec(select(EventCalendarLink).where(EventCalendarLink.event_id == event_id)).all()
        for l in links:
            session.delete(l)
        session.delete(event)
        session.commit()
        return {"message": "Entire series deleted"}

@router.get("/calendars/{calendar_id}/export.ics")
def export_calendar_ics(
    calendar_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    cal = session.get(Calendar, calendar_id)
    if not cal:
        raise HTTPException(status_code=404, detail="Calendar not found")
        
    is_owner = (cal.owner_id == current_user.id)
    if not is_owner:
        share = session.exec(
            select(CalendarShare).where(
                CalendarShare.calendar_id == calendar_id,
                CalendarShare.shared_with_user_id == current_user.id
            )
        ).first()
        if not share:
            raise HTTPException(status_code=403, detail="Access denied to this calendar")

    links = session.exec(select(EventCalendarLink).where(EventCalendarLink.calendar_id == calendar_id)).all()
    event_ids = [l.event_id for l in links]
    
    events = []
    if event_ids:
        events = session.exec(select(Event).where(Event.id.in_(event_ids))).all()

    ical_cal = ICalCalendar()
    ical_cal.add('prodid', '-//Penguin Cal//Calendar Export//EN')
    ical_cal.add('version', '2.0')
    ical_cal.add('calscale', 'GREGORIAN')
    ical_cal.add('x-wr-calname', cal.name)

    for event in events:
        ical_event = ICalEvent()
        ical_event.add('summary', event.title)
        
        date_parts = [int(p) for p in event.date.split('-')]
        event_date = datetime(date_parts[0], date_parts[1], date_parts[2])

        if event.start_time:
            start_h, start_m = map(int, event.start_time.split(':'))
            start_dt = event_date.replace(hour=start_h, minute=start_m)
            ical_event.add('dtstart', start_dt)
            
            if event.end_time:
                end_h, end_m = map(int, event.end_time.split(':'))
                end_dt = event_date.replace(hour=end_h, minute=end_m)
                ical_event.add('dtend', end_dt)
            else:
                ical_event.add('dtend', start_dt.replace(hour=start_h + 1))
        else:
            ical_event.add('dtstart', event_date.date())
            ical_event.add('dtend', event_date.date())

        if event.notes:
            ical_event.add('description', event.notes)
            
        if event.rrule:
            ical_event.add('rrule', event.rrule)

        ical_cal.add_component(ical_event)

    ics_data = ical_cal.to_ical()
    filename = f"{cal.name.lower().replace(' ', '_')}_export.ics"

    return Response(
        content=ics_data,
        media_type="text/calendar",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "X-Event-Count": str(len(events))
        }
    )

@router.post("/import-ics")
def import_ics_events(
    calendar_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    cal = session.get(Calendar, calendar_id)
    if not cal:
        raise HTTPException(status_code=404, detail="Calendar not found")
    content = file.file.read()
    gcal = ICalCalendar.from_ical(content)
    imported_count = 0
    for component in gcal.walk():
        if component.name == "VEVENT":
            title = str(component.get('summary', 'Untitled Event'))
            start = component.get('dtstart')
            end = component.get('dtend')
            description = str(component.get('description', ''))
            
            if not start:
                continue
                
            start_dt = start.dt
            if hasattr(start_dt, 'strftime'):
                date_str = start_dt.strftime("%Y-%m-%d")
                time_str = start_dt.strftime("%H:%M") if hasattr(start_dt, 'hour') else None
            else:
                date_str = str(start_dt)
                time_str = None
                
            end_time_str = None
            if end:
                end_dt = end.dt
                if hasattr(end_dt, 'strftime') and hasattr(end_dt, 'hour'):
                    end_time_str = end_dt.strftime("%H:%M")
                    
            db_event = Event(
                title=title,
                date=date_str,
                start_time=time_str,
                end_time=end_time_str,
                notes=description if description else None,
                priority="medium",
                rrule=None
            )
            session.add(db_event)
            session.commit()
            session.refresh(db_event)
            link = EventCalendarLink(event_id=db_event.id, calendar_id=calendar_id)
            session.add(link)
            session.commit()
            imported_count += 1
    return {"message": f"Successfully imported {imported_count} events."}

@router.post("/cleanup-past")
def cleanup_past_events(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    owned_calendars = session.exec(select(Calendar).where(Calendar.owner_id == current_user.id)).all()
    owned_cal_ids = [c.id for c in owned_calendars]
    
    if not owned_cal_ids:
        return {"deleted_count": 0, "message": "No owned calendars found."}
        
    links = session.exec(select(EventCalendarLink).where(EventCalendarLink.calendar_id.in_(owned_cal_ids))).all()
    event_ids = list(set([l.event_id for l in links]))
    
    if not event_ids:
        return {"deleted_count": 0, "message": "No events found to clean up."}
        
    today_str = datetime.now().strftime("%Y-%m-%d")
    user_events = session.exec(select(Event).where(Event.id.in_(event_ids))).all()
    deleted_count = 0
    for event in user_events:
        if not event.rrule and event.date < today_str:
            event_links = session.exec(select(EventCalendarLink).where(EventCalendarLink.event_id == event.id)).all()
            for link in event_links:
                session.delete(link)
            session.delete(event)
            deleted_count += 1
    session.commit()
    return {"deleted_count": deleted_count, "message": f"Successfully deleted {deleted_count} past non-recurring events."}