import os
from datetime import datetime, timedelta
from typing import Optional, List
from dateutil import rrule
from fastapi import FastAPI, HTTPException, Depends, Query, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlmodel import SQLModel, Field, Session, create_engine, select
from passlib.context import CryptContext
import jwt
from icalendar import Calendar as ICalCalendar

# ------------------------------------------------------------------
# 1. Database Setup
# ------------------------------------------------------------------
DATABASE_URL = "sqlite:////app/data/penguin_cal.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def init_db():
    os.makedirs("/app/data", exist_ok=True)
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# ------------------------------------------------------------------
# 2. Database Models
# ------------------------------------------------------------------
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    display_name: Optional[str] = Field(default=None)
    hashed_password: str
    is_admin: bool = Field(default=False)

class Calendar(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    color: str = Field(default="#2196F3")
    owner_id: int = Field(foreign_key="user.id", index=True)
    is_default: bool = Field(default=False)

class CalendarShare(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    calendar_id: int = Field(foreign_key="calendar.id", index=True)
    shared_with_user_id: int = Field(foreign_key="user.id", index=True)

class EventCalendarLink(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id", index=True)
    calendar_id: int = Field(foreign_key="calendar.id", index=True)

class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    rrule: Optional[str] = None
    exdates: Optional[str] = None

# ------------------------------------------------------------------
# 3. Schemas
# ------------------------------------------------------------------
class UserRegister(BaseModel):
    username: str
    display_name: Optional[str] = None
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = None
    is_admin: bool

class ProfileUpdate(BaseModel):
    display_name: str

class CalendarCreate(BaseModel):
    name: str
    color: str = "#2196F3"

class CalendarUpdate(BaseModel):
    name: str
    color: str = "#2196F3"

class ShareToggleRequest(BaseModel):
    user_id: int
    has_access: bool

class EventCreate(BaseModel):
    title: str
    date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    calendar_ids: List[int]
    rrule: Optional[str] = None

class EventUpdate(BaseModel):
    title: str
    date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    calendar_ids: Optional[List[int]] = None
    rrule: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ------------------------------------------------------------------
# 4. Auth & Security Setup
# ------------------------------------------------------------------
SECRET_KEY = os.environ.get("JWT_SECRET", "penguin-cal-super-secret-key-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise credentials_exception
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

# ------------------------------------------------------------------
# 5. App Setup
# ------------------------------------------------------------------
app = FastAPI(title="Penguin Cal API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend running!"}

# ------------------------------------------------------------------
# 6. Auth & Profile Routes
# ------------------------------------------------------------------
@app.post("/api/auth/register", response_model=TokenResponse)
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
        is_admin=is_first_user
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    default_cal = Calendar(name="Personal", color="#2196F3", owner_id=new_user.id, is_default=True)
    session.add(default_cal)
    session.commit()
    
    token = create_access_token({"sub": new_user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=TokenResponse)
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

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "display_name": current_user.display_name or current_user.username,
        "is_admin": current_user.is_admin
    }

@app.put("/api/auth/profile", response_model=UserResponse)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    clean_name = profile_data.display_name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Display name cannot be empty")
    
    current_user.display_name = clean_name
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "display_name": current_user.display_name,
        "is_admin": current_user.is_admin
    }

@app.put("/api/auth/change-password")
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

# ------------------------------------------------------------------
# 7. Calendar Management Routes
# ------------------------------------------------------------------
@app.get("/api/calendars")
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

@app.post("/api/calendars")
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

@app.put("/api/calendars/{calendar_id}")
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

@app.get("/api/calendars/{calendar_id}/shares")
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

@app.post("/api/calendars/{calendar_id}/shares/toggle")
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

# ------------------------------------------------------------------
# 8. Events & ICS Import Routes
# ------------------------------------------------------------------
@app.get("/api/events")
def get_events(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
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
        
        if not start or not end or not event.rrule:
            output.append({
                "id": event.id,
                "title": event.title,
                "date": event.date,
                "start_time": event.start_time,
                "end_time": event.end_time,
                "rrule": event.rrule,
                "exdates": exdates_list,
                "calendar_ids": cal_ids,
                "color": color,
                "is_recurring": bool(event.rrule)
            })
        else:
            try:
                range_start = datetime.fromisoformat(start[:10])
                range_end = datetime.fromisoformat(end[:10])
                rule_str = f"DTSTART:{event.date.replace('-', '')}\nRRULE:{event.rrule}"
                rule = rrule.rrulestr(rule_str)
                occurrences = rule.between(range_start, range_end, inc=True)
                for occ in occurrences:
                    occ_str = occ.strftime("%Y-%m-%d")
                    if occ_str not in exdates_list:
                        output.append({
                            "id": event.id,
                            "title": event.title,
                            "date": occ_str,
                            "start_time": event.start_time,
                            "end_time": event.end_time,
                            "rrule": event.rrule,
                            "exdates": exdates_list,
                            "calendar_ids": cal_ids,
                            "color": color,
                            "is_recurring": True
                        })
            except Exception:
                output.append({
                    "id": event.id,
                    "title": event.title,
                    "date": event.date,
                    "start_time": event.start_time,
                    "end_time": event.end_time,
                    "rrule": event.rrule,
                    "exdates": exdates_list,
                    "calendar_ids": cal_ids,
                    "color": color,
                    "is_recurring": True
                })
    return output

@app.post("/api/events")
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

@app.put("/api/events/{event_id}")
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

@app.delete("/api/events/{event_id}")
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

@app.post("/api/events/import-ics")
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

@app.delete("/api/events/cleanup-past")
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

    today_str = datetime.utcnow().strftime("%Y-%m-%d")
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

# ------------------------------------------------------------------
# 9. Admin Endpoints
# ------------------------------------------------------------------
@app.get("/api/admin/users", response_model=List[UserResponse])
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

@app.delete("/api/admin/users/{user_id}")
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