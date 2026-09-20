from sqlalchemy import Column, Integer, ForeignKey, String, Float, DateTime, func
from app.db.database import Base

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, nullable=False)      # present | late | absent
    confidence = Column(Float)
    method = Column(String, default="manual")    # manual | face
    marked_at = Column(DateTime, server_default=func.now())