from datetime import date
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: str
    roll_number: str | None = None
    department: str | None = None
    course: str | None = None
    semester: str | None = None
    phone: str | None = None
    institution: str | None = None
    section: str | None = None
    joining_date: date | None = None

    @field_validator("role")
    @classmethod
    def valid_role(cls, value: str) -> str:
        if value not in {"student", "teacher", "admin"}:
            raise ValueError("Role must be student, teacher or admin")
        return value


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    roll_number: str | None = None
    department: str | None = None
    course: str | None = None
    semester: str | None = None
    phone: str | None = None
    institution: str | None = None
    section: str | None = None
