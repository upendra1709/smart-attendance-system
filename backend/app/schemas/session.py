from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SessionCreate(BaseModel):
    class_id: int
    starts_at: datetime
    ends_at: datetime | None = None


class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    class_id: int
    starts_at: datetime
    ends_at: datetime | None
    status: str
