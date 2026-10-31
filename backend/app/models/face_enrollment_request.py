from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, LargeBinary, String, Text, func
from app.db.database import Base


class FaceEnrollmentRequest(Base):
    """A student's self-submitted face enrollment waiting for teacher/admin approval.

    The embedding only moves into ``face_embeddings`` (where recognition looks)
    once a teacher or admin approves it.
    """

    __tablename__ = "face_enrollment_requests"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    embedding = Column(LargeBinary, nullable=False)
    dimensions = Column(Integer, default=128, nullable=False)
    samples = Column(Integer, default=1, nullable=False)
    consent = Column(Boolean, default=False, nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending | approved | rejected
    review_note = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
