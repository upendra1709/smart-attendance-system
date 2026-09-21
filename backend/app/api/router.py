from fastapi import APIRouter
from app.api import auth, sessions, attendance, users, classes, reports

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(sessions.router, prefix="/sessions")
api_router.include_router(attendance.router, prefix="/attendance")
api_router.include_router(users.router, prefix="/users")
api_router.include_router(classes.router, prefix="/classes")
api_router.include_router(reports.router, prefix="/reports")