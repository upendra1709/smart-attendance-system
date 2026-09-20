from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, func
from app.db.database import Base

class AlertLog(Base):
    __tablename__ = "alerts_log"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    sent_at = Column(DateTime, server_default=func.now())