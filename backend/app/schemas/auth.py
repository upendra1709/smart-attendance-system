from datetime import date
from pydantic import BaseModel, ConfigDict


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: str
    roll_number: str | None = None
    department: str | None = None
    course: str | None = None
    semester: str | None = None
    phone: str | None = None
    profile_photo_url: str | None = None
    institution: str | None = None
    section: str | None = None
    joining_date: date | None = None
