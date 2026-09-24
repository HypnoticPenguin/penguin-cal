import os
from sqlmodel import Session, create_engine, SQLModel

DATABASE_URL = "sqlite:////app/data/penguin_cal.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def init_db():
    os.makedirs("/app/data", exist_ok=True)
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
