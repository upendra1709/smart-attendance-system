from datetime import datetime
from pydantic import BaseModel

class SessionCreate(BaseModel):
    class_id: int
    starts_at: datetime
    ends_at: datetime | None = None

class SessionOut(BaseModel):
    id: int
    class_id: int
    starts_at: datetime
    ends_at: datetime | None
    status: str

    class Config:
        from_attributes = True