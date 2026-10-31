from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, require_role
from app.db.database import get_db
from app.models.attendance import Attendance
from app.models.class_ import Class
from app.models.enrollment import Enrollment
from app.models.regularisation import RegularisationRequest
from app.models.session_ import ClassSession
from app.models.subject import Subject
from app.models.user import User
from app.schemas.regularisation import RegularisationCreate, RegularisationReview
from app.services.academic import get_managed_session, notify, upsert_attendance

router = APIRouter(tags=["regularisation"])


def serialize(db: Session, request: RegularisationRequest) -> dict:
    student = db.query(User).filter(User.id == request.student_id).first()
    session = db.query(ClassSession).filter(ClassSession.id == request.session_id).first()
    current_record = db.query(Attendance).filter(
        Attendance.session_id == request.session_id,
        Attendance.student_id == request.student_id,
    ).first()
    return {
        "id": request.id,
        "student_id": request.student_id,
        "student_name": student.name if student else "Unknown student",
        "student_email": student.email if student else None,
        "session_id": request.session_id,
        "class_id": session.class_id if session else None,
        "original_status": current_record.status if current_record else "absent",
        "requested_status": request.requested_status,
        "reason": request.reason,
        "status": request.status,
        "review_note": request.review_note,
        "created_at": request.created_at,
        "reviewed_at": request.reviewed_at,
    }


@router.post("", status_code=201)
def create_request(
    payload: RegularisationCreate,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("student")),
):
    session = db.query(ClassSession).filter(ClassSession.id == payload.session_id).first()
    if not session:
        raise HTTPException(404, "Session not found")
    enrolled = db.query(Enrollment).filter(
        Enrollment.class_id == session.class_id,
        Enrollment.student_id == current.id,
    ).first()
    if not enrolled:
        raise HTTPException(403, "You are not enrolled in this class")
    existing = db.query(RegularisationRequest).filter(
        RegularisationRequest.session_id == payload.session_id,
        RegularisationRequest.student_id == current.id,
        RegularisationRequest.status == "pending",
    ).first()
    if existing:
        raise HTTPException(409, "A pending request already exists for this session")
    request = RegularisationRequest(
        student_id=current.id,
        session_id=payload.session_id,
        requested_status=payload.requested_status,
        reason=payload.reason.strip(),
    )
    db.add(request)
    subject = db.query(Subject).join(Class, Class.subject_id == Subject.id).filter(Class.id == session.class_id).first()
    if subject:
        notify(
            db,
            subject.teacher_id,
            "New regularisation request",
            f"{current.name} requested {payload.requested_status} for session #{session.id}.",
            "regularisation",
        )
    db.commit()
    db.refresh(request)
    return serialize(db, request)


@router.get("")
def list_requests(
    status: str | None = Query(default=None),
    role: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    query = db.query(RegularisationRequest)
    if current.role == "student":
        query = query.filter(RegularisationRequest.student_id == current.id)
    elif current.role == "teacher":
        query = query.join(ClassSession, ClassSession.id == RegularisationRequest.session_id).join(
            Class, Class.id == ClassSession.class_id
        ).join(Subject, Subject.id == Class.subject_id).filter(Subject.teacher_id == current.id)
    if status:
        if status not in {"pending", "approved", "rejected"}:
            raise HTTPException(400, "Invalid request status")
        query = query.filter(RegularisationRequest.status == status)
    return [serialize(db, item) for item in query.order_by(RegularisationRequest.created_at.desc()).all()]


def review_request(
    request_id: int,
    decision: str,
    review_note: str | None,
    db: Session,
    current: User,
):
    request = db.query(RegularisationRequest).filter(RegularisationRequest.id == request_id).first()
    if not request:
        raise HTTPException(404, "Regularisation request not found")
    get_managed_session(db, current, request.session_id)
    if request.status != "pending":
        raise HTTPException(409, "This request has already been reviewed")
    request.status = decision
    request.review_note = review_note
    request.reviewed_by = current.id
    request.reviewed_at = datetime.now(timezone.utc)
    if decision == "approved":
        upsert_attendance(
            db,
            request.session_id,
            request.student_id,
            request.requested_status,
            "regularisation",
        )
    notify(
        db,
        request.student_id,
        f"Regularisation {decision}",
        f"Your request for session #{request.session_id} was {decision}." + (f" Note: {review_note}" if review_note else ""),
        "regularisation",
    )
    db.commit()
    return serialize(db, request)


@router.put("/{request_id}/approve")
def approve_request(
    request_id: int,
    payload: RegularisationReview | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    return review_request(request_id, "approved", payload.review_note if payload else None, db, current)


@router.put("/{request_id}/reject")
def reject_request(
    request_id: int,
    payload: RegularisationReview | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    return review_request(request_id, "rejected", payload.review_note if payload else None, db, current)
