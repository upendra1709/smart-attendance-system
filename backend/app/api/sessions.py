from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import require_role
from app.db.database import get_db
from app.models.attendance import Attendance
from app.models.class_ import Class
from app.models.enrollment import Enrollment
from app.models.session_ import ClassSession
from app.models.subject import Subject
from app.models.user import User
from app.schemas.session import SessionCreate, SessionOut
from app.services.academic import (
    get_managed_session,
    notify,
    require_class_manager,
    roster_for_session,
    upsert_attendance,
)

router = APIRouter(tags=["sessions"])


@router.post("", response_model=SessionOut, status_code=201)
def create_session(
    payload: SessionCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    require_class_manager(db, current, payload.class_id)
    if payload.ends_at and payload.ends_at <= payload.starts_at:
        raise HTTPException(400, "Session end time must be after its start time")
    open_session = db.query(ClassSession).filter(
        ClassSession.class_id == payload.class_id,
        ClassSession.status == "open",
    ).first()
    if open_session:
        raise HTTPException(409, f"Class already has open session #{open_session.id}")
    session = ClassSession(**payload.model_dump(), status="open")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("", response_model=list[SessionOut])
def list_sessions(
    class_id: int | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    query = db.query(ClassSession)
    if current.role == "teacher":
        query = query.join(Class, Class.id == ClassSession.class_id).join(
            Subject, Subject.id == Class.subject_id
        ).filter(Subject.teacher_id == current.id)
    if class_id:
        require_class_manager(db, current, class_id)
        query = query.filter(ClassSession.class_id == class_id)
    return query.order_by(ClassSession.starts_at.desc()).all()


@router.get("/{session_id}/roster")
def session_roster(
    session_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    session = get_managed_session(db, current, session_id)
    roster, counts = roster_for_session(db, session)
    return {"session": session, "roster": roster, "counts": counts}


@router.post("/{session_id}/close", response_model=SessionOut)
def close_session(
    session_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    session = get_managed_session(db, current, session_id)
    if session.status == "closed":
        return session
    roster, counts = roster_for_session(db, session)
    for row in roster:
        if row["status"] == "pending":
            upsert_attendance(db, session.id, row["student_id"], "absent", "auto")
    session.status = "closed"
    session.ends_at = datetime.now(timezone.utc)
    roster, counts = roster_for_session(db, session)
    total = len(roster)
    attended = counts["present"] + counts["late"]
    percentage = round(attended / total * 100, 1) if total else 0.0
    subject = (
        db.query(Subject)
        .join(Class, Class.subject_id == Subject.id)
        .filter(Class.id == session.class_id)
        .first()
    )
    for row in roster:
        notify(
            db,
            row["student_id"],
            f"Attendance marked for {subject.code}",
            f"Session #{session.id} is closed. Your status is {next(r['status'] for r in roster if r['student_id'] == row['student_id'])}.",
            "attendance",
        )
    if total and percentage < 75:
        notify(
            db,
            current.id,
            f"Low attendance in {subject.code}",
            f"Session #{session.id} closed with {percentage}% attendance.",
            "warning",
        )
    db.commit()
    db.refresh(session)
    return session
