from sqlalchemy import Column, Integer, ForeignKey, LargeBinary, Boolean
from app.db.database import Base

class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    embedding = Column(LargeBinary, nullable=False)   # 512-d vector, never images
    consent = Column(Boolean, default=False)