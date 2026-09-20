from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.database import Base

class Class(Base):
    __tablename__ = "classes"
    id = Column(Integer, primary_key=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    schedule = Column(String)
    room = Column(String)