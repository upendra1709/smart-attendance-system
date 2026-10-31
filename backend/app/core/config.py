import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[2]
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'smartattend.db'}")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

JWT_SECRET = os.getenv("JWT_SECRET", "development-only-change-me")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if origin.strip()]
# Timezone used to decide "today" and to print class times (database stores UTC)
APP_TIMEZONE = os.getenv("APP_TIMEZONE", "Asia/Kolkata")
FACE_MATCH_THRESHOLD = float(os.getenv("FACE_MATCH_THRESHOLD", "0.45"))
# At or above this similarity the match is marked automatically.
# Between FACE_MATCH_THRESHOLD and this value the teacher must confirm the match.
FACE_AUTO_MARK_THRESHOLD = max(
    float(os.getenv("FACE_AUTO_MARK_THRESHOLD", "0.60")), FACE_MATCH_THRESHOLD
)
FACE_MODEL_DIR = Path(os.getenv("FACE_MODEL_DIR", str(BASE_DIR / "models")))
MAX_FACE_IMAGE_BYTES = int(os.getenv("MAX_FACE_IMAGE_BYTES", str(8 * 1024 * 1024)))