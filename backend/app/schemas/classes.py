from pydantic import BaseModel, Field


class SubjectCreate(BaseModel):
    code: str = Field(min_length=2, max_length=30)
    name: str = Field(min_length=2, max_length=160)
    teacher_id: int


class ClassCreate(BaseModel):
    subject_id: int
    schedule: str | None = None
    room: str | None = None


class EnrollmentCreate(BaseModel):
    student_id: int
