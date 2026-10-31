from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, require_role
from app.db.database import get_db
from app.models.attendance import Attendance
from app.models.enrollment import Enrollment
from app.models.session_ import ClassSession
from app.models.user import User
from app.schemas.attendance import AttendanceMark, AttendanceOut
from app.services.academic import (
    get_managed_session,
    notify,
    student_summary,
    upsert_attendance,
)

router = APIRouter(tags=["attendance"])


@router.post("", response_model=AttendanceOut, status_code=201)
def mark_attendance(
    payload: AttendanceMark,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    session = get_managed_session(db, current, payload.session_id)
    if payload.method == "face":
        raise HTTPException(400, "Use the face recognition endpoint for face attendance")
    student = db.query(User).filter(User.id == payload.student_id, User.role == "student").first()
    if not student:
        raise HTTPException(404, "Student not found")
    enrolled = db.query(Enrollment).filter(
        Enrollment.class_id == session.class_id,
        Enrollment.student_id == payload.student_id,
    ).first()
    if not enrolled:
        raise HTTPException(400, "Student is not enrolled in this class")
    row = upsert_attendance(
        db,
        payload.session_id,
        payload.student_id,
        payload.status,
        payload.method,
        payload.confidence,
    )
    notify(
        db,
        student.id,
        "Attendance updated",
        f"Your attendance for session #{session.id} is now {payload.status}.",
        "attendance",
    )
    db.commit()
    db.refresh(row)
    return row


@router.get("/session/{session_id}", response_model=list[AttendanceOut])
def session_attendance(
    session_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    get_managed_session(db, current, session_id)
    return db.query(Attendance).filter(Attendance.session_id == session_id).all()


@router.get("/student/{student_id}")
def student_attendance_summary(
    student_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role == "student" and current.id != student_id:
        raise HTTPException(403, "You can only view your own attendance")
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(404, "Student not found")
    return student_summary(db, student_id)
