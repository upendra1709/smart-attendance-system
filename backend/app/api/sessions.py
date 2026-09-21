from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.session_ import ClassSession
from app.models.class_ import Class
from app.models.user import User
from app.core.deps import require_role
from app.schemas.session import SessionCreate, SessionOut

router = APIRouter(tags=["sessions"])

@router.post("", response_model=SessionOut, status_code=201)
def create_session(
    payload: SessionCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    cls = db.query(Class).filter(Class.id == payload.class_id).first()
    if not cls:
        raise HTTPException(404, "Class not found")
    s = ClassSession(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.post("/{session_id}/close", response_model=SessionOut)
def close_session(
    session_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    s = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not s:
        raise HTTPException(404, "Session not found")
    s.status = "closed"
    s.ends_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(s)
    return s

@router.get("", response_model=list[SessionOut])
def list_sessions(
    class_id: int | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    q = db.query(ClassSession)
    if class_id:
        q = q.filter(ClassSession.class_id == class_id)
    return q.order_by(ClassSession.starts_at.desc()).all()