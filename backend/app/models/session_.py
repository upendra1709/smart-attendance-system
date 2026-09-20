from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from app.db.database import Base

class ClassSession(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    starts_at = Column(DateTime, nullable=False)
    ends_at = Column(DateTime)
    status = Column(String, default="open")  # open | closed