import csv, io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.attendance import Attendance
from app.models.user import User
from app.core.deps import require_role

router = APIRouter(tags=["reports"])

@router.get("/session/{session_id}/csv")
def session_csv(
    session_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(require_role("teacher", "admin")),
):
    rows = db.query(Attendance, User.name).join(
        User, User.id == Attendance.student_id
    ).filter(Attendance.session_id == session_id).all()
    if not rows:
        raise HTTPException(404, "No attendance records for this session")

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Student ID", "Name", "Status", "Method", "Marked At"])
    for att, name in rows:
        writer.writerow([att.student_id, name, att.status, att.method, att.marked_at])
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=session_{session_id}.csv"},
    )