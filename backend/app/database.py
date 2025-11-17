from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool
import os
from app.config import settings

# Database URL
database_url = settings.DATABASE_URL

# Create engine
engine = create_engine(
    database_url,
    echo=True,
    pool_pre_ping=True,
)

def init_db():
    """Khởi tạo database - tạo tất cả tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency để lấy database session"""
    with Session(engine) as session:
        yield session


