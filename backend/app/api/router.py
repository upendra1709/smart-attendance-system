from fastapi import APIRouter
from app.api import (
    attendance,
    auth,
    classes,
    face,
    notifications,
    regularisation,
    reports,
    sessions,
    stats,
    students,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(sessions.router, prefix="/sessions")
api_router.include_router(attendance.router, prefix="/attendance")
api_router.include_router(users.router, prefix="/users")
api_router.include_router(classes.router, prefix="/classes")
api_router.include_router(reports.router, prefix="/reports")
api_router.include_router(students.router, prefix="/students")
api_router.include_router(regularisation.router, prefix="/regularisation-requests")
api_router.include_router(notifications.router, prefix="/notifications")
api_router.include_router(face.router, prefix="/face")
api_router.include_router(stats.teacher_router, prefix="/teacher")
api_router.include_router(stats.admin_router, prefix="/admin")
