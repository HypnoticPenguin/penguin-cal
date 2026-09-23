from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str

    events: List["Event"] = Relationship(back_populates="owner")


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    date: str
    rrule: Optional[str] = None
    exdates: Optional[str] = None  # Comma-separated or JSON string
    
    # Foreign Key linking event to a specific user
    user_id: int = Field(foreign_key="user.id")
    owner: Optional[User] = Relationship(back_populates="events")