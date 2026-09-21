from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.core.deps import require_role
from app.core.security import hash_password
from app.schemas.auth import UserOut
from app.schemas.user import UserCreate

router = APIRouter(tags=["users"])

@router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    if payload.role not in {"student", "teacher", "admin"}:
        raise HTTPException(400, "Invalid role")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(409, "Email already exists")
    u = User(name=payload.name, email=payload.email,
             password_hash=hash_password(payload.password), role=payload.role)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

@router.get("", response_model=list[UserOut])
def list_users(
    role: str | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin", "teacher")),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.all()

@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(404, "User not found")
    db.delete(u)
    db.commit()