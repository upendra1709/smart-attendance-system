from app.db.database import Base, engine, SessionLocal
from app.models import *  # noqa: F401
from app.models.user import User
from app.models.subject import Subject
from app.models.class_ import Class
from app.models.enrollment import Enrollment
from app.core.security import hash_password

def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == "admin@smartattend.com").first():
            print("Already seeded — skipping.")
            return

        admin = User(name="Admin", email="admin@smartattend.com",
                     password_hash=hash_password("admin123"), role="admin")
        teacher = User(name="Dr. Sharma", email="teacher@smartattend.com",
                       password_hash=hash_password("teacher123"), role="teacher")
        db.add_all([admin, teacher])
        db.flush()

        students = [User(name=f"Student {i}", email=f"student{i}@smartattend.com",
                         password_hash=hash_password("student123"), role="student")
                    for i in range(1, 11)]
        db.add_all(students)
        db.flush()

        subject = Subject(code="CS-301", name="Machine Learning", teacher_id=teacher.id)
        db.add(subject)
        db.flush()

        cls = Class(subject_id=subject.id, schedule="Mon 10:00-11:00", room="A-204")
        db.add(cls)
        db.flush()

        db.add_all([Enrollment(class_id=cls.id, student_id=s.id) for s in students])
        db.commit()
        print("Seeded: 1 admin, 1 teacher, 10 students, CS-301 class with enrollments")
    finally:
        db.close()

if __name__ == "__main__":
    run()