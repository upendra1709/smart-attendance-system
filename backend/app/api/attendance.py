from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.attendance import Attendance
from app.models.session_ import ClassSession
from app.models.enrollment import Enrollment
from app.models.user import User
from app.core.deps import require_role
from app.schemas.attendance import AttendanceMark, AttendanceOut

router = APIRouter(tags=["attendance"])

@router.post("", response_model=AttendanceOut, status_code=201)
def mark_attendance(
    payload: AttendanceMark,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    s = db.query(ClassSession).filter(ClassSession.id == payload.session_id).first()
    if not s:
        raise HTTPException(404, "Session not found")
    if s.status == "closed":
        raise HTTPException(400, "Session is closed")
    # student must be enrolled in this class
    enrolled = db.query(Enrollment).filter(
        Enrollment.class_id == s.class_id,
        Enrollment.student_id == payload.student_id,
    ).first()
    if not enrolled:
        raise HTTPException(400, "Student is not enrolled in this class")
    # upsert: if already marked, update instead of duplicating
    row = db.query(Attendance).filter(
        Attendance.session_id == payload.session_id,
        Attendance.student_id == payload.student_id,
    ).first()
    if row:
        row.status = payload.status
        row.method = payload.method
        row.confidence = payload.confidence
    else:
        row = Attendance(**payload.model_dump())
        db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.get("/session/{session_id}", response_model=list[AttendanceOut])
def session_roster(
    session_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    return db.query(Attendance).filter(Attendance.session_id == session_id).all()

@router.get("/student/{student_id}")
def student_summary(
    student_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin", "student")),
):
    rows = db.query(Attendance).filter(Attendance.student_id == student_id).all()
    total = len(rows)
    attended = sum(1 for r in rows if r.status in ("present", "late"))
    pct = round(attended / total * 100, 1) if total else 0.0
    return {
        "student_id": student_id,
        "total_sessions": total,
        "attended": attended,
        "percentage": pct,
        "is_defaulter": pct < 75 if total else False,
        "records": [
            {"session_id": r.session_id, "status": r.status, "method": r.method, "marked_at": r.marked_at}
            for r in rows
        ],
    }