from pydantic import BaseModel
from typing import Optional, List

class UserRegister(BaseModel):
    username: str
    display_name: Optional[str] = None
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    display_name: Optional[str] = None
    is_admin: bool
    theme: str
    date_format: str
    time_format: str
    day_start_time: str
    timezone: str

class ProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    theme: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None
    day_start_time: Optional[str] = None
    timezone: Optional[str] = None

class CalendarCreate(BaseModel):
    name: str
    color: str = "#2196F3"

class CalendarUpdate(BaseModel):
    name: str
    color: str = "#2196F3"

class ShareToggleRequest(BaseModel):
    user_id: int
    has_access: bool

class AdminPasswordReset(BaseModel):
    new_password: str

class EventCreate(BaseModel):
    title: str
    date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = "medium"
    calendar_ids: List[int]
    rrule: Optional[str] = None

class EventUpdate(BaseModel):
    title: str
    date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = "medium"
    calendar_ids: Optional[List[int]] = None
    rrule: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"