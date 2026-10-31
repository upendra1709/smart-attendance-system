from datetime import datetime, timezone

import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.config import FACE_AUTO_MARK_THRESHOLD, FACE_MATCH_THRESHOLD, MAX_FACE_IMAGE_BYTES
from app.core.deps import get_current_user, require_role
from app.db.database import get_db
from app.models.attendance import Attendance
from app.models.class_ import Class
from app.models.enrollment import Enrollment
from app.models.face_embedding import FaceEmbedding
from app.models.face_enrollment_request import FaceEnrollmentRequest
from app.models.subject import Subject
from app.models.user import User
from app.services.academic import get_managed_session, notify, upsert_attendance
from app.services.face_engine import (
    FaceEngineError,
    FaceModelsMissingError,
    embedding_from_bytes,
    embedding_to_bytes,
    get_face_engine,
)

router = APIRouter(tags=["face recognition"])


# --------------------------------------------------------------------------- helpers
async def decode_image(file: UploadFile) -> np.ndarray:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "Upload a JPEG or PNG camera image")
    content = await file.read(MAX_FACE_IMAGE_BYTES + 1)
    if len(content) > MAX_FACE_IMAGE_BYTES:
        raise HTTPException(413, "Camera image is too large")
    if not content:
        raise HTTPException(400, "Camera image is empty")
    array = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(400, "Camera image could not be decoded")
    return image


async def build_enrollment_embedding(files: list[UploadFile]) -> tuple[np.ndarray, int]:
    """Average the embeddings of 1-5 camera frames. Raw images are never kept."""
    if not 1 <= len(files) <= 5:
        raise HTTPException(400, "Provide between one and five enrollment images")
    try:
        engine = get_face_engine()
        embeddings = []
        for file in files:
            image = await decode_image(file)
            embeddings.append(engine.embedding(image, require_single=True))
        embedding = np.mean(np.stack(embeddings), axis=0).astype(np.float32)
        embedding /= np.linalg.norm(embedding)
    except FaceModelsMissingError as exc:
        raise HTTPException(503, str(exc)) from exc
    except FaceEngineError as exc:
        raise HTTPException(422, str(exc)) from exc
    return embedding, len(embeddings)


def save_approved_embedding(db: Session, student_id: int, embedding_bytes: bytes, dimensions: int, samples: int) -> None:
    record = db.query(FaceEmbedding).filter(FaceEmbedding.user_id == student_id).first()
    if not record:
        record = FaceEmbedding(user_id=student_id)
    record.embedding = embedding_bytes
    record.dimensions = dimensions
    record.samples = samples
    record.consent = True
    db.add(record)


def teacher_ids_for_student(db: Session, student_id: int) -> set[int]:
    rows = (
        db.query(Subject.teacher_id)
        .join(Class, Class.subject_id == Subject.id)
        .join(Enrollment, Enrollment.class_id == Class.id)
        .filter(Enrollment.student_id == student_id)
        .distinct()
        .all()
    )
    return {row[0] for row in rows}


def can_review_student(db: Session, reviewer: User, student_id: int) -> bool:
    if reviewer.role == "admin":
        return True
    return reviewer.id in teacher_ids_for_student(db, student_id)


# --------------------------------------------------------------------------- teacher/admin enrollment
@router.post("/enroll")
async def enroll_face(
    student_id: int = Form(...),
    consent: bool = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    """Teacher/admin enrolls a student directly. This counts immediately (no approval step)."""
    if not consent:
        raise HTTPException(400, "Student consent is required before storing face data")
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(404, "Student not found")
    embedding, samples = await build_enrollment_embedding(files)

    save_approved_embedding(db, student_id, embedding_to_bytes(embedding), int(embedding.size), samples)
    # a direct enrollment supersedes anything the student had waiting for review
    db.query(FaceEnrollmentRequest).filter(
        FaceEnrollmentRequest.user_id == student_id, FaceEnrollmentRequest.status == "pending"
    ).delete(synchronize_session=False)
    notify(
        db,
        student.id,
        "Face enrollment updated",
        f"Your face embedding was enrolled with {samples} camera sample(s). Raw photos were not stored.",
        "face",
    )
    db.commit()
    return {
        "enrolled": True,
        "student_id": student.id,
        "name": student.name,
        "samples": samples,
        "dimensions": int(embedding.size),
        "message": "Face embedding saved. Raw camera images were discarded.",
    }


# --------------------------------------------------------------------------- student self-enrollment (needs approval)
@router.post("/self-enroll", status_code=201)
async def self_enroll_face(
    consent: bool = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current: User = Depends(require_role("student")),
):
    """Student submits their own face. It is only used for recognition after a teacher/admin approves it."""
    if not consent:
        raise HTTPException(400, "You must consent before your face data can be stored")
    embedding, samples = await build_enrollment_embedding(files)

    # only one request waits for review at a time: a new submission replaces the old pending one
    db.query(FaceEnrollmentRequest).filter(
        FaceEnrollmentRequest.user_id == current.id, FaceEnrollmentRequest.status == "pending"
    ).delete(synchronize_session=False)
    request = FaceEnrollmentRequest(
        user_id=current.id,
        embedding=embedding_to_bytes(embedding),
        dimensions=int(embedding.size),
        samples=samples,
        consent=True,
        status="pending",
    )
    db.add(request)

    reviewers = set(teacher_ids_for_student(db, current.id))
    reviewers.update(row[0] for row in db.query(User.id).filter(User.role == "admin").all())
    for reviewer_id in reviewers:
        notify(
            db,
            reviewer_id,
            "Face enrollment awaiting approval",
            f"{current.name} submitted a face enrollment. Review it in Face Approvals.",
            "face",
        )
    notify(
        db,
        current.id,
        "Face enrollment submitted",
        "Your face enrollment is waiting for teacher or admin approval. Attendance by camera starts after it is approved.",
        "face",
    )
    db.commit()
    db.refresh(request)
    return {
        "request_id": request.id,
        "status": request.status,
        "samples": samples,
        "message": "Submitted for approval. Raw camera images were discarded.",
    }


@router.get("/requests")
def list_face_requests(
    status: str | None = "pending",
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    query = (
        db.query(FaceEnrollmentRequest, User)
        .join(User, User.id == FaceEnrollmentRequest.user_id)
        .order_by(FaceEnrollmentRequest.created_at.desc())
    )
    if status:
        query = query.filter(FaceEnrollmentRequest.status == status)
    if current.role == "teacher":
        student_ids = (
            db.query(Enrollment.student_id)
            .join(Class, Class.id == Enrollment.class_id)
            .join(Subject, Subject.id == Class.subject_id)
            .filter(Subject.teacher_id == current.id)
            .distinct()
        )
        query = query.filter(FaceEnrollmentRequest.user_id.in_(student_ids))
    enrolled_ids = {row[0] for row in db.query(FaceEmbedding.user_id).all()}
    return [
        {
            "id": request.id,
            "student_id": student.id,
            "name": student.name,
            "email": student.email,
            "roll_number": student.roll_number,
            "samples": request.samples,
            "status": request.status,
            "review_note": request.review_note,
            "already_enrolled": student.id in enrolled_ids,
            "created_at": request.created_at,
            "reviewed_at": request.reviewed_at,
        }
        for request, student in query.limit(200).all()
    ]


class FaceReview(BaseModel):
    review_note: str | None = Field(default=None, max_length=2000)


def _get_reviewable_request(db: Session, current: User, request_id: int) -> FaceEnrollmentRequest:
    request = db.query(FaceEnrollmentRequest).filter(FaceEnrollmentRequest.id == request_id).first()
    if not request:
        raise HTTPException(404, "Face enrollment request not found")
    if request.status != "pending":
        raise HTTPException(409, f"This request was already {request.status}")
    if not can_review_student(db, current, request.user_id):
        raise HTTPException(403, "This student is not in any of your classes")
    return request


@router.put("/requests/{request_id}/approve")
def approve_face_request(
    request_id: int,
    payload: FaceReview | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    request = _get_reviewable_request(db, current, request_id)
    save_approved_embedding(db, request.user_id, request.embedding, request.dimensions, request.samples)
    request.status = "approved"
    request.review_note = payload.review_note if payload else None
    request.reviewed_by = current.id
    request.reviewed_at = datetime.now(timezone.utc)
    notify(
        db,
        request.user_id,
        "Face enrollment approved",
        "Your face enrollment was approved. Camera attendance can now recognise you.",
        "face",
    )
    db.commit()
    return {"id": request.id, "status": request.status}


@router.put("/requests/{request_id}/reject")
def reject_face_request(
    request_id: int,
    payload: FaceReview | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    request = _get_reviewable_request(db, current, request_id)
    request.status = "rejected"
    request.review_note = payload.review_note if payload else None
    request.reviewed_by = current.id
    request.reviewed_at = datetime.now(timezone.utc)
    reason = f" Reason: {request.review_note}" if request.review_note else ""
    notify(
        db,
        request.user_id,
        "Face enrollment rejected",
        f"Your face enrollment was not approved. Please submit it again in good lighting.{reason}",
        "face",
    )
    db.commit()
    return {"id": request.id, "status": request.status}


# --------------------------------------------------------------------------- recognition
@router.post("/recognize")
async def recognize_face(
    session_id: int = Form(...),
    mark_attendance: bool = Form(default=True),
    quiet: bool = Form(default=False),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    """Match one camera frame against students enrolled in the session's class.

    - similarity >= FACE_AUTO_MARK_THRESHOLD  -> marked present automatically
    - similarity >= FACE_MATCH_THRESHOLD      -> matched, but the teacher must confirm (needs_confirmation)
    - otherwise                               -> no match

    ``quiet`` is for the automatic scanner that sends frames continuously: an empty frame
    (nobody in view) comes back as a normal response instead of an error.
    """
    session = get_managed_session(db, current, session_id)
    if mark_attendance and session.status != "open":
        raise HTTPException(400, "Face attendance requires an open session")
    try:
        image = await decode_image(file)
        engine = get_face_engine()
        probe = engine.embedding(image, require_single=True)
    except FaceModelsMissingError as exc:
        raise HTTPException(503, str(exc)) from exc
    except FaceEngineError as exc:
        if quiet:
            return {"matched": False, "detected": False, "session_id": session.id, "message": str(exc)}
        raise HTTPException(422, str(exc)) from exc

    enrolled_students = (
        db.query(User, FaceEmbedding)
        .join(FaceEmbedding, FaceEmbedding.user_id == User.id)
        .join(Enrollment, Enrollment.student_id == User.id)
        .filter(Enrollment.class_id == session.class_id, FaceEmbedding.consent.is_(True))
        .all()
    )
    if not enrolled_students:
        return {
            "matched": False,
            "detected": True,
            "session_id": session.id,
            "message": "No approved face enrollments exist for students in this class.",
        }

    best_student = None
    best_score = -1.0
    for student, face_record in enrolled_students:
        score = engine.similarity(probe, embedding_from_bytes(face_record.embedding))
        if score > best_score:
            best_student = student
            best_score = score

    if best_score < FACE_MATCH_THRESHOLD:
        return {
            "matched": False,
            "detected": True,
            "session_id": session.id,
            "confidence": round(best_score, 4),
            "threshold": FACE_MATCH_THRESHOLD,
            "message": "Face did not match any enrolled student in this class.",
        }

    confidence = round(best_score, 4)
    base = {
        "matched": True,
        "detected": True,
        "session_id": session.id,
        "student_id": best_student.id,
        "name": best_student.name,
        "confidence": confidence,
        "threshold": FACE_MATCH_THRESHOLD,
        "auto_threshold": FACE_AUTO_MARK_THRESHOLD,
        "needs_confirmation": False,
        "already_marked": False,
        "status": None,
        "method": None,
    }

    # Low confidence: never auto-mark, ask the teacher.
    if mark_attendance and best_score < FACE_AUTO_MARK_THRESHOLD:
        base["needs_confirmation"] = True
        base["message"] = f"Low-confidence match: is this {best_student.name}? Confirm to mark present."
        return base

    if not mark_attendance:
        base["message"] = f"{best_student.name} matched."
        return base

    existing = (
        db.query(Attendance)
        .filter(Attendance.session_id == session.id, Attendance.student_id == best_student.id)
        .first()
    )
    if existing and existing.status in {"present", "late"}:
        # automatic scanning sees the same face many times; don't rewrite the record or re-notify
        base.update(
            already_marked=True,
            status=existing.status,
            method=existing.method,
            message=f"{best_student.name} is already marked {existing.status}.",
        )
        return base

    attendance = upsert_attendance(db, session.id, best_student.id, "present", "face", confidence)
    notify(
        db,
        best_student.id,
        "Present by face recognition",
        f"You were marked present for session #{session.id} with {best_score:.1%} face similarity.",
        "face",
    )
    db.commit()
    db.refresh(attendance)
    base.update(
        status=attendance.status,
        method=attendance.method,
        message=f"{best_student.name} matched and was marked present.",
    )
    return base


class FaceConfirm(BaseModel):
    session_id: int
    student_id: int
    confidence: float | None = None


@router.post("/confirm")
def confirm_face_match(
    payload: FaceConfirm,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    """Teacher confirms a low-confidence match, which marks the student present."""
    session = get_managed_session(db, current, payload.session_id)
    if session.status != "open":
        raise HTTPException(400, "Face attendance requires an open session")
    enrolled = (
        db.query(Enrollment)
        .filter(Enrollment.class_id == session.class_id, Enrollment.student_id == payload.student_id)
        .first()
    )
    if not enrolled:
        raise HTTPException(404, "Student is not enrolled in this class")
    student = db.query(User).filter(User.id == payload.student_id).first()
    attendance = upsert_attendance(db, session.id, student.id, "present", "face", payload.confidence)
    notify(
        db,
        student.id,
        "Present (confirmed by teacher)",
        f"You were marked present for session #{session.id} after your teacher confirmed a face match.",
        "face",
    )
    db.commit()
    db.refresh(attendance)
    return {
        "matched": True,
        "confirmed": True,
        "session_id": session.id,
        "student_id": student.id,
        "name": student.name,
        "status": attendance.status,
        "method": attendance.method,
        "confidence": attendance.confidence,
        "message": f"{student.name} confirmed and marked present.",
    }


# --------------------------------------------------------------------------- status / listing
@router.get("/status/{student_id}")
def face_status(
    student_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    if current.role == "student" and current.id != student_id:
        raise HTTPException(403, "You can only view your own face enrollment status")
    record = db.query(FaceEmbedding).filter(FaceEmbedding.user_id == student_id).first()
    latest = (
        db.query(FaceEnrollmentRequest)
        .filter(FaceEnrollmentRequest.user_id == student_id)
        .order_by(FaceEnrollmentRequest.created_at.desc(), FaceEnrollmentRequest.id.desc())
        .first()
    )
    return {
        "student_id": student_id,
        "enrolled": record is not None,
        "samples": record.samples if record else 0,
        "consent": record.consent if record else False,
        "updated_at": record.updated_at if record else None,
        # latest self-enrollment request: pending | approved | rejected | null
        "request_status": latest.status if latest else None,
        "request_note": latest.review_note if latest else None,
        "request_submitted_at": latest.created_at if latest else None,
    }


@router.get("/enrollments")
def face_enrollments(
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    students = db.query(User).filter(User.role == "student").order_by(User.name).all()
    records = {record.user_id: record for record in db.query(FaceEmbedding).all()}
    pending = {
        row[0]
        for row in db.query(FaceEnrollmentRequest.user_id)
        .filter(FaceEnrollmentRequest.status == "pending")
        .all()
    }
    return [
        {
            "student_id": student.id,
            "name": student.name,
            "email": student.email,
            "roll_number": student.roll_number,
            "enrolled": student.id in records,
            "samples": records[student.id].samples if student.id in records else 0,
            "consent": records[student.id].consent if student.id in records else False,
            "updated_at": records[student.id].updated_at if student.id in records else None,
            "pending_approval": student.id in pending,
        }
        for student in students
    ]


@router.delete("/{student_id}", status_code=204)
def delete_face_embedding(
    student_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("admin")),
):
    record = db.query(FaceEmbedding).filter(FaceEmbedding.user_id == student_id).first()
    if not record:
        raise HTTPException(404, "Face enrollment not found")
    db.delete(record)
    db.commit()
