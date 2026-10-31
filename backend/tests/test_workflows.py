from tests.conftest import login


def user_id(client, headers, email):
    response = client.get("/api/users", headers=headers)
    assert response.status_code == 200, response.text
    return next(user["id"] for user in response.json() if user["email"] == email)


def test_complete_academic_workflow(client):
    admin = login(client, "admin@smartattend.com", "admin123")
    teacher = login(client, "teacher@smartattend.com", "teacher123")
    student1 = login(client, "student1@smartattend.com", "student123")
    student8 = login(client, "student8@smartattend.com", "student123")

    me = client.get("/api/auth/me", headers=student1)
    assert me.status_code == 200
    student1_id = me.json()["id"]
    student8_id = user_id(client, admin, "student8@smartattend.com")

    forbidden = client.get(f"/api/attendance/student/{student8_id}", headers=student1)
    assert forbidden.status_code == 403

    classes = client.get("/api/students/me/classes", headers=student1)
    assert classes.status_code == 200, classes.text
    assert classes.json()[0]["subject_code"] == "CS-301"

    sessions = client.get("/api/sessions", headers=teacher)
    assert sessions.status_code == 200, sessions.text
    closed = next(item for item in sessions.json() if item["status"] == "closed")
    open_session = next(item for item in sessions.json() if item["status"] == "open")

    roster = client.get(f"/api/sessions/{open_session['id']}/roster", headers=teacher)
    assert roster.status_code == 200, roster.text
    assert len(roster.json()["roster"]) == 10
    assert roster.json()["counts"]["pending"] == 10

    marked = client.post("/api/attendance", headers=teacher, json={
        "session_id": open_session["id"], "student_id": student1_id,
        "status": "present", "method": "manual",
    })
    assert marked.status_code == 201, marked.text

    summary = client.get(f"/api/attendance/student/{student1_id}", headers=student1)
    assert summary.status_code == 200
    assert summary.json()["total_sessions"] == 2
    assert summary.json()["attended"] == 2

    request = client.post("/api/regularisation-requests", headers=student8, json={
        "session_id": closed["id"], "requested_status": "present",
        "reason": "I attended but the camera did not recognize me.",
    })
    assert request.status_code == 201, request.text
    request_id = request.json()["id"]

    pending = client.get("/api/regularisation-requests?status=pending", headers=teacher)
    assert pending.status_code == 200, pending.text
    assert any(item["id"] == request_id for item in pending.json())

    approved = client.put(f"/api/regularisation-requests/{request_id}/approve", headers=teacher, json={"review_note": "Verified"})
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "approved"

    notifications = client.get("/api/notifications", headers=student8)
    assert notifications.status_code == 200
    assert any("Regularisation approved" in item["title"] for item in notifications.json())
    notification_id = notifications.json()[0]["id"]
    read = client.post(f"/api/notifications/{notification_id}/read", headers=student8)
    assert read.status_code == 200
    assert read.json()["read"] is True

    updated = client.patch("/api/users/me", headers=student1, json={"phone": "+911234567890", "section": "A"})
    assert updated.status_code == 200, updated.text
    assert updated.json()["phone"] == "+911234567890"

    teacher_stats = client.get("/api/teacher/stats", headers=teacher)
    assert teacher_stats.status_code == 200, teacher_stats.text
    assert teacher_stats.json()["total_students"] == 10

    admin_stats = client.get("/api/admin/stats", headers=admin)
    assert admin_stats.status_code == 200, admin_stats.text
    assert admin_stats.json()["total_students"] == 10

    report = client.get(f"/api/reports/session/{closed['id']}/csv", headers=teacher)
    assert report.status_code == 200, report.text
    assert "Student 8" in report.text

    closed_now = client.post(f"/api/sessions/{open_session['id']}/close", headers=teacher)
    assert closed_now.status_code == 200, closed_now.text
    final_roster = client.get(f"/api/sessions/{open_session['id']}/roster", headers=teacher)
    assert final_roster.json()["counts"]["pending"] == 0
    assert final_roster.json()["counts"]["absent"] == 9

    face_status = client.get(f"/api/face/status/{student1_id}", headers=student1)
    assert face_status.status_code == 200
    assert face_status.json()["enrolled"] is False
