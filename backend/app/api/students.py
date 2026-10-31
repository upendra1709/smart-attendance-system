from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import require_role
from app.db.database import get_db
from app.models.attendance import Attendance
from app.models.class_ import Class
from app.models.enrollment import Enrollment
from app.models.session_ import ClassSession
from app.models.subject import Subject
from app.models.user import User
from app.services.academic import class_attendance_percentage

router = APIRouter(tags=["students"])


@router.get("/me/classes")
def my_classes(
    db: Session = Depends(get_db),
    current: User = Depends(require_role("student")),
):
    rows = (
        db.query(Enrollment, Class, Subject, User)
        .join(Class, Class.id == Enrollment.class_id)
        .join(Subject, Subject.id == Class.subject_id)
        .join(User, User.id == Subject.teacher_id)
        .filter(Enrollment.student_id == current.id)
        .order_by(Subject.code)
        .all()
    )
    result = []
    for enrollment, class_, subject, teacher in rows:
        latest = (
            db.query(ClassSession)
            .filter(ClassSession.class_id == class_.id)
            .order_by(ClassSession.starts_at.desc(), ClassSession.id.desc())
            .first()
        )
        latest_session = None
        if latest:
            record = (
                db.query(Attendance)
                .filter(Attendance.session_id == latest.id, Attendance.student_id == current.id)
                .first()
            )
            latest_session = {
                "session_id": latest.id,
                "session_status": latest.status,  # open = class is running right now
                "starts_at": latest.starts_at,
                # present | late | absent | pending (pending = session still open, not marked yet)
                "attendance_status": record.status if record else ("pending" if latest.status == "open" else "absent"),
                "method": record.method if record else None,
                "marked_at": record.marked_at if record else None,
            }
        result.append(
            {
                "class_id": class_.id,
                "subject_code": subject.code,
                "subject_name": subject.name,
                "teacher_name": teacher.name,
                "schedule": class_.schedule,
                "room": class_.room,
                "attendance_percentage": class_attendance_percentage(db, class_.id, current.id),
                "latest_session": latest_session,
            }
        )
    return result
