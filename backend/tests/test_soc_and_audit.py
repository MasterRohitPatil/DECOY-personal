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
        "phones": ["+91 98765 43210", "+91 91234 56789"],
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
    assert "contacts" in data
    assert len(data["contacts"]) == 2
    assert "919876543210" in data["contacts"][0]["clean"]
    assert "919123456789" in data["contacts"][1]["clean"]

def test_warning_pdf_download_endpoint():
    # First get warnings
    w_res = client.get("/api/warnings")
    assert w_res.status_code == 200
    warnings = w_res.json()
    if warnings:
        target_id = warnings[0]["id"]
        pdf_res = client.get(f"/api/warnings/{target_id}/pdf")
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert pdf_res.content.startswith(b"%PDF")
        assert len(pdf_res.content) > 1000
