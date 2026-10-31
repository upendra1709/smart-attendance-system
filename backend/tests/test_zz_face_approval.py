"""Face enrollment approval + confidence tiers.

Runs after test_workflows (file name sorts last) because that test expects a pristine seed.
A fake face engine is used so the ONNX models are not needed: an image's pixel value is the
angle (degrees) of a 2-D unit vector, so cosine similarity = cos(angle difference).
"""
import math
from datetime import datetime, timedelta, timezone

import cv2
import numpy as np
import pytest

from app.services.face_engine import FaceEngineError
from tests.conftest import login


class FakeEngine:
    def embedding(self, image, require_single=True):
        value = float(image[..., 0].mean())
        if value >= 250:  # white frame = nobody in view
            raise FaceEngineError("No face detected. Center one face in good lighting and try again.")
        angle = math.radians(value)
        return np.array([math.cos(angle), math.sin(angle)], dtype=np.float32)

    @staticmethod
    def similarity(first, second):
        return float(np.dot(first, second))


@pytest.fixture(autouse=True)
def fake_engine(monkeypatch):
    monkeypatch.setattr("app.api.face.get_face_engine", lambda: FakeEngine())


def frame(angle: int, name="f.png"):
    ok, buffer = cv2.imencode(".png", np.full((32, 32, 3), angle, dtype=np.uint8))
    assert ok
    return (name, buffer.tobytes(), "image/png")


def test_student_enrollment_needs_approval_then_confidence_tiers(client):
    teacher = login(client, "teacher@smartattend.com", "teacher123")
    student5 = login(client, "student5@smartattend.com", "student123")
    student6 = login(client, "student6@smartattend.com", "student123")
    student5_id = client.get("/api/auth/me", headers=student5).json()["id"]
    student6_id = client.get("/api/auth/me", headers=student6).json()["id"]

    # a brand-new session for the seeded class
    classes = client.get("/api/classes", headers=teacher).json()
    now = datetime.now(timezone.utc)
    created = client.post("/api/sessions", headers=teacher, json={
        "class_id": classes[0]["id"],
        "starts_at": (now - timedelta(minutes=5)).isoformat(),
        "ends_at": (now + timedelta(hours=1)).isoformat(),
    })
    assert created.status_code == 201, created.text
    session_id = created.json()["id"]

    # consent is mandatory
    no_consent = client.post("/api/face/self-enroll", headers=student5, data={"consent": "false"},
                             files=[("files", frame(0))])
    assert no_consent.status_code == 400

    # only students may self-enroll
    assert client.post("/api/face/self-enroll", headers=teacher, data={"consent": "true"},
                       files=[("files", frame(0))]).status_code == 403

    # student 5 submits angle 0, student 6 submits angle 90 (far away from the first)
    for headers, angle in ((student5, 0), (student6, 90)):
        sent = client.post("/api/face/self-enroll", headers=headers, data={"consent": "true"},
                           files=[("files", frame(angle)), ("files", frame(angle, "g.png"))])
        assert sent.status_code == 201, sent.text
        assert sent.json()["status"] == "pending"

    status = client.get(f"/api/face/status/{student5_id}", headers=student5).json()
    assert status["enrolled"] is False and status["request_status"] == "pending"

    # pending enrollments are NOT used for recognition
    before = client.post("/api/face/recognize", headers=teacher, data={"session_id": session_id},
                         files={"file": frame(0)})
    assert before.status_code == 200
    assert before.json()["matched"] is False
    assert "No approved" in before.json()["message"]

    # teacher sees the requests (and the student cannot)
    assert client.get("/api/face/requests", headers=student5).status_code == 403
    pending = client.get("/api/face/requests?status=pending", headers=teacher).json()
    req5 = next(item for item in pending if item["student_id"] == student5_id)
    req6 = next(item for item in pending if item["student_id"] == student6_id)

    # approve 5, reject 6
    ok = client.put(f"/api/face/requests/{req5['id']}/approve", headers=teacher, json={"review_note": "Looks good"})
    assert ok.status_code == 200 and ok.json()["status"] == "approved"
    rej = client.put(f"/api/face/requests/{req6['id']}/reject", headers=teacher, json={"review_note": "Too dark"})
    assert rej.status_code == 200 and rej.json()["status"] == "rejected"
    assert client.put(f"/api/face/requests/{req5['id']}/approve", headers=teacher).status_code == 409

    status = client.get(f"/api/face/status/{student5_id}", headers=student5).json()
    assert status["enrolled"] is True and status["request_status"] == "approved"
    status6 = client.get(f"/api/face/status/{student6_id}", headers=student6).json()
    assert status6["enrolled"] is False and status6["request_status"] == "rejected"
    assert status6["request_note"] == "Too dark"

    titles = [item["title"] for item in client.get("/api/notifications", headers=student5).json()]
    assert "Face enrollment approved" in titles

    # nobody in view: normal 200 in quiet (auto-scan) mode, 422 otherwise
    empty = client.post("/api/face/recognize", headers=teacher, data={"session_id": session_id, "quiet": "true"},
                        files={"file": frame(255)})
    assert empty.status_code == 200 and empty.json()["detected"] is False
    assert client.post("/api/face/recognize", headers=teacher, data={"session_id": session_id},
                       files={"file": frame(255)}).status_code == 422

    # LOW confidence (55 degrees -> cos ~ 0.57, between 0.45 and 0.60): needs confirmation, not marked
    low = client.post("/api/face/recognize", headers=teacher, data={"session_id": session_id},
                      files={"file": frame(55)}).json()
    assert low["matched"] is True and low["needs_confirmation"] is True
    assert low["student_id"] == student5_id and low["status"] is None
    roster = client.get(f"/api/sessions/{session_id}/roster", headers=teacher).json()["roster"]
    assert next(r for r in roster if r["student_id"] == student5_id)["status"] == "pending"

    # no match at all (70 degrees -> cos ~ 0.34)
    nomatch = client.post("/api/face/recognize", headers=teacher, data={"session_id": session_id},
                          files={"file": frame(70)}).json()
    assert nomatch["matched"] is False

    # teacher confirms the low-confidence match
    confirmed = client.post("/api/face/confirm", headers=teacher, json={
        "session_id": session_id, "student_id": student5_id, "confidence": low["confidence"]})
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["status"] == "present" and confirmed.json()["method"] == "face"

    # a student outside the class cannot be confirmed; students cannot confirm at all
    assert client.post("/api/face/confirm", headers=student5, json={
        "session_id": session_id, "student_id": student5_id}).status_code == 403

    # HIGH confidence on a fresh student: auto-marked, then repeated scans don't rewrite the record
    hi_student = login(client, "student7@smartattend.com", "student123")
    hi_id = client.get("/api/auth/me", headers=hi_student).json()["id"]
    assert client.post("/api/face/self-enroll", headers=hi_student, data={"consent": "true"},
                       files=[("files", frame(120))]).status_code == 201
    hi_req = next(i for i in client.get("/api/face/requests", headers=teacher).json() if i["student_id"] == hi_id)
    assert client.put(f"/api/face/requests/{hi_req['id']}/approve", headers=teacher).status_code == 200

    auto = client.post("/api/face/recognize", headers=teacher, data={"session_id": session_id},
                       files={"file": frame(120)}).json()
    assert auto["matched"] and not auto["needs_confirmation"] and auto["status"] == "present"
    again = client.post("/api/face/recognize", headers=teacher, data={"session_id": session_id},
                        files={"file": frame(120)}).json()
    assert again["already_marked"] is True

    close = client.post(f"/api/sessions/{session_id}/close", headers=teacher)
    assert close.status_code == 200


def test_missing_models_is_a_clear_503_not_a_silent_422(client, monkeypatch):
    from app.services.face_engine import FaceModelsMissingError

    def no_models():
        raise FaceModelsMissingError("Face model files are missing. Run 'python scripts/download_face_models.py'.")

    monkeypatch.setattr("app.api.face.get_face_engine", no_models)
    student = login(client, "student9@smartattend.com", "student123")
    response = client.post("/api/face/self-enroll", headers=student, data={"consent": "true"},
                           files=[("files", frame(10))])
    assert response.status_code == 503
    assert "download_face_models" in response.json()["detail"]
