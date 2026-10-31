from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator


class AttendanceMark(BaseModel):
    session_id: int
    student_id: int
    status: str
    confidence: float | None = None
    method: str = "manual"

    @field_validator("status")
    @classmethod
    def valid_status(cls, value: str) -> str:
        if value not in {"present", "late", "absent"}:
            raise ValueError("Status must be present, late or absent")
        return value


class AttendanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    student_id: int
    status: str
    confidence: float | None
    method: str
    marked_at: datetime
