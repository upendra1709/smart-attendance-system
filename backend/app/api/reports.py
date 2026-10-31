import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.deps import require_role
from app.db.database import get_db
from app.models.class_ import Class
from app.models.subject import Subject
from app.models.user import User
from app.services.academic import get_managed_session, roster_for_session

router = APIRouter(tags=["reports"])


@router.get("/session/{session_id}/csv")
def session_csv(
    session_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    session = get_managed_session(db, current, session_id)
    class_ = db.query(Class).filter(Class.id == session.class_id).first()
    subject = db.query(Subject).filter(Subject.id == class_.subject_id).first()
    roster, counts = roster_for_session(db, session)
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Subject", subject.code, subject.name])
    writer.writerow(["Session ID", session.id, "Starts At", session.starts_at, "Ends At", session.ends_at or ""])
    writer.writerow([])
    writer.writerow(["Student ID", "Roll Number", "Name", "Email", "Status", "Method", "Confidence", "Marked At"])
    for row in roster:
        writer.writerow([
            row["student_id"], row.get("roll_number") or "", row["name"], row["email"],
            row["status"], row.get("method") or "", row.get("confidence") or "", row.get("marked_at") or "",
        ])
    buffer.seek(0)
    filename = f"{subject.code}_session_{session.id}.csv".replace(" ", "_")
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
