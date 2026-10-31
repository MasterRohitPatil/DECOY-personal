import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_audit_trail_endpoint():
    response = client.get("/api/audit")
    assert response.status_code == 200
    data = response.json()
    assert "merkle_root" in data
    assert "records" in data
    assert data["verified"] is True
    if data["records"]:
        assert "hash" in data["records"][0]
        assert len(data["records"][0]["hash"]) == 64

def test_soc_team_endpoints():
    response = client.get("/api/soc/team")
    assert response.status_code == 200
    team = response.json()
    assert "senior_analysts" in team
    assert "junior_analysts" in team
    assert team["max_junior_allowed"] == 3
    assert len(team["senior_analysts"]) >= 1

def test_soc_chat_endpoints():
    response = client.get("/api/soc/chat?channel=general")
    assert response.status_code == 200
    messages = response.json()
    assert isinstance(messages, list)
    assert len(messages) >= 1

    # Post message
    post_res = client.post("/api/soc/chat/message", json={
        "text": "Automated test message for SOC alert triage",
        "channel": "general",
        "senderName": "Test Bot",
        "senderRole": "Automated Defense"
    })
    assert post_res.status_code == 200
    assert post_res.json()["text"] == "Automated test message for SOC alert triage"

def test_otp_flow():
    # Request OTP
    req_res = client.post("/api/alerts/otp/request", json={"email": "ciso@gov.in"})
    assert req_res.status_code == 200
    assert req_res.json()["status"] == "OTP_DISPATCHED"
    otp = req_res.json()["preview_otp_for_hackathon"]

    # Verify OTP
    verify_res = client.post("/api/alerts/otp/verify", json={"code": otp})
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "VERIFIED"
    assert "token" in verify_res.json()

