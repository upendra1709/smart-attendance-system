import os
from pathlib import Path
import pytest

TEST_DB = Path("/tmp/smartattend_api_test.db")
if TEST_DB.exists():
    TEST_DB.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["JWT_SECRET"] = "test-secret"

from fastapi.testclient import TestClient
from app.main import app
from app.db.seed import run as seed


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        seed()
        yield test_client
    if TEST_DB.exists():
        TEST_DB.unlink()


def login(client: TestClient, email: str, password: str) -> dict[str, str]:
    response = client.post("/api/auth/login", data={"username": email, "password": password})
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}