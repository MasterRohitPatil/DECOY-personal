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

def test_smtp_status_endpoint():
    response = client.get("/api/alerts/smtp-status")
    assert response.status_code == 200
    data = response.json()
    assert "configured" in data
    assert "host" in data
    assert "port" in data

def test_whatsapp_link_endpoint():
    response = client.post("/api/alerts/whatsapp-link", json={
        "phone": "+919876543210",
        "title": "Critical NGINX RCE",
        "warning_id": "W-2026-001",
        "target_hostname": "auth-srv-01",
        "source_ip": "185.220.101.5",
        "risk_score": 93.4,
        "band": "CRITICAL",
        "recommended_action": "Isolate container"
    })
    assert response.status_code == 200
    data = response.json()
    assert "wa_deep_link" in data
    assert "wa.me/919876543210" in data["wa_deep_link"]
