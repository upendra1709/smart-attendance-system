from sqlalchemy import Column, Date, DateTime, Integer, String, func
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, index=True)
    roll_number = Column(String(50), unique=True, nullable=True)
    department = Column(String(120), nullable=True)
    course = Column(String(120), nullable=True)
    semester = Column(String(30), nullable=True)
    phone = Column(String(30), nullable=True)
    profile_photo_url = Column(String(500), nullable=True)
    institution = Column(String(160), nullable=True)
    section = Column(String(30), nullable=True)
    joining_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
