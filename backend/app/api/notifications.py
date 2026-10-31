from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(tags=["notifications"])


def serialize(item: Notification) -> dict:
    return {
        "id": item.id,
        "title": item.title,
        "message": item.message,
        "type": item.type,
        "read": item.read_at is not None,
        "read_at": item.read_at,
        "created_at": item.created_at,
    }


@router.get("")
def my_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    query = db.query(Notification).filter(Notification.user_id == current.id)
    if unread_only:
        query = query.filter(Notification.read_at.is_(None))
    return [serialize(item) for item in query.order_by(Notification.created_at.desc()).limit(100).all()]


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    item = db.query(Notification).filter(
        Notification.id == notification_id, Notification.user_id == current.id
    ).first()
    if not item:
        raise HTTPException(404, "Notification not found")
    if not item.read_at:
        item.read_at = datetime.now(timezone.utc)
        db.commit()
    return serialize(item)


@router.post("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    db.query(Notification).filter(
        Notification.user_id == current.id, Notification.read_at.is_(None)
    ).update({"read_at": datetime.now(timezone.utc)}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}
