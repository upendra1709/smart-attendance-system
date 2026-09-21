from datetime import datetime
from pydantic import BaseModel, field_validator

class AttendanceMark(BaseModel):
    session_id: int
    student_id: int
    status: str
    confidence: float | None = None
    method: str = "manual"

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v):
        if v not in {"present", "late", "absent"}:
            raise ValueError("status must be present, late or absent")
        return v

class AttendanceOut(BaseModel):
    id: int
    session_id: int
    student_id: int
    status: str
    confidence: float | None
    method: str
    marked_at: datetime

    class Config:
        from_attributes = True