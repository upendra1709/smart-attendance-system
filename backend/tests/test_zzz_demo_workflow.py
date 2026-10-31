"""The live-demo story, end to end, using a fake face engine (see test_zz_face_approval)."""
from datetime import datetime, timedelta, timezone

import pytest

from app.db.demo_data import ensure_demo_classes
from app.db.database import SessionLocal
from tests.conftest import login
from tests.test_zz_face_approval import FakeEngine, frame


@pytest.fixture(autouse=True)
def fake_engine(monkeypatch):
    monkeypatch.setattr("app.api.face.get_face_engine", lambda: FakeEngine())


def test_four_classes_and_live_attendance_flow(client):
    teacher = login(client, "teacher@smartattend.com", "teacher123")

    # 1. teacher has the four subjects, and every class has all 10 students
    subjects = client.get("/api/classes/subjects", headers=teacher).json()
    assert [s["code"] for s in subjects] == ["CS-301", "CS-302", "CS-303", "MG-304"]
    classes = {c["subject_id"]: c for c in client.get("/api/classes", headers=teacher).json()}
    by_code = {s["code"]: classes[s["id"]] for s in subjects}
    for code, class_ in by_code.items():
        students = client.get(f"/api/classes/{class_['id']}/students", headers=teacher).json()
        assert len(students) == 10, code

    # 2. running the setup again changes nothing
    db = SessionLocal()
    try:
        again = ensure_demo_classes(db)
    finally:
        db.close()
    assert again["created_classes"] == 0 and again["new_enrollments"] == 0

    # 3. a student sees all four classes, none running yet
    present_student = login(client, "student5@smartattend.com", "student123")   # face approved earlier
    absent_student = login(client, "student10@smartattend.com", "student123")
    mine = client.get("/api/students/me/classes", headers=present_student).json()
    assert [c["subject_code"] for c in mine] == ["CS-301", "CS-302", "CS-303", "MG-304"]
    assert next(c for c in mine if c["subject_code"] == "CS-302")["latest_session"] is None

    # 4. teacher starts a session for the 2nd class
    cs302 = by_code["CS-302"]
    now = datetime.now(timezone.utc)
    started = client.post("/api/sessions", headers=teacher, json={
        "class_id": cs302["id"],
        "starts_at": (now - timedelta(minutes=1)).isoformat(),
        "ends_at": (now + timedelta(hours=1)).isoformat(),
    })
    assert started.status_code == 201, started.text
    session_id = started.json()["id"]

    # students see it running, not marked yet
    live = next(c for c in client.get("/api/students/me/classes", headers=present_student).json()
                if c["subject_code"] == "CS-302")["latest_session"]
    assert live["session_status"] == "open" and live["attendance_status"] == "pending"

    # 5. camera: the enrolled student is recognised and marked present at once
    scan = client.post("/api/face/recognize", headers=teacher, data={"session_id": session_id, "quiet": "true"},
                       files={"file": frame(0)}).json()
    assert scan["matched"] and scan["status"] == "present"

    # an unknown face is not in the database -> no match, nobody is marked
    unknown = client.post("/api/face/recognize", headers=teacher, data={"session_id": session_id},
                          files={"file": frame(200)}).json()
    assert unknown["matched"] is False

    # the student sees PRESENT immediately, even though the class is still running
    live = next(c for c in client.get("/api/students/me/classes", headers=present_student).json()
                if c["subject_code"] == "CS-302")["latest_session"]
    assert live["attendance_status"] == "present" and live["method"] == "face"
    other = next(c for c in client.get("/api/students/me/classes", headers=absent_student).json()
                 if c["subject_code"] == "CS-302")["latest_session"]
    assert other["attendance_status"] == "pending"

    # 6. teacher closes the session: everyone not seen becomes absent
    assert client.post(f"/api/sessions/{session_id}/close", headers=teacher).status_code == 200
    other = next(c for c in client.get("/api/students/me/classes", headers=absent_student).json()
                 if c["subject_code"] == "CS-302")["latest_session"]
    assert other["attendance_status"] == "absent" and other["session_status"] == "closed"

    # 7. student dashboard data names the class
    me = client.get("/api/auth/me", headers=present_student).json()
    summary = client.get(f"/api/attendance/student/{me['id']}", headers=present_student).json()
    record = next(r for r in summary["records"] if r["session_id"] == session_id)
    assert record["subject_code"] == "CS-302" and record["status"] == "present"
