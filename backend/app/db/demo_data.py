"""Demo data for presentations: 4 subjects, one class each, all demo students enrolled in all of them.

Everything here is idempotent: running it twice never duplicates anything.
"""
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.class_ import Class
from app.models.enrollment import Enrollment
from app.models.face_embedding import FaceEmbedding
from app.models.face_enrollment_request import FaceEnrollmentRequest
from app.models.notification import Notification
from app.models.regularisation import RegularisationRequest
from app.models.session_ import ClassSession
from app.models.subject import Subject
from app.models.user import User

TEACHER_EMAIL = "teacher@smartattend.com"
DEMO_STUDENT_PATTERN = "student%@smartattend.com"

# code, name, schedule, room
DEMO_SUBJECTS = [
    ("CS-301", "Machine Learning", "Mon 10:00-11:00", "A-204"),
    ("CS-302", "Evolutionary Algorithms and Optimization", "Tue 11:00-12:00", "A-205"),
    ("CS-303", "Cloud Computing and Virtualization", "Wed 10:00-11:00", "B-101"),
    ("MG-304", "Supply Chain Management", "Thu 14:00-15:00", "B-102"),
]


def demo_students(db: Session) -> list[User]:
    return (
        db.query(User)
        .filter(User.role == "student", User.email.like(DEMO_STUDENT_PATTERN))
        .order_by(User.id)
        .all()
    )


def ensure_demo_classes(db: Session) -> dict:
    """Create the 4 demo subjects/classes (assigned to the demo teacher) and enroll every demo student."""
    teacher = db.query(User).filter(User.email == TEACHER_EMAIL, User.role == "teacher").first()
    if not teacher:
        raise RuntimeError(f"Teacher {TEACHER_EMAIL} was not found. Run the seed first: python -m app.db.seed")
    students = demo_students(db)
    if not students:
        raise RuntimeError("No demo students (student1@smartattend.com ...) were found. Run the seed first.")

    created_classes, new_enrollments = 0, 0
    classes: list[Class] = []
    for code, name, schedule, room in DEMO_SUBJECTS:
        subject = db.query(Subject).filter(Subject.code == code).first()
        if not subject:
            subject = Subject(code=code, name=name, teacher_id=teacher.id)
            db.add(subject)
            db.flush()
        class_ = db.query(Class).filter(Class.subject_id == subject.id).order_by(Class.id).first()
        if not class_:
            class_ = Class(subject_id=subject.id, schedule=schedule, room=room)
            db.add(class_)
            db.flush()
            created_classes += 1
        classes.append(class_)
        enrolled_ids = {
            row[0] for row in db.query(Enrollment.student_id).filter(Enrollment.class_id == class_.id).all()
        }
        for student in students:
            if student.id not in enrolled_ids:
                db.add(Enrollment(class_id=class_.id, student_id=student.id))
                new_enrollments += 1
    db.commit()
    return {
        "classes": len(classes),
        "students": len(students),
        "created_classes": created_classes,
        "new_enrollments": new_enrollments,
    }


def reset_attendance(db: Session) -> dict:
    """Remove every session and attendance record so the demo starts from a clean slate."""
    requests = db.query(RegularisationRequest).delete(synchronize_session=False)
    records = db.query(Attendance).delete(synchronize_session=False)
    sessions = db.query(ClassSession).delete(synchronize_session=False)
    notices = db.query(Notification).filter(
        Notification.type.in_(["attendance", "warning", "face"])
    ).delete(synchronize_session=False)
    db.commit()
    return {"sessions": sessions, "attendance_records": records, "regularisation_requests": requests, "notifications": notices}


def reset_faces(db: Session) -> dict:
    """Remove all face enrollments and pending requests so the audience can watch an enrollment from zero."""
    requests = db.query(FaceEnrollmentRequest).delete(synchronize_session=False)
    faces = db.query(FaceEmbedding).delete(synchronize_session=False)
    db.commit()
    return {"face_enrollments": faces, "enrollment_requests": requests}
