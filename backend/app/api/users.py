from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, require_role
from app.core.security import hash_password
from app.db.database import get_db
from app.models.attendance import Attendance
from app.models.enrollment import Enrollment
from app.models.face_embedding import FaceEmbedding
from app.models.notification import Notification
from app.models.regularisation import RegularisationRequest
from app.models.subject import Subject
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.user import ProfileUpdate, UserCreate

router = APIRouter(tags=["users"])


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    email = str(payload.email).lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "Email already exists")
    if payload.roll_number and db.query(User).filter(User.roll_number == payload.roll_number).first():
        raise HTTPException(409, "Roll number already exists")
    data = payload.model_dump()
    data["email"] = email
    password = data.pop("password")
    user = User(**data, password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("", response_model=list[UserOut])
def list_users(
    role: str | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin", "teacher")),
):
    if current.role == "teacher" and role not in {None, "student"}:
        raise HTTPException(403, "Teachers can only list student accounts")
    query = db.query(User)
    query = query.filter(User.role == "student") if current.role == "teacher" else query
    if role:
        if role not in {"student", "teacher", "admin"}:
            raise HTTPException(400, "Invalid role")
        query = query.filter(User.role == role)
    return query.order_by(User.name).all()


@router.patch("/me", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    changes = payload.model_dump(exclude_unset=True)
    if "roll_number" in changes and changes["roll_number"]:
        conflict = db.query(User).filter(
            User.roll_number == changes["roll_number"], User.id != current.id
        ).first()
        if conflict:
            raise HTTPException(409, "Roll number already exists")
    for field, value in changes.items():
        setattr(current, field, value)
    db.commit()
    db.refresh(current)
    return current


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.id == current.id:
        raise HTTPException(400, "You cannot delete your own account")
    if db.query(Subject).filter(Subject.teacher_id == user_id).first():
        raise HTTPException(409, "Reassign this teacher's subjects before deleting the account")
    if db.query(Attendance).filter(Attendance.student_id == user_id).first():
        raise HTTPException(409, "This student has attendance history and cannot be deleted")
    db.query(Enrollment).filter(Enrollment.student_id == user_id).delete()
    db.query(FaceEmbedding).filter(FaceEmbedding.user_id == user_id).delete()
    db.query(Notification).filter(Notification.user_id == user_id).delete()
    db.query(RegularisationRequest).filter(RegularisationRequest.student_id == user_id).delete()
    db.delete(user)
    db.commit()
