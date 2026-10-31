from datetime import datetime, timedelta, timezone
from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.models import *  # noqa: F401,F403
from app.models.attendance import Attendance
from app.models.class_ import Class
from app.models.enrollment import Enrollment
from app.models.notification import Notification
from app.models.session_ import ClassSession
from app.models.subject import Subject
from app.models.user import User


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == "admin@smartattend.com").first():
            print("Already seeded — skipping.")
            return
        admin = User(name="System Admin", email="admin@smartattend.com", password_hash=hash_password("admin123"), role="admin", department="Administration")
        teacher = User(name="Dr. Sharma", email="teacher@smartattend.com", password_hash=hash_password("teacher123"), role="teacher", department="Computer Science")
        db.add_all([admin, teacher])
        db.flush()
        students = [
            User(
                name=f"Student {index}", email=f"student{index}@smartattend.com",
                password_hash=hash_password("student123"), role="student",
                roll_number=f"CS2026{index:03d}", department="Computer Science",
                course="B.Tech", semester="6", institution="SmartAttend Institute",
            )
            for index in range(1, 11)
        ]
        db.add_all(students)
        db.flush()
        subject = Subject(code="CS-301", name="Machine Learning", teacher_id=teacher.id)
        db.add(subject)
        db.flush()
        class_ = Class(subject_id=subject.id, schedule="Mon 10:00-11:00", room="A-204")
        db.add(class_)
        db.flush()
        db.add_all([Enrollment(class_id=class_.id, student_id=student.id) for student in students])
        now = datetime.now(timezone.utc)
        closed = ClassSession(class_id=class_.id, starts_at=now - timedelta(days=1, hours=1), ends_at=now - timedelta(days=1), status="closed")
        open_session = ClassSession(class_id=class_.id, starts_at=now - timedelta(minutes=10), ends_at=now + timedelta(minutes=50), status="open")
        db.add_all([closed, open_session])
        db.flush()
        for index, student in enumerate(students):
            status = "absent" if index in {7, 8} else ("late" if index == 6 else "present")
            db.add(Attendance(session_id=closed.id, student_id=student.id, status=status, method="manual"))
        db.add(Notification(user_id=admin.id, title="SmartAttend ready", message="Seed accounts, class enrollments and attendance sessions were created.", type="general"))
        db.commit()
        from app.db.demo_data import ensure_demo_classes

        ensure_demo_classes(db)
        print("Seeded admin, teacher, 10 students, 4 demo classes (all students enrolled), one closed and one open session.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
