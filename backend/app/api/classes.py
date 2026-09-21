from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.models.subject import Subject
from app.models.class_ import Class
from app.models.user import User
from app.core.deps import require_role

router = APIRouter(tags=["classes"])

class SubjectCreate(BaseModel):
    code: str
    name: str
    teacher_id: int

class ClassCreate(BaseModel):
    subject_id: int
    schedule: str | None = None
    room: str | None = None

@router.post("/subjects", status_code=201)
def create_subject(payload: SubjectCreate, db: Session = Depends(get_db),
                   current: User = Depends(require_role("admin"))):
    if db.query(Subject).filter(Subject.code == payload.code).first():
        raise HTTPException(409, "Subject code already exists")
    s = Subject(**payload.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s

@router.get("/subjects")
def list_subjects(db: Session = Depends(get_db),
                  current: User = Depends(require_role("teacher", "admin"))):
    return db.query(Subject).all()

@router.post("", status_code=201)
def create_class(payload: ClassCreate, db: Session = Depends(get_db),
                 current: User = Depends(require_role("admin"))):
    if not db.query(Subject).filter(Subject.id == payload.subject_id).first():
        raise HTTPException(404, "Subject not found")
    c = Class(**payload.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@router.get("")
def list_classes(db: Session = Depends(get_db),
                 current: User = Depends(require_role("teacher", "admin"))):
    return db.query(Class).all()