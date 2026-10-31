from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import require_role
from app.db.database import get_db
from app.models.class_ import Class
from app.models.enrollment import Enrollment
from app.models.subject import Subject
from app.models.user import User
from app.schemas.classes import ClassCreate, EnrollmentCreate, SubjectCreate

router = APIRouter(tags=["classes"])


@router.post("/subjects", status_code=201)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    code = payload.code.strip().upper()
    if db.query(Subject).filter(Subject.code == code).first():
        raise HTTPException(409, "Subject code already exists")
    teacher = db.query(User).filter(User.id == payload.teacher_id, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(400, "Selected teacher does not exist")
    subject = Subject(code=code, name=payload.name.strip(), teacher_id=payload.teacher_id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/subjects")
def list_subjects(
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    query = db.query(Subject)
    if current.role == "teacher":
        query = query.filter(Subject.teacher_id == current.id)
    return query.order_by(Subject.code).all()


@router.post("", status_code=201)
def create_class(
    payload: ClassCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    if not db.query(Subject).filter(Subject.id == payload.subject_id).first():
        raise HTTPException(404, "Subject not found")
    class_ = Class(**payload.model_dump())
    db.add(class_)
    db.commit()
    db.refresh(class_)
    return class_


@router.get("")
def list_classes(
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    query = db.query(Class)
    if current.role == "teacher":
        query = query.join(Subject, Subject.id == Class.subject_id).filter(Subject.teacher_id == current.id)
    return query.order_by(Class.id).all()


@router.get("/{class_id}/students")
def class_students(
    class_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    class_ = db.query(Class).filter(Class.id == class_id).first()
    if not class_:
        raise HTTPException(404, "Class not found")
    if current.role == "teacher":
        subject = db.query(Subject).filter(Subject.id == class_.subject_id).first()
        if subject.teacher_id != current.id:
            raise HTTPException(403, "You are not assigned to this class")
    enrolled_ids = {
        row.student_id for row in db.query(Enrollment).filter(Enrollment.class_id == class_id).all()
    }
    students = db.query(User).filter(User.role == "student").order_by(User.name).all()
    return [
        {
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "roll_number": student.roll_number,
            "enrolled": student.id in enrolled_ids,
        }
        for student in students
    ]


@router.post("/{class_id}/enrollments", status_code=201)
def enroll_student(
    class_id: int,
    payload: EnrollmentCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    if not db.query(Class).filter(Class.id == class_id).first():
        raise HTTPException(404, "Class not found")
    student = db.query(User).filter(User.id == payload.student_id, User.role == "student").first()
    if not student:
        raise HTTPException(404, "Student not found")
    existing = db.query(Enrollment).filter(
        Enrollment.class_id == class_id, Enrollment.student_id == payload.student_id
    ).first()
    if existing:
        raise HTTPException(409, "Student is already enrolled in this class")
    enrollment = Enrollment(class_id=class_id, student_id=payload.student_id)
    db.add(enrollment)
    db.commit()
    return {"class_id": class_id, "student_id": payload.student_id, "enrolled": True}


@router.delete("/{class_id}/enrollments/{student_id}", status_code=204)
def remove_enrollment(
    class_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.class_id == class_id, Enrollment.student_id == student_id
    ).first()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")
    db.delete(enrollment)
    db.commit()
