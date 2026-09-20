from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine
from app.models import *  # noqa: F401  (registers all 8 tables)
from app.api.router import api_router

app = FastAPI(title="SmartAttend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)   # creates 8 tables automatically

@app.get("/")
def health():
    return {"status": "SmartAttend API is running"}

app.include_router(api_router, prefix="/api")