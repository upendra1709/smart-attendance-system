from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.attendance import Attendance
from app.models.class_ import Class
from app.models.enrollment import Enrollment
from app.models.notification import Notification
from app.models.session_ import ClassSession
from app.models.subject import Subject
from app.models.user import User


def notify(db: Session, user_id: int, title: str, message: str, type_: str = "general") -> None:
    db.add(Notification(user_id=user_id, title=title, message=message, type=type_))


def can_manage_class(db: Session, user: User, class_id: int) -> bool:
    if user.role == "admin":
        return db.query(Class).filter(Class.id == class_id).first() is not None
    return (
        db.query(Class)
        .join(Subject, Subject.id == Class.subject_id)
        .filter(Class.id == class_id, Subject.teacher_id == user.id)
        .first()
        is not None
    )


def require_class_manager(db: Session, user: User, class_id: int) -> None:
    if not can_manage_class(db, user, class_id):
        raise HTTPException(403, "You are not assigned to this class")


def get_managed_session(db: Session, user: User, session_id: int) -> ClassSession:
    session = db.query(ClassSession).filter(ClassSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    require_class_manager(db, user, session.class_id)
    return session


def upsert_attendance(
    db: Session,
    session_id: int,
    student_id: int,
    status: str,
    method: str = "manual",
    confidence: float | None = None,
) -> Attendance:
    row = (
        db.query(Attendance)
        .filter(Attendance.session_id == session_id, Attendance.student_id == student_id)
        .first()
    )
    if row:
        row.status = status
        row.method = method
        row.confidence = confidence
        row.marked_at = datetime.now(timezone.utc)
    else:
        row = Attendance(
            session_id=session_id,
            student_id=student_id,
            status=status,
            method=method,
            confidence=confidence,
        )
        db.add(row)
    db.flush()
    return row


def roster_for_session(db: Session, session: ClassSession) -> tuple[list[dict], dict]:
    enrollments = (
        db.query(Enrollment, User)
        .join(User, User.id == Enrollment.student_id)
        .filter(Enrollment.class_id == session.class_id)
        .order_by(User.name)
        .all()
    )
    records = db.query(Attendance).filter(Attendance.session_id == session.id).all()
    by_student = {record.student_id: record for record in records}
    roster = []
    counts = {"present": 0, "late": 0, "absent": 0, "pending": 0}

    for enrollment, student in enrollments:
        record = by_student.get(student.id)
        status = record.status if record else "pending"
        counts[status] += 1
        roster.append({
            "student_id": student.id,
            "name": student.name,
            "email": student.email,
            "roll_number": student.roll_number,
            "status": status,
            "method": record.method if record else None,
            "confidence": record.confidence if record else None,
            "marked_at": record.marked_at if record else None,
        })
    return roster, counts


def student_summary(db: Session, student_id: int) -> dict:
    rows = (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id)
        .order_by(Attendance.marked_at.desc())
        .all()
    )
    total = len(rows)
    attended = sum(row.status in {"present", "late"} for row in rows)
    percentage = round(attended / total * 100, 1) if total else 0.0
    subjects = {}
    if rows:
        for session_id, code, name in (
            db.query(ClassSession.id, Subject.code, Subject.name)
            .join(Class, Class.id == ClassSession.class_id)
            .join(Subject, Subject.id == Class.subject_id)
            .filter(ClassSession.id.in_({row.session_id for row in rows}))
            .all()
        ):
            subjects[session_id] = (code, name)
    return {
        "student_id": student_id,
        "total_sessions": total,
        "attended": attended,
        "percentage": percentage,
        "is_defaulter": percentage < 75 if total else False,
        "records": [
            {
                "session_id": row.session_id,
                "subject_code": subjects.get(row.session_id, (None, None))[0],
                "subject_name": subjects.get(row.session_id, (None, None))[1],
                "status": row.status,
                "method": row.method,
                "confidence": row.confidence,
                "marked_at": row.marked_at,
            }
            for row in rows
        ],
    }


def class_attendance_percentage(db: Session, class_id: int, student_id: int) -> float:
    session_ids = [
        row.id
        for row in db.query(ClassSession)
        .filter(ClassSession.class_id == class_id, ClassSession.status == "closed")
        .all()
    ]
    if not session_ids:
        return 0.0
    records = db.query(Attendance).filter(
        Attendance.session_id.in_(session_ids),
        Attendance.student_id == student_id,
    ).all()
    attended = sum(record.status in {"present", "late"} for record in records)
    return round(attended / len(session_ids) * 100, 1)
