from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, LargeBinary, func
from app.db.database import Base


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    embedding = Column(LargeBinary, nullable=False)
    dimensions = Column(Integer, default=128, nullable=False)
    samples = Column(Integer, default=1, nullable=False)
    consent = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
