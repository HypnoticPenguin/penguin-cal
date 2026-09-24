from typing import Optional
from sqlmodel import SQLModel, Field

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
    notes: Optional[str] = None
    rrule: Optional[str] = None
    exdates: Optional[str] = None