from pydantic import BaseModel, Field, field_validator


class RegularisationCreate(BaseModel):
    session_id: int
    requested_status: str
    reason: str = Field(min_length=10, max_length=2000)

    @field_validator("requested_status")
    @classmethod
    def valid_status(cls, value: str) -> str:
        if value not in {"present", "late"}:
            raise ValueError("Requested status must be present or late")
        return value


class RegularisationReview(BaseModel):
    review_note: str | None = Field(default=None, max_length=2000)
