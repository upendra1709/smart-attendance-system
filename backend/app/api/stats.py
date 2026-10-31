from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.config import APP_TIMEZONE
from app.core.deps import require_role
from app.db.database import get_db
from app.models.attendance import Attendance
from app.models.class_ import Class
from app.models.enrollment import Enrollment
from app.models.session_ import ClassSession
from app.models.subject import Subject
from app.models.user import User
from app.services.academic import roster_for_session

LOCAL_TZ = ZoneInfo(APP_TIMEZONE)


def to_local(value: datetime) -> datetime:
    """Stored datetimes are naive UTC; convert to the institution timezone."""
    aware = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    return aware.astimezone(LOCAL_TZ)


teacher_router = APIRouter(tags=["teacher"])
admin_router = APIRouter(tags=["admin"])


@teacher_router.get("/stats")
def teacher_stats(
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher")),
):
    classes = db.query(Class).join(Subject, Subject.id == Class.subject_id).filter(
        Subject.teacher_id == current.id
    ).all()
    class_ids = [class_.id for class_ in classes]
    if not class_ids:
        return {
            "total_students": 0,
            "classes_today": 0,
            "avg_attendance": 0,
            "attention_count": 0,
            "today_classes": [],
        }
    total_students = db.query(Enrollment.student_id).filter(
        Enrollment.class_id.in_(class_ids)
    ).distinct().count()
    sessions = db.query(ClassSession).filter(ClassSession.class_id.in_(class_ids)).all()
    session_ids = [session.id for session in sessions]
    records = db.query(Attendance).filter(Attendance.session_id.in_(session_ids)).all() if session_ids else []
    attended = sum(record.status in {"present", "late"} for record in records)
    avg_attendance = round(attended / len(records) * 100, 1) if records else 0.0
    now = datetime.now(LOCAL_TZ)
    today = now.date()
    today_sessions = [session for session in sessions if to_local(session.starts_at).date() == today]
    today_classes = []
    for session in sorted(today_sessions, key=lambda item: item.starts_at):
        class_ = next(item for item in classes if item.id == session.class_id)
        subject = db.query(Subject).filter(Subject.id == class_.subject_id).first()
        roster, counts = roster_for_session(db, session)
        aware_start = to_local(session.starts_at)
        status = "COMPLETED" if session.status == "closed" else (
            "LIVE" if aware_start <= now else "UPCOMING"
        )
        end = session.ends_at or session.starts_at
        today_classes.append({
            "session_id": session.id,
            "code": subject.code,
            "name": subject.name,
            "time": f"{to_local(session.starts_at).strftime('%I:%M %p')} – {to_local(end).strftime('%I:%M %p')}",
            "students": len(roster),
            "present": counts["present"],
            "late": counts["late"],
            "absent": counts["absent"],
            "status": status,
        })
    attention_count = 0
    for class_ in classes:
        class_records = [record for record in records if next(s for s in sessions if s.id == record.session_id).class_id == class_.id]
        if class_records:
            class_attended = sum(record.status in {"present", "late"} for record in class_records)
            if class_attended / len(class_records) * 100 < 75:
                attention_count += 1
    return {
        "total_students": total_students,
        "classes_today": len(today_sessions),
        "avg_attendance": avg_attendance,
        "attention_count": attention_count,
        "today_classes": today_classes,
    }


@admin_router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    users = db.query(User).all()
    sessions = db.query(ClassSession).all()
    records = db.query(Attendance).all()
    attended = sum(record.status in {"present", "late"} for record in records)
    return {
        "total_students": sum(user.role == "student" for user in users),
        "total_teachers": sum(user.role == "teacher" for user in users),
        "total_classes": db.query(Class).count(),
        "total_sessions": len(sessions),
        "live_sessions": sum(session.status == "open" for session in sessions),
        "avg_attendance": round(attended / len(records) * 100, 1) if records else 0.0,
    }